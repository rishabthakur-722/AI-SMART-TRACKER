/**
 * socketService.js
 *
 * Central Socket.IO room and event management.
 * Attach to an existing http.Server using socketService.init(httpServer).
 *
 * Rooms:
 *  - "market"        → live price ticks for global indices + watchlist symbols
 *  - "portfolio:{id}"→ personal portfolio updates for a specific user
 *  - "news"          → breaking news broadcasts
 *  - "alerts:{id}"   → personal price & portfolio alerts per user
 *
 * The init() function returns the io instance which can be imported by routes
 * or other services via socketService.getIO().
 */

'use strict';

const { Server } = require('socket.io');
const { env } = require('../config/env');

/** @type {import('socket.io').Server | null} */
let _io = null;

/**
 * Initialise Socket.IO on the given HTTP server.
 * Call once from server.js after http server is created.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function init(httpServer) {
  if (_io) return _io;

  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  _io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ── Room subscriptions ──────────────────────────────────────────────────

    socket.on('subscribe:market', () => {
      socket.join('market');
      socket.emit('subscribed', { room: 'market' });
    });

    socket.on('subscribe:news', () => {
      socket.join('news');
      socket.emit('subscribed', { room: 'news' });
    });

    /**
     * Subscribe to a user-specific portfolio room.
     * @param {{ userId: string }} payload
     */
    socket.on('subscribe:portfolio', ({ userId } = {}) => {
      if (!userId) return;
      const room = `portfolio:${userId}`;
      socket.join(room);
      socket.emit('subscribed', { room });
    });

    /**
     * Subscribe to personal price alerts.
     * @param {{ userId: string }} payload
     */
    socket.on('subscribe:alerts', ({ userId } = {}) => {
      if (!userId) return;
      const room = `alerts:${userId}`;
      socket.join(room);
      socket.emit('subscribed', { room });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} — ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error from ${socket.id}:`, err.message);
    });
  });

  console.log('[Socket] Socket.IO initialised.');
  return _io;
}

/**
 * Returns the Socket.IO server instance.
 * Throws if init() has not been called yet.
 *
 * @returns {import('socket.io').Server}
 */
function getIO() {
  if (!_io) throw new Error('[socketService] Socket.IO not initialised. Call init(httpServer) first.');
  return _io;
}

// ── Emit helpers ─────────────────────────────────────────────────────────────

/**
 * Broadcast a market price tick to the "market" room.
 * @param {{ symbol: string; price: number; change: number; changePercent: number }} tick
 */
function emitMarketTick(tick) {
  if (!_io) return;
  _io.to('market').emit('market:tick', tick);
}

/**
 * Broadcast a breaking news item to the "news" room.
 * @param {{ title: string; source: string; url: string; sentiment?: string; publishedAt: string }} article
 */
function emitBreakingNews(article) {
  if (!_io) return;
  _io.to('news').emit('news:breaking', article);
}

/**
 * Send a portfolio update to a specific user's room.
 * @param {string} userId
 * @param {{ totalValue: number; pnl: number; pnlPercent: number }} update
 */
function emitPortfolioUpdate(userId, update) {
  if (!_io || !userId) return;
  _io.to(`portfolio:${userId}`).emit('portfolio:update', update);
}

/**
 * Send a price/portfolio alert to a specific user.
 * @param {string} userId
 * @param {{ type: 'price' | 'portfolio'; symbol?: string; message: string; severity: 'info' | 'warning' | 'critical' }} alert
 */
function emitAlert(userId, alert) {
  if (!_io || !userId) return;
  _io.to(`alerts:${userId}`).emit('alert:triggered', { ...alert, timestamp: new Date().toISOString() });
}

module.exports = { init, getIO, emitMarketTick, emitBreakingNews, emitPortfolioUpdate, emitAlert };
