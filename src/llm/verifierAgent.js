'use strict';
/**
 * verifierAgent.js
 * Ana LLM çıktısını kullanıcıya gösterilmeden önce 3 aşamalı filtreden geçirir.
 * knowledge-base.md §5.2 — Verifier Agent kontrol listesi
 *
 * 1. Cümle bazlı kaynak kontrolü    → [doc_X] etiketi olmayan cümleler silinir
 * 2. Yasaklı kelime filtresi         → bulunursa metin reddedilir
 * 3. Sayısal değer eşleştirme        → girdi JSON'ında olmayan sayılar halüsinasyon
 */

// Yasaklı kelime/ifade listesi
const FORBIDDEN_PATTERNS = [
  /kesinlikle\s+(?:bu|o|şu)/i,
  /tanısı\s+konulmuştur/i,
  /teşhis\s+edilmiştir/i,
  /tedavisi\s+\S+\s+olmalıdır/i,
  /tedavi\s+için\s+\w+\s+zorunludur/i,
  /pankreatit\s+tanısı\s+kesinleşmiştir/i,
  /cancer\b/i,
  /malignite\b/i,
];

/**
 * @param {{ text: string, citations: string[] }} llmOutput
 * @param {Evidence[]} evidences – doğrulama için referans kanıtlar
 * @returns {{ passed: boolean, cleanedText: string|null, violations: string[], removedSentences: string[] }}
 */
function verify(llmOutput, evidences) {
  const violations = [];
  const removedSentences = [];

  // Sayısal referanslar (ev. değerleri)
  const knownNumbers = new Set(
    evidences
      .map((e) => String(e.value))
      .join(' ')
      .match(/\d+(\.\d+)?/g) ?? []
  );

  // Bilinen kaynak ID'leri
  const knownSourceIds = new Set(evidences.map((e) => e.sourceId));

  // ── Adım 1: Cümle bazlı kaynak kontrolü ─────────────────
  const sentences = llmOutput.text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const filteredSentences = [];
  for (const sentence of sentences) {
    const hasCitation = /\[[^\]]+\]/.test(sentence);
    // Sorumluluk reddi cümleleri kaynak etiketi zorunlu değil
    const isDisclaimer = /tanısal değildir|hekim incelemesi|doktor değerlendirmesi/i.test(sentence);

    if (!hasCitation && !isDisclaimer) {
      removedSentences.push(sentence);
      violations.push(`Kaynaksız cümle kaldırıldı: "${sentence.slice(0, 80)}..."`);
    } else {
      filteredSentences.push(sentence);
    }
  }

  const textAfterCitationFilter = filteredSentences.join(' ');

  // ── Adım 2: Yasaklı kelime kontrolü ─────────────────────
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(textAfterCitationFilter)) {
      violations.push(`Yasaklı ifade tespit edildi: "${pattern.toString()}"`);
      return {
        passed: false,
        cleanedText: null,
        violations,
        removedSentences,
      };
    }
  }

  // ── Adım 3: Sayısal değer eşleştirme ────────────────────
  // Metin içindeki her sayıyı, bilinen sayılar kümesinde tam eşleşme ile ara.
  // Kısmen eşleşen parçaları (örn. "145" içindeki "14") engellemek için
  // tam-sözcük regex kullanılır.
  const outputNumbers = textAfterCitationFilter.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  for (const num of outputNumbers) {
    if (!knownNumbers.has(num)) {
      violations.push(
        `Halüsinasyon şüphesi: "${num}" değeri Evidence Store'da bulunmuyor.`
      );
      return {
        passed: false,
        cleanedText: null,
        violations,
        removedSentences,
      };
    }
  }

  // ── Adım 3b: Kaynak ID eşleştirmesi ────────────────────
  const citedSources = [...textAfterCitationFilter.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  for (const cited of citedSources) {
    if (!knownSourceIds.has(cited)) {
      violations.push(
        `Geçersiz kaynak referansı: "[${cited}]" Evidence Store'da tanımlı bir kaynak değil.`
      );
      return {
        passed: false,
        cleanedText: null,
        violations,
        removedSentences,
      };
    }
  }

  return {
    passed: true,
    cleanedText: textAfterCitationFilter,
    violations,
    removedSentences,
  };
}

module.exports = { verify };
