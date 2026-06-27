'use strict';
/**
 * missingDataDetector.js
 * CAS_GI_01 tetiklendiğinde knowledge-base.md §4.1 matrisine göre
 * eksik kritik tetkikleri tespit eder.
 */

const dayjs = require('dayjs');

const CRITICAL_TESTS = [
  { key: 'ca19_9', label: 'CA 19-9', maxAgeDays: 45, criticality: 'high' },
  { key: 'amylase', label: 'Amilaz', maxAgeDays: 7, criticality: 'high' },
  { key: 'lipase', label: 'Lipaz', maxAgeDays: 7, criticality: 'high' },
  { key: 'total_bilirubin', label: 'Total Bilirubin', maxAgeDays: 30, criticality: 'medium' },
  { key: 'direct_bilirubin', label: 'Direkt Bilirubin', maxAgeDays: 30, criticality: 'medium' },
  { key: 'abdomen_ultrasound', label: 'Abdomen USG', maxAgeDays: 90, criticality: 'high' },
  { key: 'abdomen_ct', label: 'Abdomen BT', maxAgeDays: 90, criticality: 'high' },
];

/**
 * @param {Evidence[]} evidences
 * @param {boolean} casTriggered
 * @returns {MissingItem[]}
 */
function detectMissingData(evidences, casTriggered) {
  if (!casTriggered) return [];

  const missing = [];

  for (const test of CRITICAL_TESTS) {
    const found = evidences.find(
      (e) =>
        (e.clinicalKey === test.key ||
          e.clinicalKey === test.label.toLowerCase().replace(/ /g, '_')) &&
        (e.category === 'laboratory' || e.category === 'radiology')
    );

    if (!found) {
      missing.push({
        key: test.key,
        label: test.label,
        criticality: test.criticality,
        status: 'MISSING',
        message: `${test.label} sonucu kayıtlarda bulunamadı.`,
      });
      continue;
    }

    const ageDays = dayjs().diff(dayjs(found.date), 'day');
    if (ageDays > test.maxAgeDays) {
      missing.push({
        key: test.key,
        label: test.label,
        criticality: test.criticality,
        status: 'STALE',
        message: `${test.label} sonucu ${ageDays} gün önce alınmış, kabul edilebilir güncellik sınırı ${test.maxAgeDays} gündür.`,
      });
    }
  }

  return missing;
}

module.exports = { detectMissingData };
