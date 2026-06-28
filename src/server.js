'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');

const caseRoutes = require('./routes/case.routes');
const llmRoutes = require('./routes/llm.routes');
const feedbackRoutes = require('./routes/feedback.routes');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/cases', caseRoutes);
app.use('/llm', llmRoutes);
app.use('/feedback', feedbackRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', platform: 'DxTrace', version: '1.0.0' });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı.' });
});

// ── Global Error Handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[DxTrace Error]', err);
  res.status(500).json({ error: 'Sunucu hatası.', detail: err.message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n✅ DxTrace API — http://localhost:${config.port}`);
  console.log(`   Ortam: ${config.nodeEnv}`);
  console.log(`   Temel prensip: "Kanıt yoksa iddia yok."\n`);
});

module.exports = app; // Jest için
