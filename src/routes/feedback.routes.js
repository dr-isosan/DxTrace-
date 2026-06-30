'use strict';
/**
 * feedback.routes.js
 * POST /feedback/submit               – Doktor Onay / Düzenleme / Reddet aksiyonu
 * GET  /feedback/logs                 – Tüm in-memory audit loglarını listele
 * GET  /feedback/logs/:componentId    – Belirli bileşene ait loglar
 * GET  /feedback/store                – Kalıcı feedback kaydı (JSON store)
 * GET  /feedback/store/stats          – Feedback istatistikleri (LLM loop raporu)
 * GET  /feedback/store/hallucinations – Yalnızca REJECT kayıtları
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { logFeedback, getAllLogs, getLogsByComponent } = require('../core/auditLog');
const {
  recordFeedback,
  getAllFeedback,
  getFeedbackByAction,
  getFeedbackByComponent,
  getFeedbackStats,
} = require('../core/feedbackStore');

// Giriş doğrulama şeması
const FeedbackSchema = z.object({
  componentId: z.string().min(1, 'componentId zorunludur'),
  action: z.enum(['APPROVE', 'EDIT', 'REJECT']),
  doctorId: z.string().min(1, 'doctorId zorunludur'),
  previousContent: z.string().min(1, 'previousContent zorunludur'),
  finalContent: z.string().optional(),
  meta: z
    .object({
      hadContradiction: z.boolean().optional(),
      missingDataCountAtExecution: z.number().optional(),
    })
    .optional(),
});

router.post('/submit', (req, res) => {
  const parsed = FeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Geçersiz istek gövdesi.',
      details: parsed.error.flatten(),
    });
  }

  const { componentId, action, doctorId, previousContent, finalContent, meta } = parsed.data;

  try {
    // 1️⃣ In-memory audit log (hızlı okuma, oturum ömrü)
    const entry = logFeedback({
      componentId,
      action,
      userId: doctorId,
      previousContent,
      finalContent: finalContent ?? previousContent,
      meta: meta ?? {},
    });

    // 2️⃣ Kalıcı feedback store (JSON dosyası → LLM loop için veri kaynağı)
    const storeEntry = recordFeedback({
      componentId,
      action,
      doctorId,
      aiOutput:       previousContent,
      doctorRevision: finalContent ?? null,
      context: {
        hadContradiction:            meta?.hadContradiction ?? false,
        missingDataCountAtExecution: meta?.missingDataCountAtExecution ?? 0,
      },
    });

    return res.status(201).json({
      message:    'Doktor geri bildirimi kaydedildi.',
      logId:      entry.logId,
      storeId:    storeEntry.id,
      action:     entry.action,
      changeType: storeEntry.changeType,
      timestamp:  entry.timestamp,
      diff:       entry.diff,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/logs', (_req, res) => {
  return res.json({ logs: getAllLogs() });
});

router.get('/logs/:componentId', (req, res) => {
  const logs = getLogsByComponent(req.params.componentId);
  return res.json({ componentId: req.params.componentId, logs });
});

// ── Kalıcı Feedback Store Endpoint'leri (LLM Loop) ──────────────────────────

/** Tüm kalıcı feedback kayıtları */
router.get('/store', (_req, res) => {
  return res.json({ entries: getAllFeedback() });
});

/** Feedback istatistikleri — prompt iyileştirme için özet rapor */
router.get('/store/stats', (_req, res) => {
  return res.json(getFeedbackStats());
});

/** Yalnızca REJECT (halüsinasyon) kayıtları */
router.get('/store/hallucinations', (_req, res) => {
  return res.json({ hallucinations: getFeedbackByAction('REJECT') });
});

/** Yalnızca APPROVE (golden example) kayıtları */
router.get('/store/golden-examples', (_req, res) => {
  return res.json({ goldenExamples: getFeedbackByAction('APPROVE') });
});

/** Belirli componentId'ye ait kalıcı kayıtlar */
router.get('/store/component/:componentId', (req, res) => {
  const entries = getFeedbackByComponent(req.params.componentId);
  return res.json({ componentId: req.params.componentId, entries });
});

module.exports = router;
