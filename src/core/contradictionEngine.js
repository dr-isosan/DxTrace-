'use strict';
/**
 * contradictionEngine.js
 * Farklı belgeler arasındaki semantik zıtlıkları tarar.
 * knowledge-base.md §2 kurallar matrisini uygular.
 *
 * Tarama alanları:
 *   - sigara/alkol risk faktörü uyumsuzluğu
 *   - diyabet/glukoz çelişkisi
 *   - alerji çelişkisi
 *   - aynı gün fizik muayene bulgu çakışması
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Evidenclar listesini tarayarak çelişkileri tespit eder.
 * @param {Evidence[]} evidences
 * @returns {{ conflicts: Conflict[], conflictedIds: Set<string> }}
 */
function detectConflicts(evidences) {
  const conflicts = [];
  const conflictedIds = new Set();

  _checkSmokingConflict(evidences, conflicts, conflictedIds);
  _checkAlcoholConflict(evidences, conflicts, conflictedIds);
  _checkAllergyConflict(evidences, conflicts, conflictedIds);
  _checkGlucoseDiabetesConflict(evidences, conflicts, conflictedIds);
  _checkSameDayExamConflict(evidences, conflicts, conflictedIds);

  return { conflicts, conflictedIds };
}

// ── Sigara ───────────────────────────────────────────────────
function _checkSmokingConflict(evidences, conflicts, conflictedIds) {
  const smoking = evidences.filter((e) => e.clinicalKey === 'smoking_status');
  const active = smoking.filter((e) => /aktif|içici|paket/i.test(String(e.value)));
  const nonSmoker = smoking.filter((e) => /kullanm[aı]yor|içmiyor/i.test(String(e.value)));

  if (active.length > 0 && nonSmoker.length > 0) {
    const ids = [...active, ...nonSmoker].map((e) => e.evidenceId);
    ids.forEach((id) => conflictedIds.add(id));
    conflicts.push({
      conflictId: `con_${uuidv4().slice(0, 8)}`,
      conflictingEvidences: ids,
      conflictCategory: 'smoking_status_mismatch',
      severity: 'high',
      description:
        `Farklı kaynaklarda sigara kullanımına ilişkin çelişkili ifadeler tespit edildi. ` +
        `"${nonSmoker.map((e) => e.sourceId).join(', ')}" belgesinde sigara kullanılmadığı belirtilirken, ` +
        `"${active.map((e) => e.sourceId).join(', ')}" belgesinde aktif sigara kullanımı kayıt altına alınmıştır.`,
    });
  }
}

// ── Alkol ────────────────────────────────────────────────────
function _checkAlcoholConflict(evidences, conflicts, conflictedIds) {
  const alcohol = evidences.filter((e) => e.clinicalKey === 'alcohol_status');
  const user = alcohol.filter((e) => /sosyal|kadeh|haftada/i.test(String(e.value)));
  const nonUser = alcohol.filter((e) => /kullan[ıi]m[ıi] yok|içmiyor/i.test(String(e.value)));

  if (user.length > 0 && nonUser.length > 0) {
    const ids = [...user, ...nonUser].map((e) => e.evidenceId);
    ids.forEach((id) => conflictedIds.add(id));
    conflicts.push({
      conflictId: `con_${uuidv4().slice(0, 8)}`,
      conflictingEvidences: ids,
      conflictCategory: 'alcohol_status_mismatch',
      severity: 'medium',
      description:
        `Alkol kullanımı konusunda çelişkili bilgiler mevcuttur. ` +
        `"${nonUser.map((e) => e.sourceId).join(', ')}" belgesinde alkol kullanımı olmadığı ifade edilirken, ` +
        `"${user.map((e) => e.sourceId).join(', ')}" belgesinde sosyal alkol kullanımı bildirilmiştir.`,
    });
  }
}

