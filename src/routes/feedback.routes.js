'use strict';
/**
 * feedback.routes.js
 * POST /feedback/submit  – Doktor Onay / Düzenleme / Reddet aksiyonu
 * GET  /feedback/logs    – Tüm audit log kayıtlarını listele
 * GET  /feedback/logs/:componentId – Belirli bileşene ait loglar
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { logFeedback, getAllLogs, getLogsByComponent } = require('../core/auditLog');

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
    const entry = logFeedback({
      componentId,
      action,
      userId: doctorId,
      previousContent,
      finalContent: finalContent ?? previousContent,
      meta: meta ?? {},
    });

    return res.status(201).json({
      message: 'Doktor geri bildirimi kaydedildi.',
      logId: entry.logId,
      action: entry.action,
      timestamp: entry.timestamp,
      diff: entry.diff,
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

module.exports = router;
