'use strict';
/**
 * mockLlm.js
 * Gerçek LLM yerine sentetik klinik özetler üretir.
 * İki mod:
 *   - CLEAN: geçerli, kaynaklı çıktı
 *   - HALLUCINATION: girdi havuzunda olmayan Lipaz: 400 U/L değeri içerir
 *     (verifierAgent tarafından yakalanmalıdır)
 */

/**
 * @param {Evidence[]} evidences
 * @param {{ forceHallucination?: boolean }} opts
 * @returns {{ text: string, citations: string[] }}
 */
function generateMockSummary(evidences, opts = {}) {
  if (opts.forceHallucination) {
    return _hallucinatedResponse();
  }
  return _cleanResponse(evidences);
}

function _cleanResponse(evidences) {
  // Gerçek evidence değerlerinden cümle kur
  const glucose = evidences.find((e) => e.clinicalKey === 'glucose' && e.value > 126);
  const weightLoss = evidences.find((e) => e.clinicalKey === 'weight_loss');
  const epigastric = evidences.find((e) => e.clinicalKey === 'epigastric_pain');
  const radiology = evidences.find((e) => e.category === 'radiology');

  const lines = [];

  if (epigastric) {
    lines.push(
      `Hastada epigastrik bölgede dirençli ağrı ve hassasiyet şikayeti belgelenmiştir [${epigastric.sourceId}].`
    );
  }
  if (weightLoss) {
    lines.push(
      `Son dönemde istemsiz kilo kaybı kayıt altına alınmıştır [${weightLoss.sourceId}].`
    );
  }
  if (glucose) {
    lines.push(
      `Glukoz düzeyi ${glucose.value} ${glucose.unit} olarak ölçülmüş olup referans aralığının üzerindedir [${glucose.sourceId}].`
    );
  }
  if (radiology) {
    lines.push(
      `Görüntülemede belirgin akut patoloji izlenmemiş, ancak pankreas yeterince değerlendirilememiştir [${radiology.sourceId}].`
    );
  }

  lines.push(
    'Yukarıdaki bulgular birlikte değerlendirildiğinde üst gastrointestinal sistem açısından hekim incelemesi gerektirebilecek bir tablo söz konusudur. Bu çıktı tanısal değildir.'
  );

  const text = lines.join(' ');
  const citations = [...new Set(lines.map((l) => l.match(/\[([^\]]+)\]/)?.[1]).filter(Boolean))];

  return { text, citations };
}

function _hallucinatedResponse() {
  // Kasıtlı halüsinasyon: Lipaz: 400 U/L girdi havuzunda YOK
  return {
    text:
      'Hastada epigastrik ağrı mevcuttur [doc_B]. Lipaz değeri 400 U/L olarak ölçülmüştür [lab_999]. ' +
      'Pankreatit tanısı kesinleşmiştir [doc_X]. Tedavi için cerrahi konsültasyon zorunludur.',
    citations: ['doc_B', 'lab_999', 'doc_X'],
  };
}

module.exports = { generateMockSummary };
