/**
 * schedulerService.js
 *
 * Centralized cron-based job scheduler.
 * All scheduled tasks are registered here and started on server boot.
 *
 * Jobs:
 *  - Every 30s  → broadcast live market price ticks (top indices)
 *  - Every 5min → check watchlist price alert thresholds
 *  - Every 10min→ fetch & broadcast breaking news
 *  - Every 1hr  → run portfolio health check for all active users
 *  - Every 6hr  → regenerate AI daily summary cache
 */

'use strict';

const cron = require('node-cron');
const { env } = require('../config/env');

let _isRunning = false;
const _tasks = new Map();

/**
 * Register and start a cron task.
 *
 * @param {string} name         Unique task identifier.
 * @param {string} schedule     cron expression (5 or 6 field).
 * @param {() => Promise<void>} handler  Async task handler.
 */
function register(name, schedule, handler) {
  if (_tasks.has(name)) {
    console.warn(`[Scheduler] Task "${name}" already registered. Skipping.`);
    return;
  }

  const task = cron.schedule(schedule, async () => {
    try {
      await handler();
    } catch (err) {
      console.error(`[Scheduler] Task "${name}" failed:`, err.message);
    }
  }, { scheduled: false });

  _tasks.set(name, task);
  console.log(`[Scheduler] Registered: "${name}" @ "${schedule}"`);
}

/**
 * Start all registered cron tasks.
 * Called once from server.js after socketService.init().
 */
function startAll() {
  if (_isRunning) {
    console.warn('[Scheduler] Already running.');
    return;
  }

  for (const [name, task] of _tasks) {
    task.start();
    console.log(`[Scheduler] Started: "${name}"`);
  }

  _isRunning = true;
  console.log(`[Scheduler] ${_tasks.size} task(s) started.`);
}

/**
 * Stop all tasks gracefully (e.g. on SIGTERM).
 */
function stopAll() {
  for (const [name, task] of _tasks) {
    task.stop();
    console.log(`[Scheduler] Stopped: "${name}"`);
  }
  _isRunning = false;
}

// ── Job definitions ───────────────────────────────────────────────────────────

/**
 * Wire up all production jobs.
 * Import services lazily inside each handler to avoid circular dependencies.
 *
 * @param {object} opts
 * @param {import('./socketService')} opts.socketService
 */
function initJobs({ socketService } = {}) {

  // ── 1. Live Market Price Ticks (every 30 seconds) ─────────────────────────
  register('market-ticks', '*/30 * * * * *', async () => {
    try {
      const { marketService } = require('./marketService');
      const indices = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'];
      for (const symbol of indices) {
        try {
          const quote = await marketService.getAssetBySymbol(symbol);
          if (quote && socketService) {
            socketService.emitMarketTick({
              symbol: quote.symbol,
              price: quote.price,
              change: quote.change ?? 0,
              changePercent: quote.changePercent ?? 0,
            });
          }
        } catch { /* skip individual symbol errors */ }
      }
    } catch (err) {
      console.error('[Scheduler:market-ticks]', err.message);
    }
  });

  // ── 2. Price Alert Check (every 5 minutes) ────────────────────────────────
  register('price-alert-check', '*/5 * * * *', async () => {
    try {
      const alertService = require('./alertService');
      await alertService.checkPriceAlerts({ socketService });
    } catch (err) {
      console.error('[Scheduler:price-alert-check]', err.message);
    }
  });

  // ── 3. Breaking News Fetch & Broadcast (every 10 minutes) ─────────────────
  register('news-broadcast', '*/10 * * * *', async () => {
    try {
      const newsService = require('./newsService');
      const articles = await newsService.getMarketNews(5);
      if (socketService && Array.isArray(articles)) {
        for (const article of articles.slice(0, 3)) {
          socketService.emitBreakingNews({
            title: article.title,
            source: article.source,
            url: article.url,
            sentiment: article.sentiment,
            publishedAt: article.publishedAt,
          });
        }
      }
    } catch (err) {
      console.error('[Scheduler:news-broadcast]', err.message);
    }
  });

  // ── 4. Portfolio Health Check (every hour) ────────────────────────────────
  register('portfolio-health', '0 * * * *', async () => {
    try {
      const alertService = require('./alertService');
      await alertService.runPortfolioHealthAlerts({ socketService });
    } catch (err) {
      console.error('[Scheduler:portfolio-health]', err.message);
    }
  });

  // ── 5. AI Summary Cache Refresh (every 6 hours) ───────────────────────────
  register('ai-summary-refresh', '0 */6 * * *', async () => {
    if (env.nodeEnv !== 'production') return;
    try {
      const aiService = require('./aiService');
      if (typeof aiService.refreshSummaryCache === 'function') {
        await aiService.refreshSummaryCache();
        console.log('[Scheduler] AI summary cache refreshed.');
      }
    } catch (err) {
      console.error('[Scheduler:ai-summary-refresh]', err.message);
    }
  });
}

module.exports = { register, startAll, stopAll, initJobs };
