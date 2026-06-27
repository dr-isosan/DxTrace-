'use strict';
/**
 * riskSignalEngine.js
 * knowledge-base.md §3.1 — CAS_GI_01 Sinyali
 * 4 kriterden en az 3'ü son 6 ay içinde tetiklenmişse sinyal üretilir.
 * KESİN TANI DİLİ KULLANILMAZ.
 */

const dayjs = require('dayjs');

const WINDOW_DAYS = 180; // 6 ay

/**
 * @param {Evidence[]} evidences
 * @returns {{ triggered: boolean, metCriteria: string[], signal: object|null }}
 */
function evaluateCasGi01(evidences) {
  const cutoff = dayjs().subtract(WINDOW_DAYS, 'day');
  const recent = evidences.filter((e) => dayjs(e.date).isAfter(cutoff));

  const metCriteria = [];

  // Kriter A: Epigastrik ağrı
  const hasEpigastricPain = recent.some(
    (e) => e.clinicalKey === 'epigastric_pain' && e.category === 'symptom'
  );
  if (hasEpigastricPain) metCriteria.push('A');

  // Kriter B: İstemsiz kilo kaybı
  const hasWeightLoss = recent.some(
    (e) => e.clinicalKey === 'weight_loss' && e.category === 'symptom'
  );
  if (hasWeightLoss) metCriteria.push('B');

  // Kriter C: Yeni glukoz intoleransı
  // Son 2 tahlilde glukoz > 100 veya HbA1c > 5.7 — bozulma trendi
  const glucoseLabs = evidences
    .filter((e) => e.clinicalKey === 'glucose' && e.category === 'laboratory')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const hba1cLabs = evidences
    .filter((e) => e.clinicalKey === 'HbA1c' && e.category === 'laboratory')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const glucoseTrend =
    glucoseLabs.length >= 2 &&
    glucoseLabs.at(-1).value > glucoseLabs.at(0).value &&
    glucoseLabs.at(-1).value > 100;

  const hba1cTrend =
    hba1cLabs.length >= 2 &&
    hba1cLabs.at(-1).value > hba1cLabs.at(0).value &&
    hba1cLabs.at(-1).value > 5.7;

  if (glucoseTrend || hba1cTrend) metCriteria.push('C');

  // Kriter D: Radyoloji "belirgin akut patoloji yok" + semptomlar sürüyor
  const hasNegativeRadiology = evidences.some(
    (e) =>
      e.category === 'radiology' &&
      /belirgin akut patoloji izlenmedi/i.test(String(e.value))
  );
  if (hasNegativeRadiology && hasEpigastricPain) metCriteria.push('D');

  const triggered = metCriteria.length >= 3;

  if (!triggered) {
    return { triggered: false, metCriteria, signal: null };
  }

  return {
    triggered: true,
    metCriteria,
    signal: {
      signalId: 'CAS_GI_01',
      severity: 'attention',
      metCriteria,
      // Şablon dili — knowledge-base §3.2
      message:
        'Klinik kayıtlardaki istemsiz kilo kaybı, yeni başlangıçlı glukoz regülasyon bozukluğu ve dirençli epigastrik ağrı bulguları birlikte değerlendirildiğinde; üst gastrointestinal veya pankreatobiliyer sistemler açısından hekim incelemesi gerektirebilecek bir klinik dikkat sinyali oluşmaktadır. Mevcut kayıtlarda bu örüntüyü netleştirecek spesifik biyobelirteçler eksiktir.',
      disclaimer:
        'Bu sinyal tanısal değildir. Kesin teşhis için hekim değerlendirmesi zorunludur.',
    },
  };
}

module.exports = { evaluateCasGi01 };
