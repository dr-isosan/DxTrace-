'use strict';
/**
 * llm.routes.js
 * POST /llm/query    – Serbest klinik soru-cevap (verifier korumalı)
 * POST /llm/generate – /query ile aynı işlev (görev tanımı uyumluluğu)
 * GET  /llm/status   – LLM bileşenlerinin durumunu döner
 */

const express = require('express');
const router = express.Router();

const { buildEvidenceStore } = require('../core/evidenceStore');
const { scoreAll } = require('../core/confidenceScorer');
const { detectConflicts } = require('../core/contradictionEngine');
const { generateMockSummary } = require('../llm/mockLlm');
const { verify } = require('../llm/verifierAgent');

// Ortak handler — hem /query hem /generate kullanır
const llmHandler = (req, res) => {
  try {
    const { forceHallucination = false } = req.body;

    const rawEvidences = buildEvidenceStore();
    const { conflictedIds } = detectConflicts(rawEvidences);
    const evidences = scoreAll(rawEvidences, conflictedIds);

    const llmOutput = generateMockSummary(evidences, { forceHallucination });
    const verifierResult = verify(llmOutput, evidences);

    return res.json({
      passed: verifierResult.passed,
      clinicalSummary: verifierResult.passed ? verifierResult.cleanedText : null,
      rawLlmOutput: llmOutput.text,
      violations: verifierResult.violations,
      removedSentences: verifierResult.removedSentences,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.post('/query', llmHandler);
router.post('/generate', llmHandler); // task.md uyumluluğu için alias

router.get('/status', (_req, res) => {
  res.json({
    mode: 'closed-book',
    hallucinationGuard: 'active',
    verifierAgent: 'active',
    llmType: 'mock',
  });
});

module.exports = router;
