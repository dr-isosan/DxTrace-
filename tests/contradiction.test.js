'use strict';
/**
 * contradiction.test.js
 * Test Case 1 (knowledge-base §7):
 * Zıt sigara verileri girildiğinde:
 *   - conflict nesnesi üretiliyor mu?
 *   - Her iki kanıtın confidenceScore'u düşüyor mu?
 */

const { detectConflicts } = require('../src/core/contradictionEngine');
const { scoreAll } = require('../src/core/confidenceScorer');

// ── Fixture: Çelişkili sigara kanıtları ──────────────────────
const smokingEvidences = [
  {
    evidenceId: 'ev_test_A1',
    sourceId: 'doc_1',
    sourceType: 'physician_note',
    date: '2026-05-01',
    category: 'risk_factor',
    clinicalKey: 'smoking_status',
    value: 'Sigara kullanmıyor',
    unit: null,
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: 'Sigara kullanmıyor, alkol kullanımı yok.',
  },
  {
    evidenceId: 'ev_test_A2',
    sourceId: 'doc_2',
    sourceType: 'physician_note',
    date: '2026-06-01',
    category: 'risk_factor',
    clinicalKey: 'smoking_status',
    value: 'Aktif sigara içici, günde 1 paket',
    unit: null,
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: 'Aktif sigara içici, günde 1 paket kullandığını belirtiyor.',
  },
];

// ── Fixture: Çelişkili alkol kanıtları ───────────────────────
const alcoholEvidences = [
  {
    evidenceId: 'ev_test_B1',
    sourceId: 'doc_1',
    sourceType: 'physician_note',
    date: '2026-05-01',
    category: 'risk_factor',
    clinicalKey: 'alcohol_status',
    value: 'Alkol kullanımı yok',
    unit: null,
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: 'Alkol kullanımı yok.',
  },
  {
    evidenceId: 'ev_test_B2',
    sourceId: 'doc_2',
    sourceType: 'patient_history',
    date: '2026-06-01',
    category: 'risk_factor',
    clinicalKey: 'alcohol_status',
    value: 'Sosyal içici, haftada 1-2 kadeh',
    unit: null,
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: 'Sosyal içici, haftada 1-2 kadeh.',
  },
];

// ── Testler ───────────────────────────────────────────────────

describe('ContradictionEngine — Sigara Çelişkisi', () => {
  let result;

  beforeAll(() => {
    result = detectConflicts(smokingEvidences);
  });

  test('En az 1 conflict nesnesi üretmeli', () => {
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
  });

  test('smoking_status_mismatch kategorisinde conflict bulunmalı', () => {
    const smoking = result.conflicts.find((c) => c.conflictCategory === 'smoking_status_mismatch');
    expect(smoking).toBeDefined();
  });

  test('Çelişkili kanıtların evidenceId\'leri conflictedIds kümesinde olmalı', () => {
    expect(result.conflictedIds.has('ev_test_A1')).toBe(true);
    expect(result.conflictedIds.has('ev_test_A2')).toBe(true);
  });

  test('Conflict severity "high" olmalı', () => {
    const smoking = result.conflicts.find((c) => c.conflictCategory === 'smoking_status_mismatch');
    expect(smoking.severity).toBe('high');
  });

  test('Çelişkili kanıtlara contradiction_penalty uygulandıktan sonra confidenceScore düşmeli', () => {
    const { conflictedIds } = result;
    const scored = scoreAll(smokingEvidences, conflictedIds);

    // Çelişkisiz physician_note (~30 gün eski): base 40 - 10 (1-6 ay) - 40 (penalty) = 0
    // Çelişkisiz physician_note (çok yakın tarih): base 40 + 10 bonus - 40 = 10
    // Her iki kanıt da 40'dan düşük olmalı
    scored.forEach((ev) => {
      expect(ev.confidenceScore).toBeLessThan(40);
      expect(ev.scoreFactors.some((f) => f.includes('contradiction_penalty'))).toBe(true);
    });
  });
});

describe('ContradictionEngine — Alkol Çelişkisi', () => {
  test('Alkol uyumsuzluğu yakalanmalı (alcohol_status_mismatch)', () => {
    const { conflicts } = detectConflicts(alcoholEvidences);
    const alcoholConflict = conflicts.find((c) => c.conflictCategory === 'alcohol_status_mismatch');
    expect(alcoholConflict).toBeDefined();
  });

  test('Alkol çelişkisi severity "medium" olmalı', () => {
    const { conflicts } = detectConflicts(alcoholEvidences);
    const alcoholConflict = conflicts.find((c) => c.conflictCategory === 'alcohol_status_mismatch');
    expect(alcoholConflict.severity).toBe('medium');
  });
});

describe('ContradictionEngine — Çelişkisiz Veri', () => {
  test('Çelişki olmayan kanıtlar için conflicts boş olmalı', () => {
    const cleanEvidences = [
      {
        evidenceId: 'ev_clean_1',
        sourceId: 'doc_x',
        sourceType: 'lab_report',
        date: '2026-05-01',
        category: 'laboratory',
        clinicalKey: 'glucose',
        value: 92,
        unit: 'mg/dL',
        confidenceScore: 0,
        scoreFactors: [],
        rawTextSnippet: 'glucose: 92 mg/dL',
      },
    ];
    const { conflicts, conflictedIds } = detectConflicts(cleanEvidences);
    expect(conflicts.length).toBe(0);
    expect(conflictedIds.size).toBe(0);
  });
});