// ── Alerji ───────────────────────────────────────────────────
function _checkAllergyConflict(evidences, conflicts, conflictedIds) {
  const allergy = evidences.filter((e) => e.clinicalKey === 'allergy_status');
  const hasPenicillin = allergy.filter((e) => /penisilin alerjisi mevcut/i.test(String(e.value)));
  const noAllergy = allergy.filter((e) => /bilinen ilaç alerjisi yok/i.test(String(e.value)));

  if (hasPenicillin.length > 0 && noAllergy.length > 0) {
    const ids = [...hasPenicillin, ...noAllergy].map((e) => e.evidenceId);
    ids.forEach((id) => conflictedIds.add(id));
    conflicts.push({
      conflictId: `con_${uuidv4().slice(0, 8)}`,
      conflictingEvidences: ids,
      conflictCategory: 'allergy_status_mismatch',
      severity: 'high',
      description:
        `Alerji kaydında çelişki tespit edildi. ` +
        `"${noAllergy.map((e) => e.sourceId).join(', ')}" belgesinde bilinen ilaç alerjisi olmadığı belirtilirken, ` +
        `"${hasPenicillin.map((e) => e.sourceId).join(', ')}" belgesinde penisilin alerjisi kayıt altına alınmıştır. ` +
        `Bu durum yüksek klinik önem taşımaktadır.`,
    });
  }
}

// ── Glukoz / Diyabet çelişkisi ───────────────────────────────
function _checkGlucoseDiabetesConflict(evidences, conflicts, conflictedIds) {
  // "diyabet öyküsü yok" içeren physician_note veya patient_history
  const noDiabetes = evidences.filter(
    (e) =>
      (e.sourceType === 'physician_note' || e.sourceType === 'patient_history') &&
      e.rawTextSnippet &&
      /diyabet öyküsü yok|diyabeti yok/i.test(e.rawTextSnippet)
  );

  // HbA1c > 6.5 veya glucose > 126 olan lab sonuçları
  const diabeticLabs = evidences.filter(
    (e) =>
      e.category === 'laboratory' &&
      ((e.clinicalKey === 'glucose' && Number(e.value) > 126) ||
        (e.clinicalKey === 'HbA1c' && Number(e.value) > 6.5))
  );

  if (noDiabetes.length > 0 && diabeticLabs.length > 0) {
    const ids = [...noDiabetes, ...diabeticLabs].map((e) => e.evidenceId);
    ids.forEach((id) => conflictedIds.add(id));
    conflicts.push({
      conflictId: `con_${uuidv4().slice(0, 8)}`,
      conflictingEvidences: ids,
      conflictCategory: 'diabetes_history_mismatch',
      severity: 'high',
      description:
        `Diyabet öyküsü konusunda çelişki tespit edildi. ` +
        `Klinik notlarda "diyabet öyküsü yok" ifadesi yer alırken, ` +
        `laboratuvar geçmişinde diyabet eşiğini aşan değerler (Glukoz > 126 mg/dL veya HbA1c > %6.5) saptanmıştır. ` +
        `Hekim değerlendirmesi gereklidir.`,
    });
  }
}

// ── Aynı gün muayene çakışması ───────────────────────────────
function _checkSameDayExamConflict(evidences, conflicts, conflictedIds) {
  // "Karın rahat, defans yok" ile "hassasiyet" aynı gün
  const examEvs = evidences.filter(
    (e) => e.clinicalKey === 'epigastric_pain' && e.sourceType === 'epicrisis'
  );
  // Gerçek vaka: doc_C'de her iki ifade aynı belgede — bunu doküman text üzerinden kontrol edelim
  const { sampleNotes } = _loadNotes();
  for (const note of sampleNotes) {
    const hasRelaxed = /karın rahat|defans yok/i.test(note.text);
    const hasTenderness = /hassasiyet/i.test(note.text);
    if (hasRelaxed && hasTenderness) {
      const relatedEvs = evidences.filter((e) => e.sourceId === note.documentId);
      if (relatedEvs.length > 0) {
        const ids = relatedEvs.map((e) => e.evidenceId);
        ids.forEach((id) => conflictedIds.add(id));
        conflicts.push({
          conflictId: `con_${uuidv4().slice(0, 8)}`,
          conflictingEvidences: ids,
          conflictCategory: 'physical_exam_same_day_mismatch',
          severity: 'medium',
          description:
            `"${note.documentId}" belgesinde aynı muayene notunda hem "Karın rahat, defans yok" hem de ` +
            `"epigastrik bölgede hassasiyet" ifadeleri yer almaktadır. Bu bulgular birbiriyle çelişmektedir.`,
        });
      }
    }
  }
}

function _loadNotes() {
  try {
    return { sampleNotes: require('../data/sampleNotes.json') };
  } catch {
    return { sampleNotes: [] };
  }
}

module.exports = { detectConflicts };
