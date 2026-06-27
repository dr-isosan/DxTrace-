'use strict';
/**
 * evidenceStore.js
 * Ham klinik belgeleri (notlar, lab, radyoloji) okuyarak
 * canonical Evidence nesnelerine dönüştürür.
 * Şema: knowledge-base.md §1.1
 */

const { v4: uuidv4 } = require('uuid');
const sampleNotes = require('../data/sampleNotes.json');
const sampleLabs = require('../data/sampleLabs.json');
const sampleRadiology = require('../data/sampleRadiology.json');

/**
 * Doktor notlarından Evidence nesneleri üretir.
 * @returns {Evidence[]}
 */
function extractFromNotes() {
  const evidences = [];

  for (const note of sampleNotes) {
    const base = {
      sourceId: note.documentId,
      sourceType: note.sourceType,
      date: note.date,
      confidenceScore: 0,
      scoreFactors: [],
    };

    // Semptom: epigastrik ağrı
    if (/epigastrik|ağrı|dolgunluk|hassasiyet/i.test(note.text)) {
      evidences.push({
        ...base,
        evidenceId: `ev_${uuidv4().slice(0, 8)}`,
        category: 'symptom',
        clinicalKey: 'epigastric_pain',
        value: 'Epigastrik ağrı / hassasiyet',
        unit: null,
        rawTextSnippet: _extractSnippet(note.text, /epigastrik[^.]+\./i),
      });
    }

    // Semptom: kilo kaybı
    if (/kilo kaybı|istemsiz/i.test(note.text)) {
      const weightMatch = note.text.match(/(\d+)\s*kg istemsiz kilo kaybı/i);
      const value = weightMatch ? `${weightMatch[1]} kg istemsiz kilo kaybı` : 'İstemsiz kilo kaybı';
      evidences.push({
        ...base,
        evidenceId: `ev_${uuidv4().slice(0, 8)}`,
        category: 'symptom',
        clinicalKey: 'weight_loss',
        value,
        unit: 'kg',
        rawTextSnippet: _extractSnippet(note.text, /kilo[^.]+\./i),
      });
    }

    // Risk faktörü: sigara
    if (/sigara/i.test(note.text)) {
      const active = /aktif sigara|paket|içici/i.test(note.text);
      const negated = /sigara kullanm[aı]yor|içmiyor/i.test(note.text);
      if (active) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'smoking_status',
          value: 'Aktif sigara içici',
          unit: null,
          rawTextSnippet: _extractSnippet(note.text, /aktif sigara[^.]+\.|sigara içici[^.]+\./i),
        });
      }
      if (negated) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'smoking_status',
          value: 'Sigara kullanmıyor',
          unit: null,
          rawTextSnippet: _extractSnippet(note.text, /sigara kullanm[aı]yor[^.]+\.|içmiyor[^.]+\./i),
        });
      }
    }

    // Risk faktörü: alkol
    if (/alkol/i.test(note.text)) {
      const social = /sosyal|kadeh|haftada/i.test(note.text);
      const negated = /alkol kullan[ıi]m[ıi] yok|içmiyor/i.test(note.text);
      if (social) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'alcohol_status',
          value: 'Sosyal alkol kullanımı',
          unit: null,
          rawTextSnippet: _extractSnippet(note.text, /alkol[^.]+\./i),
        });
      }
      if (negated) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'alcohol_status',
          value: 'Alkol kullanımı yok',
          unit: null,
          rawTextSnippet: _extractSnippet(note.text, /alkol kullan[ıi]m[ıi] yok[^.]+\./i),
        });
      }
    }

    // Risk faktörü: alerji
    if (/alerji/i.test(note.text)) {
      const penicillin = /penisilin alerjisi mevcut/i.test(note.text);
      const none = /bilinen ilaç alerjisi yok/i.test(note.text);
      if (penicillin) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'allergy_status',
          value: 'Penisilin alerjisi mevcut',
          unit: null,
          rawTextSnippet: 'Penisilin alerjisi mevcut olup alerji kartına işlendi.',
        });
      }
      if (none) {
        evidences.push({
          ...base,
          evidenceId: `ev_${uuidv4().slice(0, 8)}`,
          category: 'risk_factor',
          clinicalKey: 'allergy_status',
          value: 'Bilinen ilaç alerjisi yok',
          unit: null,
          rawTextSnippet: 'Bilinen ilaç alerjisi yok.',
        });
      }
    }

    // Aile öyküsü
    if (/aile|pankreas rahatsızlığı/i.test(note.text)) {
      evidences.push({
        ...base,
        evidenceId: `ev_${uuidv4().slice(0, 8)}`,
        category: 'family_history',
        clinicalKey: 'family_pancreatic_disease',
        value: 'Aile öyküsünde pankreas rahatsızlığı',
        unit: null,
        rawTextSnippet: _extractSnippet(note.text, /aile[^.]+\./i),
      });
    }
  }

  return evidences;
}

/**
 * Laboratuvar sonuçlarından Evidence nesneleri üretir.
 * @returns {Evidence[]}
 */
function extractFromLabs() {
  const evidences = [];

  for (const lab of sampleLabs) {
    for (const test of lab.tests) {
      evidences.push({
        evidenceId: `ev_${uuidv4().slice(0, 8)}`,
        sourceId: lab.documentId,
        sourceType: lab.sourceType,
        date: lab.date,
        category: 'laboratory',
        clinicalKey: test.clinicalKey,
        value: test.value,
        unit: test.unit,
        confidenceScore: 0,
        scoreFactors: [],
        rawTextSnippet: `${test.clinicalKey}: ${test.value} ${test.unit} [${test.status}]`,
      });
    }
  }

  return evidences;
}

/**
 * Radyoloji raporlarından Evidence nesneleri üretir.
 * @returns {Evidence[]}
 */
function extractFromRadiology() {
  return sampleRadiology.map((rad) => ({
    evidenceId: `ev_${uuidv4().slice(0, 8)}`,
    sourceId: rad.documentId,
    sourceType: rad.sourceType,
    date: rad.date,
    category: 'radiology',
    clinicalKey: rad.modality,
    value: rad.impression,
    unit: null,
    confidenceScore: 0,
    scoreFactors: [],
    rawTextSnippet: rad.finding,
  }));
}

/**
 * Tüm kaynaklardan kanıtları birleştirir.
 * @returns {Evidence[]}
 */
function buildEvidenceStore() {
  return [
    ...extractFromNotes(),
    ...extractFromLabs(),
    ...extractFromRadiology(),
  ];
}

// ── Yardımcı ─────────────────────────────────────────────────
function _extractSnippet(text, regex) {
  const match = text.match(regex);
  return match ? match[0].trim() : text.slice(0, 100) + '...';
}

module.exports = { buildEvidenceStore, extractFromNotes, extractFromLabs, extractFromRadiology };
