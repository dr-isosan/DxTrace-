'use strict';
/**
 * case.routes.js
 * POST /cases/analyze
 *
 * Tüm core modülleri orchestrate eder:
 * evidenceStore → confidenceScorer → contradictionEngine
 * → timelineEngine → riskSignalEngine → missingDataDetector
 * → followupTracker → mockLlm → verifierAgent → yanıt
 */

const express = require('express');
const router = express.Router();

const { buildEvidenceStore } = require('../core/evidenceStore');
const { scoreAll } = require('../core/confidenceScorer');
const { detectConflicts } = require('../core/contradictionEngine');
const { buildTimeline } = require('../core/timelineEngine');
const { evaluateCasGi01 } = require('../core/riskSignalEngine');
const { detectMissingData } = require('../core/missingDataDetector');
const { trackFollowups } = require('../core/followupTracker');
const { generateMockSummary } = require('../llm/mockLlm');
const { verify } = require('../llm/verifierAgent');
const { logSystemEvent } = require('../core/auditLog');

router.post('/analyze', (req, res) => {
  try {
    const { caseId = 'case_001', forceHallucination = false } = req.body;
    logSystemEvent({ event: 'ANALYZE_STARTED', detail: { caseId } });

    // 1. Evidence Store oluştur
    const rawEvidences = buildEvidenceStore();

    // 2. Çelişki tespiti
    const { conflicts, conflictedIds } = detectConflicts(rawEvidences);

    // 3. Güven puanlama (çelişki bilgisiyle birlikte)
    const evidences = scoreAll(rawEvidences, conflictedIds);

    // 4. Zaman çizelgesi
    const timeline = buildTimeline(evidences);

    // 5. Erken sinyal
    const { triggered: casTriggered, metCriteria, signal } = evaluateCasGi01(evidences);

    // 6. Eksik veri
    const missingData = detectMissingData(evidences, casTriggered);

    // 7. Followup takibi
    const followups = trackFollowups(evidences);

    // 8. Mock LLM → verifier
    const llmOutput = generateMockSummary(evidences, { forceHallucination });
    const verifierResult = verify(llmOutput, evidences);

    // 9. Klinik özet
    let clinicalSummary;
    let llmStatus;
    if (verifierResult.passed) {
      clinicalSummary = verifierResult.cleanedText;
      llmStatus = 'VERIFIED';
    } else {
      clinicalSummary = null;
      llmStatus = 'REJECTED_BY_VERIFIER';
    }

    logSystemEvent({
      event: 'ANALYZE_COMPLETED',
      detail: {
        caseId,
        evidenceCount: evidences.length,
        conflictCount: conflicts.length,
        casTriggered,
        missingCount: missingData.length,
        llmStatus,
      },
    });

    return res.json({
      caseId,
      llmStatus,
      clinicalSummary,
      verifierViolations: verifierResult.violations,
      evidence: evidences.map((e) => ({
        evidenceId: e.evidenceId,
        sourceId: e.sourceId,
        date: e.date,
        category: e.category,
        clinicalKey: e.clinicalKey,
        value: e.value,
        unit: e.unit ?? null,
        confidenceScore: e.confidenceScore,
        scoreFactors: e.scoreFactors,
      })),
      conflicts,
      missingData,
      followups,
      timeline,
      earlySignals: casTriggered ? [signal] : [],
      earlySignalCriteria: metCriteria,
    });
  } catch (err) {
    console.error('[/cases/analyze]', err);
    return res.status(500).json({ error: 'Analiz sırasında hata oluştu.', detail: err.message });
  }
});

module.exports = router;
