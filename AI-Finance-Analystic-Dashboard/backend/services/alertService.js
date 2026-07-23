/**
 * alertService.js
 *
 * Manages price-threshold and portfolio-health alerts.
 * Integrates with socketService (real-time) and emailService (async notifications).
 *
 * Alert types:
 *  - PRICE_ABOVE    — triggered when asset price rises above a threshold
 *  - PRICE_BELOW    — triggered when asset price falls below a threshold
 *  - PORTFOLIO_LOSS — triggered when portfolio P&L% drops below a threshold
 *  - PORTFOLIO_GAIN — triggered when portfolio P&L% rises above a threshold
 */

'use strict';

/** In-memory alert store (replace with MongoDB model in production) */
const _alerts = new Map(); // key: alertId, value: Alert

let _nextId = 1;

/**
 * @typedef {{
 *   id: string;
 *   userId: string;
 *   type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PORTFOLIO_LOSS' | 'PORTFOLIO_GAIN';
 *   symbol?: string;
 *   threshold: number;
 *   triggered: boolean;
 *   createdAt: string;
 *   lastTriggeredAt?: string;
 * }} Alert
 */

/**
 * Create a new price or portfolio alert.
 *
 * @param {{
 *   userId: string;
 *   type: Alert['type'];
 *   symbol?: string;
 *   threshold: number;
 * }} params
 * @returns {Alert}
 */
function createAlert({ userId, type, symbol, threshold }) {
  if (!userId || !type || threshold == null) {
    throw new Error('userId, type, and threshold are required.');
  }

  const id = `alert_${_nextId++}`;
  const alert = {
    id,
    userId,
    type,
    symbol: symbol?.toUpperCase() ?? null,
    threshold: Number(threshold),
    triggered: false,
    createdAt: new Date().toISOString(),
  };

  _alerts.set(id, alert);
  console.log(`[AlertService] Created alert ${id} for user ${userId}`);
  return alert;
}

/**
 * List all alerts for a given user.
 *
 * @param {string} userId
 * @returns {Alert[]}
 */
function getAlertsForUser(userId) {
  return [..._alerts.values()].filter((a) => a.userId === userId);
}

/**
 * Delete an alert.
 *
 * @param {string} alertId
 * @param {string} userId  Ownership check.
 */
function deleteAlert(alertId, userId) {
  const alert = _alerts.get(alertId);
  if (!alert || alert.userId !== userId) throw new Error('Alert not found.');
  _alerts.delete(alertId);
}

/**
 * Check all PRICE_ABOVE / PRICE_BELOW alerts.
 * Called by schedulerService every 5 minutes.
 *
 * @param {{ socketService?: import('./socketService') }} opts
 */
async function checkPriceAlerts({ socketService } = {}) {
  const priceAlerts = [..._alerts.values()].filter(
    (a) => a.type === 'PRICE_ABOVE' || a.type === 'PRICE_BELOW'
  );

  if (priceAlerts.length === 0) return;

  const { marketService } = require('./marketService');
  const emailService = require('./emailService');

  // Group by symbol to batch API calls
  const symbolMap = new Map();
  for (const alert of priceAlerts) {
    if (!alert.symbol) continue;
    if (!symbolMap.has(alert.symbol)) symbolMap.set(alert.symbol, []);
    symbolMap.get(alert.symbol).push(alert);
  }

  for (const [symbol, symbolAlerts] of symbolMap) {
    let price;
    try {
      const asset = await marketService.getAssetBySymbol(symbol);
      price = asset?.price;
    } catch {
      continue; // skip symbol if fetch fails
    }

    if (price == null) continue;

    for (const alert of symbolAlerts) {
      const shouldTrigger =
        (alert.type === 'PRICE_ABOVE' && price >= alert.threshold) ||
        (alert.type === 'PRICE_BELOW' && price <= alert.threshold);

      if (!shouldTrigger || alert.triggered) continue;

      alert.triggered = true;
      alert.lastTriggeredAt = new Date().toISOString();

      const message = `${symbol} ${alert.type === 'PRICE_ABOVE' ? 'crossed above' : 'dropped below'} $${alert.threshold.toFixed(2)}. Current: $${price.toFixed(2)}.`;
      console.log(`[AlertService] Triggered: ${message}`);

      // Real-time push
      if (socketService) {
        socketService.emitAlert(alert.userId, {
          type: 'price',
          symbol,
          message,
          severity: 'warning',
        });
      }

      // Email notification (fire-and-forget)
      emailService.sendAlertEmail(alert.userId, { subject: `StockIQ Price Alert: ${symbol}`, body: message }).catch(() => {});
    }
  }
}

/**
 * Run portfolio P&L health checks for all users.
 * Called by schedulerService every hour.
 *
 * @param {{ socketService?: import('./socketService') }} opts
 */
async function runPortfolioHealthAlerts({ socketService } = {}) {
  const portfolioAlerts = [..._alerts.values()].filter(
    (a) => a.type === 'PORTFOLIO_LOSS' || a.type === 'PORTFOLIO_GAIN'
  );

  if (portfolioAlerts.length === 0) return;

  const portfolioService = require('./portfolioService');
  const emailService = require('./emailService');

  const userIds = [...new Set(portfolioAlerts.map((a) => a.userId))];

  for (const userId of userIds) {
    let analytics;
    try {
      analytics = await portfolioService.getAnalytics(userId);
    } catch {
      continue;
    }

    const pnlPercent = analytics?.summary?.totalPnLPercent ?? 0;
    const userAlerts = portfolioAlerts.filter((a) => a.userId === userId);

    for (const alert of userAlerts) {
      const shouldTrigger =
        (alert.type === 'PORTFOLIO_LOSS' && pnlPercent <= -Math.abs(alert.threshold)) ||
        (alert.type === 'PORTFOLIO_GAIN' && pnlPercent >= alert.threshold);

      if (!shouldTrigger) continue;

      const message = `Portfolio ${alert.type === 'PORTFOLIO_LOSS' ? 'loss' : 'gain'} threshold reached: ${pnlPercent.toFixed(2)}% P&L.`;
      console.log(`[AlertService] Portfolio alert for user ${userId}: ${message}`);

      if (socketService) {
        socketService.emitAlert(userId, {
          type: 'portfolio',
          message,
          severity: alert.type === 'PORTFOLIO_LOSS' ? 'critical' : 'info',
        });
      }

      emailService.sendAlertEmail(userId, {
        subject: `StockIQ Portfolio Alert`,
        body: message,
      }).catch(() => {});
    }
  }
}

module.exports = { createAlert, getAlertsForUser, deleteAlert, checkPriceAlerts, runPortfolioHealthAlerts };
