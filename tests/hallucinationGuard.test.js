'use strict';
/**
 * hallucinationGuard.test.js
 * Test Case 3 (knowledge-base §7):
 * Mock LLM yanıtı girdi havuzunda olmayan hayali "Lipaz: 400 U/L"
 * değeri içerdiğinde verifierAgent bunu yakalayıp reddetmeli.
 */

const { verify } = require('../src/llm/verifierAgent');
const { generateMockSummary } = require('../src/llm/mockLlm');

// Geçerli referans kanıtlar (Lipaz: 400 bu listede YOK)
const referenceEvidences = [
  {
    evidenceId: 'ev_ref_1',
    sourceId: 'doc_B',
    sourceType: 'physician_note',
    date: '2026-03-18',
    category: 'symptom',
    clinicalKey: 'epigastric_pain',
    value: 'Epigastrik ağrı',
    unit: null,
    confidenceScore: 50,
    scoreFactors: [],
    rawTextSnippet: 'Epigastrik bölgede dirençli ağrı.',
  },
  {
    evidenceId: 'ev_ref_2',
    sourceId: 'lab_003',
    sourceType: 'lab_report',
    date: '2026-03-18',
    category: 'laboratory',
    clinicalKey: 'glucose',
    value: 145,
    unit: 'mg/dL',
    confidenceScore: 60,
    scoreFactors: [],
    rawTextSnippet: 'glucose: 145 mg/dL',
  },
];

describe('VerifierAgent — Halüsinasyon Engelleme', () => {
  test('Lipaz: 400 içeren halüsine yanıt reddedilmeli (passed: false)', () => {
    const hallucinatedOutput = generateMockSummary([], { forceHallucination: true });
    const result = verify(hallucinatedOutput, referenceEvidences);
    expect(result.passed).toBe(false);
  });

  test('Reddedilen yanıtta violations dizisi dolu olmalı', () => {
    const hallucinatedOutput = generateMockSummary([], { forceHallucination: true });
    const result = verify(hallucinatedOutput, referenceEvidences);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  test('cleanedText null olmalı (halüsinasyon durumunda)', () => {
    const hallucinatedOutput = generateMockSummary([], { forceHallucination: true });
    const result = verify(hallucinatedOutput, referenceEvidences);
    expect(result.cleanedText).toBeNull();
  });

  test('Violations içinde geçersiz kaynak veya halüsinasyon mesajı bulunmalı', () => {
    const hallucinatedOutput = generateMockSummary([], { forceHallucination: true });
    const result = verify(hallucinatedOutput, referenceEvidences);
    const hasRelevantViolation = result.violations.some(
      (v) => v.includes('Halüsinasyon') || v.includes('Geçersiz kaynak') || v.includes('Yasaklı')
    );
    expect(hasRelevantViolation).toBe(true);
  });
});

describe('VerifierAgent — Temiz Yanıt Geçmeli', () => {
  test('Geçerli, kaynaklı ve doğru verili çıktı kabul edilmeli', () => {
    const cleanOutput = {
      text: 'Hastada epigastrik ağrı belgelenmiştir [doc_B]. Glukoz 145 mg/dL olarak ölçülmüştür [lab_003]. Bu çıktı tanısal değildir.',
      citations: ['doc_B', 'lab_003'],
    };
    const result = verify(cleanOutput, referenceEvidences);
    expect(result.passed).toBe(true);
    expect(result.cleanedText).not.toBeNull();
  });

  test('Yasaklı kelime içermeyen metin geçmeli', () => {
    const clean = {
      text: 'Glukoz değeri 145 mg/dL olarak ölçülmüştür [lab_003]. Hekim değerlendirmesi gerektirebilir.',
      citations: ['lab_003'],
    };
    const result = verify(clean, referenceEvidences);
    expect(result.passed).toBe(true);
  });

  test('"Tanısı konulmuştur" içeren metin reddedilmeli', () => {
    const forbidden = {
      text: 'Pankreatit tanısı konulmuştur [doc_B].',
      citations: ['doc_B'],
    };
    const result = verify(forbidden, referenceEvidences);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('Yasaklı'))).toBe(true);
  });
});
