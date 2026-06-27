'use strict';
/**
 * prompts.js
 * Closed-Book Mode sistem prompt şablonları.
 * R.V.R.C.E. protokolü: Retrieve → Verify → Reason → Cite → Escalate
 */

/**
 * Ana klinik özet prompt şablonu.
 * @param {Evidence[]} evidences
 * @param {Conflict[]} conflicts
 * @param {MissingItem[]} missingData
 * @returns {string}
 */
function buildClinicalSummaryPrompt(evidences, conflicts, missingData) {
  const evidenceBlock = evidences
    .map(
      (e) =>
        `[${e.sourceId}] (${e.date}) ${e.clinicalKey}: ${e.value}` +
        (e.unit ? ` ${e.unit}` : '') +
        ` | Güven Puanı: ${e.confidenceScore}`
    )
    .join('\n');

  const conflictBlock =
    conflicts.length > 0
      ? conflicts.map((c) => `⚠ ÇELİŞKİ [${c.conflictId}]: ${c.description}`).join('\n')
      : 'Tespit edilen çelişki yok.';

  const missingBlock =
    missingData.length > 0
      ? missingData.map((m) => `❌ EKSİK VERİ: ${m.message}`).join('\n')
      : 'Eksik kritik tetkik tespit edilmedi.';

  return `SİSTEM TALİMATLARI (CLOSED-BOOK MODE):
Sen bir klinik kanıt sentezleme asistanısın.
YASAK: Kendi genel tıp bilgini kullanarak yeni klinik iddia üretmek.
ZORUNLU: Aşağıdaki Evidence Store'da yer almayan hiçbir laboratuvar değeri, tarih, semptom veya bulguya metin içinde yer veremezsin.
ZORUNLU: Her klinik cümlenin sonuna kaynak belirteci ekle. Örn: [doc_B]
YASAK KELİMELER: "kesinlikle", "tanısı konulmuştur", "tedavisi ... olmalıdır", "teşhis edilmiştir", "cancer", "malignite"
ZORUNLU: Eğer veri eksikse veya çelişkiliyse bunu açıkça belirt.
ZORUNLU: "Doktor değerlendirmesi gerektirebilir." gibi temkinli dil kullan.

--- EVIDENCE STORE ---
${evidenceBlock}

--- ÇELİŞKİLER ---
${conflictBlock}

--- EKSİK VERİ ---
${missingBlock}

--- GÖREV ---
Yukarıdaki kanıtları kullanarak, kanıt-kilitli ve kaynaklı kısa bir klinik özet üret.
Her cümlenin sonunda kaynak ID'si olmalıdır.
Tanı koymadan, olası klinik durumları belirt.`;
}

module.exports = { buildClinicalSummaryPrompt };
