/**
 * notificationRoutes.js
 *
 * REST endpoints for managing user price and portfolio alerts.
 *
 * GET    /api/notifications/alerts         → list user's alerts
 * POST   /api/notifications/alerts         → create a new alert
 * DELETE /api/notifications/alerts/:id     → delete an alert
 * GET    /api/notifications/socket-info    → return socket connection info
 */

'use strict';

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const alertService = require('../services/alertService');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// ── GET /api/notifications/alerts ────────────────────────────────────────────
router.get('/alerts', (req, res) => {
  try {
    const alerts = alertService.getAlertsForUser(req.user._id.toString());
    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/notifications/alerts ───────────────────────────────────────────
router.post('/alerts', (req, res) => {
  try {
    const { type, symbol, threshold } = req.body;

    if (!type || threshold == null) {
      return res.status(400).json({ success: false, message: 'type and threshold are required.' });
    }

    const VALID_TYPES = ['PRICE_ABOVE', 'PRICE_BELOW', 'PORTFOLIO_LOSS', 'PORTFOLIO_GAIN'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.` });
    }

    if ((type === 'PRICE_ABOVE' || type === 'PRICE_BELOW') && !symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required for price alerts.' });
    }

    const alert = alertService.createAlert({
      userId: req.user._id.toString(),
      type,
      symbol,
      threshold: Number(threshold),
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/notifications/alerts/:id ─────────────────────────────────────
router.delete('/alerts/:id', (req, res) => {
  try {
    alertService.deleteAlert(req.params.id, req.user._id.toString());
    res.status(200).json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// ── GET /api/notifications/socket-info ───────────────────────────────────────
router.get('/socket-info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.user._id.toString(),
      rooms: {
        market: 'market',
        news: 'news',
        portfolio: `portfolio:${req.user._id}`,
        alerts: `alerts:${req.user._id}`,
      },
      events: {
        subscribe: ['subscribe:market', 'subscribe:news', 'subscribe:portfolio', 'subscribe:alerts'],
        receive: ['market:tick', 'news:breaking', 'portfolio:update', 'alert:triggered'],
      },
    },
  });
});

module.exports = router;
