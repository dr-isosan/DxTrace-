'use strict';
/**
 * followupTracker.js
 * Geçmiş klinik notlarda geçen tetkik/görüntüleme isteklerini tarar.
 * dayjs kullanarak o günden bugüne kaç gün geçtiğini hesaplar.
 * Eğer sonuç Evidence Store'da yoksa [AÇIK DÖNGÜ] uyarısı üretir.
 * knowledge-base.md §4.2
 */

'use strict';

const dayjs = require('dayjs');
const sampleNotes = require('../data/sampleNotes.json');

// Regex: "X istendi / planlandı / önerildi" gibi ifadeleri yakalar
const REQUEST_PATTERNS = [
  { regex: /CA[\s\-]?19[\s\-]?9[^.]*(?:istendi|planlandı|önerildi|istenildi)/i, key: 'ca19_9', label: 'CA 19-9' },
  { regex: /kontrol\s+USG[^.]*(?:istendi|planlandı|önerildi)/i, key: 'abdomen_ultrasound', label: 'Kontrol USG' },
  { regex: /abdomen\s+BT[^.]*(?:istendi|planlandı|önerildi)/i, key: 'abdomen_ct', label: 'Abdomen BT' },
  { regex: /amilaz[^.]*(?:istendi|planlandı|önerildi)/i, key: 'amylase', label: 'Amilaz' },
  { regex: /lipaz[^.]*(?:istendi|planlandı|önerildi)/i, key: 'lipase', label: 'Lipaz' },
  { regex: /bilirubin[^.]*(?:istendi|planlandı|önerildi)/i, key: 'bilirubin', label: 'Bilirubin' },
];

const OPEN_LOOP_THRESHOLD_DAYS = 14;

/**
 * @param {Evidence[]} evidences  – mevcut evidence store
 * @returns {FollowupItem[]}
 */
function trackFollowups(evidences) {
  const followups = [];

  for (const note of sampleNotes) {
    for (const pattern of REQUEST_PATTERNS) {
      const match = note.text.match(pattern.regex);
      if (!match) continue;

      const requestDate = dayjs(note.date);
      const daysSince = dayjs().diff(requestDate, 'day');

      // Bu tetkikin sonucu Evidence Store'da var mı?
      const resultFound = evidences.some(
        (e) =>
          e.clinicalKey === pattern.key &&
          (e.category === 'laboratory' || e.category === 'radiology') &&
          dayjs(e.date).isAfter(requestDate)
      );


      if (resultFound) {
        followups.push({
          key: pattern.key,
          label: pattern.label,
          requestedIn: note.documentId,
          requestDate: note.date,
          daysSince,
          status: 'CLOSED',
          message: `${pattern.label} sonucu sisteme işlenmiş.`,
        });
      } else if (daysSince >= OPEN_LOOP_THRESHOLD_DAYS) {
        followups.push({
          key: pattern.key,
          label: pattern.label,
          requestedIn: note.documentId,
          requestDate: note.date,
          daysSince,
          status: 'OPEN',
          message: `[AÇIK DÖNGÜ]: ${daysSince} gün önce "${note.documentId}" belgesinde istenen ${pattern.label} testi henüz sonuçlanmadı veya sisteme işlenmedi.`,
        });
      } else {
        followups.push({
          key: pattern.key,
          label: pattern.label,
          requestedIn: note.documentId,
          requestDate: note.date,
          daysSince,
          status: 'PENDING',
          message: `${pattern.label} ${daysSince} gün önce istendi, henüz ${OPEN_LOOP_THRESHOLD_DAYS} günlük eşiğe ulaşmadı.`,
        });
      }
    }
  }

  return followups;
}

module.exports = { trackFollowups };
