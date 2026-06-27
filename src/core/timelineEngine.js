'use strict';
/**
 * timelineEngine.js
 * Kanıtları tarihe göre sıralar ve renk kodlu metadata ekler.
 * Renk kodu: Mavi=lab, Sarı=semptom/risk, Kırmızı=radyoloji, Gri=belirsiz
 */

const COLOR_MAP = {
  laboratory: 'blue',
  symptom: 'yellow',
  risk_factor: 'yellow',
  family_history: 'yellow',
  medication: 'yellow',
  radiology: 'red',
};

function buildTimeline(evidences) {
  const sorted = [...evidences].sort((a, b) => new Date(a.date) - new Date(b.date));

  return sorted.map((ev) => ({
    date: ev.date,
    evidenceId: ev.evidenceId,
    sourceId: ev.sourceId,
    clinicalKey: ev.clinicalKey,
    value: ev.value,
    category: ev.category,
    color: COLOR_MAP[ev.category] ?? 'gray',
    confidenceScore: ev.confidenceScore,
  }));
}

module.exports = { buildTimeline };
