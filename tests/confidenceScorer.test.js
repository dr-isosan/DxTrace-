'use strict';
/**
 * confidenceScorer.test.js
 * Güven puanlama algoritması testleri.
 * knowledge-base §1.2 kuralları doğrulanır.
 */

const dayjs = require('dayjs');
const { scoreEvidence, scoreAll } = require('../src/core/confidenceScorer');

function makeEvidence(overrides = {}) {
  return {
    evidenceId: 'ev_test',
    sourceId: 'doc_x',
    sourceType: 'physician_note',
    date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    category: 'laboratory',
    clinicalKey: 'glucose',
    value: 92,
    unit: 'mg/dL',
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: '',
    ...overrides,
  };
}

describe('ConfidenceScorer — Base Score', () => {
  test('lab_report: base score 50 ile başlamalı', () => {
    const ev = makeEvidence({ sourceType: 'lab_report', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, false);
    // <30g: +10 bonus → 60
    expect(scored.confidenceScore).toBe(60);
    expect(scored.scoreFactors).toContain('base(lab_report):+50');
  });

  test('physician_note: base score 40 olmalı', () => {
    const ev = makeEvidence({ sourceType: 'physician_note', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, false);
    // 40 + 10 = 50
    expect(scored.confidenceScore).toBe(50);
  });

  test('patient_history: base score 20 olmalı', () => {
    const ev = makeEvidence({ sourceType: 'patient_history', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, false);
    // 20 + 10 = 30
    expect(scored.confidenceScore).toBe(30);
  });
});

describe('ConfidenceScorer — Temporal Decay', () => {
  test('Son 30 gün: +10 bonus almalı', () => {
    const ev = makeEvidence({ sourceType: 'lab_report', date: dayjs().subtract(5, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, false);
    expect(scored.scoreFactors.some((f) => f.includes('temporal(<30g)'))).toBe(true);
    expect(scored.confidenceScore).toBe(60); // 50 + 10
  });

  test('1-6 ay arası: -10 ceza uygulanmalı', () => {
    const ev = makeEvidence({ sourceType: 'lab_report', date: dayjs().subtract(90, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, false);
    expect(scored.scoreFactors.some((f) => f.includes('temporal(1-6ay)'))).toBe(true);
    expect(scored.confidenceScore).toBe(40); // 50 - 10
  });

  test('6 aydan eski (kronik olmayan): -25 ceza uygulanmalı', () => {
    const ev = makeEvidence({ sourceType: 'lab_report', date: dayjs().subtract(250, 'day').format('YYYY-MM-DD'), clinicalKey: 'glucose' });
    const scored = scoreEvidence(ev, false);
    expect(scored.scoreFactors.some((f) => f.includes('temporal(>6ay):-25'))).toBe(true);
    expect(scored.confidenceScore).toBe(25); // 50 - 25
  });

  test('6 aydan eski ancak kronik anahtar: -25 uygulanmamalı', () => {
    const ev = makeEvidence({
      sourceType: 'lab_report',
      date: dayjs().subtract(250, 'day').format('YYYY-MM-DD'),
      clinicalKey: 'allergy_status',
      category: 'risk_factor',
    });
    const scored = scoreEvidence(ev, false);
    expect(scored.scoreFactors.some((f) => f.includes('kronik'))).toBe(true);
    expect(scored.confidenceScore).toBe(50); // 50 + 0 (kronik hariç)
  });
});

describe('ConfidenceScorer — Contradiction Penalty', () => {
  test('Çelişkili kanıta -40 cezası uygulanmalı', () => {
    const ev = makeEvidence({ sourceType: 'physician_note', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, true); // hasContradiction = true
    // 40 + 10 - 40 = 10
    expect(scored.confidenceScore).toBe(10);
    expect(scored.scoreFactors.some((f) => f.includes('contradiction_penalty:-40'))).toBe(true);
  });

  test('Skor 0\'ın altına düşmemeli', () => {
    const ev = makeEvidence({ sourceType: 'patient_history', date: dayjs().subtract(250, 'day').format('YYYY-MM-DD') });
    const scored = scoreEvidence(ev, true);
    // 20 - 25 - 40 = -45 → clamped to 0
    expect(scored.confidenceScore).toBe(0);
  });

  test('scoreAll: conflictedIds kümesindeki kanıtlara ceza uygulanmalı', () => {
    const ev1 = makeEvidence({ evidenceId: 'ev_conflict_1', sourceType: 'lab_report', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });
    const ev2 = makeEvidence({ evidenceId: 'ev_clean_1', sourceType: 'lab_report', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD') });

    const conflictedIds = new Set(['ev_conflict_1']);
    const scored = scoreAll([ev1, ev2], conflictedIds);

    const conflicted = scored.find((e) => e.evidenceId === 'ev_conflict_1');
    const clean = scored.find((e) => e.evidenceId === 'ev_clean_1');

    expect(conflicted.confidenceScore).toBeLessThan(clean.confidenceScore);
    expect(conflicted.confidenceScore).toBe(20); // 50 + 10 - 40
    expect(clean.confidenceScore).toBe(60);      // 50 + 10
  });
});
