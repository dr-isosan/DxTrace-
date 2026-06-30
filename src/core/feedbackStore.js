'use strict';
/**
 * feedbackStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Çıktıları için Geri Besleme Döngüsü (Feedback Loop Store)
 *
 * Doktor aksiyonlarını (APPROVE / EDIT / REJECT) iki katmanda saklar:
 *   1. In-memory  → hızlı okuma (auditLog.js zaten bunu yapıyor)
 *   2. JSON dosyası → kalıcı depolama, LLM prompt iyileştirmesi için kaynak
 *
 * Üretim ortamında bu JSON dosyası yerine PostgreSQL / MongoDB tablosu kullanılır.
 * Şema: knowledge-base.md §6.2 — LLMFeedbackLog
 *
 * Neden ayrı bir tablo/store?
 *   - REJECT ve EDIT aksiyonları LLM'in "halüsinasyon yakalandı" verisini taşır.
 *   - Bu veri, fine-tuning veya RAG context kararları için kullanılabilir.
 *   - APPROVE aksiyonları "golden example" olarak prompt'lara eklenebilir.
 */

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Veri klasörü — src/data/ altında tutulur
const DATA_DIR  = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'llm_feedback_log.json');

// ── Başlangıç yükleme ────────────────────────────────────────────────────────
let _feedbackLog = [];

function _loadFromDisk() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      _feedbackLog = JSON.parse(raw);
    } else {
      _feedbackLog = [];
      _persist();
    }
  } catch (err) {
    console.warn('[feedbackStore] JSON okunamadı, boş başlatılıyor:', err.message);
    _feedbackLog = [];
  }
}

function _persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(_feedbackLog, null, 2), 'utf8');
  } catch (err) {
    console.error('[feedbackStore] Diske yazılamadı:', err.message);
  }
}

// Modül yüklendiğinde mevcut logları oku
_loadFromDisk();

// ── Şema ─────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} FeedbackEntry
 * @property {string}  id                  - Benzersiz kayıt kimliği
 * @property {string}  timestamp           - ISO 8601 zaman damgası
 * @property {string}  componentId         - Hangi AI bileşeni? (ör: cas_gi_01_output)
 * @property {string}  action              - APPROVE | EDIT | REJECT
 * @property {string}  doctorId            - Doktor kimliği
 * @property {string}  aiOutput            - AI'ın orijinal çıktısı
 * @property {string|null} doctorRevision  - Doktorun düzeltmesi (EDIT'de dolu)
 * @property {boolean} isHallucination     - REJECT → true, APPROVE → false
 * @property {string}  changeType          - 'GOLDEN_EXAMPLE' | 'HALLUCINATION' | 'MINOR_EDIT' | 'NO_CHANGE'
 * @property {Object}  context             - Aksiyonun bağlamı (çelişki, eksik veri vb.)
 */

// ── Yardımcı fonksiyon: aksiyon → change type sınıflandırması ───────────────
function _classifyChange(action, previousContent, finalContent) {
  if (action === 'APPROVE')  return 'GOLDEN_EXAMPLE';
  if (action === 'REJECT')   return 'HALLUCINATION';
  // EDIT: metinler farklı mı?
  if (previousContent && finalContent && previousContent.trim() !== finalContent.trim()) {
    return 'MINOR_EDIT';
  }
  return 'NO_CHANGE';
}

// ── Ana API ──────────────────────────────────────────────────────────────────

/**
 * Doktor geri bildirimini kalıcı olarak kaydeder.
 * auditLog.js'in logFeedback'ini tamamlayıcı niteliktedir.
 *
 * @param {Object} params
 * @param {string} params.componentId
 * @param {string} params.action      - APPROVE | EDIT | REJECT
 * @param {string} params.doctorId
 * @param {string} params.aiOutput        - AI'ın orijinal çıktısı
 * @param {string} [params.doctorRevision] - Düzenlenmiş metin (EDIT için)
 * @param {Object} [params.context]       - hadContradiction, missingDataCount vb.
 * @returns {FeedbackEntry}
 */
function recordFeedback({ componentId, action, doctorId, aiOutput, doctorRevision, context = {} }) {
  const isHallucination = action === 'REJECT';
  const changeType = _classifyChange(action, aiOutput, doctorRevision);

  const entry = {
    id:              `fb_${uuidv4().slice(0, 8)}`,
    timestamp:       new Date().toISOString(),
    componentId,
    action,
    doctorId,
    aiOutput:        aiOutput || '',
    doctorRevision:  doctorRevision || null,
    isHallucination,
    changeType,
    context: {
      hadContradiction:          context.hadContradiction ?? false,
      missingDataCountAtExecution: context.missingDataCountAtExecution ?? 0,
      caseId:                    context.caseId ?? null,
      notes:                     context.notes ?? null,
    },
  };

  _feedbackLog.push(entry);
  _persist();

  // Konsola kısa özet yaz (üretimde logger'a gider)
  const icon = action === 'APPROVE' ? '✅' : action === 'REJECT' ? '🚫' : '✏️';
  console.log(`[feedbackStore] ${icon} ${changeType} — ${componentId} — ${doctorId} @ ${entry.timestamp}`);

  return entry;
}

/**
 * Tüm feedback kayıtlarını döner.
 * @returns {FeedbackEntry[]}
 */
function getAllFeedback() {
  return [..._feedbackLog];
}

/**
 * Belirli bir aksiyona göre filtrele (APPROVE | EDIT | REJECT).
 * @param {string} action
 * @returns {FeedbackEntry[]}
 */
function getFeedbackByAction(action) {
  return _feedbackLog.filter(e => e.action === action);
}

/**
 * Belirli bir componentId'ye ait kayıtları döner.
 * @param {string} componentId
 * @returns {FeedbackEntry[]}
 */
function getFeedbackByComponent(componentId) {
  return _feedbackLog.filter(e => e.componentId === componentId);
}

/**
 * İstatistik özeti döner — prompt iyileştirme raporları için.
 * @returns {Object}
 */
function getFeedbackStats() {
  const total      = _feedbackLog.length;
  const approved   = _feedbackLog.filter(e => e.action === 'APPROVE').length;
  const rejected   = _feedbackLog.filter(e => e.action === 'REJECT').length;
  const edited     = _feedbackLog.filter(e => e.action === 'EDIT').length;
  const hallucinationRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0';

  return {
    total,
    approved,
    rejected,
    edited,
    hallucinationRate: `${hallucinationRate}%`,
    goldenExamples: approved,
    storeFile: STORE_PATH,
  };
}

module.exports = {
  recordFeedback,
  getAllFeedback,
  getFeedbackByAction,
  getFeedbackByComponent,
  getFeedbackStats,
};
