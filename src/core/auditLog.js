'use strict';
/**
 * auditLog.js
 * Doktor onay/red/düzenleme aksiyonlarını ve sistem olaylarını loglar.
 * knowledge-base.md §6.2 — AuditLog şeması
 *
 * Bu MVP'de kayıtlar bellekte tutulur (production'da DB'e yazılır).
 */

const { v4: uuidv4 } = require('uuid');
const diffLib = require('diff');

// In-memory store (MVP için)
const _logs = [];

/**
 * Doktor geri bildirimi (APPROVE | EDIT | REJECT) kaydeder.
 * @param {{ componentId, action, userId, previousContent, finalContent, meta }} params
 * @returns {AuditLogEntry}
 */
function logFeedback({ componentId, action, userId, previousContent, finalContent, meta = {} }) {
  const validActions = ['APPROVE', 'EDIT', 'REJECT'];
  if (!validActions.includes(action)) {
    throw new Error(`Geçersiz aksiyon: ${action}. Beklenen: ${validActions.join(', ')}`);
  }

  // Diff hesapla (EDIT aksiyonunda)
  let diffResult = null;
  if (action === 'EDIT' && previousContent && finalContent) {
    diffResult = diffLib.diffWords(previousContent, finalContent).map((part) => ({
      added: part.added ?? false,
      removed: part.removed ?? false,
      value: part.value,
    }));
  }

  const entry = {
    logId: `log_${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    userId: userId || 'unknown',
    componentId,
    action,
    previousContent: previousContent || '',
    finalContent: finalContent || previousContent || '',
    diff: diffResult,
    metaData: {
      hadContradiction: meta.hadContradiction ?? false,
      missingDataCountAtExecution: meta.missingDataCountAtExecution ?? 0,
    },
  };

  _logs.push(entry);
  return entry;
}

/**
 * Sistem olayı loglar (analiz başlangıcı, hata vb.)
 * @param {{ event, detail }} params
 * @returns {SystemLogEntry}
 */
function logSystemEvent({ event, detail = {} }) {
  const entry = {
    logId: `syslog_${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    event,
    detail,
  };
  _logs.push(entry);
  return entry;
}

/**
 * Tüm logları döner.
 * @returns {Array}
 */
function getAllLogs() {
  return [..._logs];
}

/**
 * Belirli componentId'ye ait logları döner.
 * @param {string} componentId
 * @returns {Array}
 */
function getLogsByComponent(componentId) {
  return _logs.filter((l) => l.componentId === componentId);
}

module.exports = { logFeedback, logSystemEvent, getAllLogs, getLogsByComponent };
