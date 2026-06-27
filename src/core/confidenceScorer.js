'use strict';
/**
 * confidenceScorer.js
 * Kanıt nesnelerini knowledge-base.md §1.2 kurallarına göre
 * 0-100 arası dinamik güven puanı ile değerlendirir.
 *
 * Kural özeti:
 *   Base score:
 *     lab_report / radiology_report → 50
 *     physician_note                → 40
 *     epicrisis                     → 40
 *     patient_history               → 20
 *
 *   Temporal decay (gün cinsinden yaş):
 *     ≤ 30 gün  → +10 bonus
 *     31-180 gün → -10
 *     > 180 gün → -25  (kronik kategoriler hariç)
 *
 *   Contradiction penalty:
 *     Çelişkili işaretliyse → -40
 */

const dayjs = require('dayjs');

const CHRONIC_KEYS = new Set(['family_pancreatic_disease', 'allergy_status']);

const BASE_SCORES = {
  lab_report: 50,
  radiology_report: 50,
  physician_note: 40,
  epicrisis: 40,
  patient_history: 20,
};

/**
 * Tek bir kanıtı puanlar ve scoreFactors'ı günceller.
 * @param {Evidence} evidence
 * @param {boolean}  [hasContradiction=false]
 * @returns {Evidence} güncellenen kanıt (mutasyon + döndürme)
 */
function scoreEvidence(evidence, hasContradiction = false) {
  const factors = [];
  let score = 0;

  // 1. Base score
  const base = BASE_SCORES[evidence.sourceType] ?? 20;
  score += base;
  factors.push(`base(${evidence.sourceType}):+${base}`);

  // 2. Temporal decay
  const ageDays = dayjs().diff(dayjs(evidence.date), 'day');
  if (ageDays <= 30) {
    score += 10;
    factors.push('temporal(<30g):+10');
  } else if (ageDays <= 180) {
    score -= 10;
    factors.push('temporal(1-6ay):-10');
  } else {
    if (!CHRONIC_KEYS.has(evidence.clinicalKey)) {
      score -= 25;
      factors.push('temporal(>6ay):-25');
    } else {
      factors.push('temporal(>6ay,kronik):0');
    }
  }

  // 3. Contradiction penalty
  if (hasContradiction) {
    score -= 40;
    factors.push('contradiction_penalty:-40');
  }

  // Skor 0-100 aralığına kilitle
  score = Math.max(0, Math.min(100, score));

  evidence.confidenceScore = score;
  evidence.scoreFactors = factors;
  return evidence;
}

/**
 * Tüm kanıtlar listesini puanlar.
 * conflictedIds: contradictionEngine'den gelen çelişkili evidenceId seti
 * @param {Evidence[]} evidences
 * @param {Set<string>} [conflictedIds]
 * @returns {Evidence[]}
 */
function scoreAll(evidences, conflictedIds = new Set()) {
  return evidences.map((ev) => scoreEvidence(ev, conflictedIds.has(ev.evidenceId)));
}

module.exports = { scoreEvidence, scoreAll };
