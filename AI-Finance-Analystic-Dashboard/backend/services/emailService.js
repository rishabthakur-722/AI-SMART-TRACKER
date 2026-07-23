/**
 * emailService.js
 *
 * Sends transactional emails via Resend (https://resend.com).
 * API key is loaded from process.env.RESEND_API_KEY (backend .env only).
 *
 * Methods:
 *  - sendAlertEmail(userId, { subject, body })
 *  - sendWelcomeEmail(to, name)
 *  - sendPortfolioReport(to, { subject, htmlContent })
 *  - sendRaw(to, subject, html)
 */

'use strict';

const { env } = require('../config/env');

const RESEND_API = 'https://api.resend.com/emails';
const FROM_ADDRESS = `StockIQ <alerts@${env.emailFromDomain || 'stockiq.app'}>`;

/**
 * Send an email via Resend REST API.
 * Uses native fetch (Node 18+). Falls back gracefully if API key is missing.
 *
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @returns {Promise<void>}
 */
async function sendRaw(to, subject, html) {
  const apiKey = env.resendApiKey;

  if (!apiKey) {
    console.warn(`[EmailService] RESEND_API_KEY not set. Skipping email to ${to}: "${subject}"`);
    return;
  }

  if (!to) {
    console.warn('[EmailService] No recipient address. Skipping.');
    return;
  }

  const payload = {
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[EmailService] Resend error (${response.status}):`, text);
    return;
  }

  console.log(`[EmailService] Email sent → ${to}: "${subject}"`);
}

/**
 * Send a price / portfolio alert email.
 * Resolves the user's email from DB. Falls back gracefully if user not found.
 *
 * @param {string} userId    MongoDB user ID or email string (if email already resolved)
 * @param {{ subject: string; body: string }} opts
 */
async function sendAlertEmail(userId, { subject, body }) {
  let email = userId; // If userId looks like an email, use directly

  if (userId && !userId.includes('@')) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId).select('email').lean();
      email = user?.email;
    } catch {
      console.warn(`[EmailService] Could not resolve email for userId: ${userId}`);
      return;
    }
  }

  if (!email) return;

  const html = buildAlertHTML({ subject, body });
  return sendRaw(email, subject, html);
}

/**
 * Send a welcome email to a new user.
 *
 * @param {string} to
 * @param {string} name
 */
async function sendWelcomeEmail(to, name) {
  const subject = `Welcome to StockIQ, ${name}!`;
  const html = buildWelcomeHTML(name);
  return sendRaw(to, subject, html);
}

/**
 * Send a portfolio report HTML email.
 *
 * @param {string} to
 * @param {{ subject: string; htmlContent: string }} opts
 */
async function sendPortfolioReport(to, { subject, htmlContent }) {
  return sendRaw(to, subject, htmlContent);
}

// ── HTML Templates ────────────────────────────────────────────────────────────

function buildAlertHTML({ subject, body }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
        <div style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#fff;">
            ⚡ StockIQ Alert
          </span>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#a5b4fc;">${subject}</h2>
          <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(226,232,240,0.75);">${body}</p>
        </div>
        <div style="padding:20px 32px;background:rgba(255,255,255,0.03);text-align:center;">
          <a href="${env.clientUrl || 'https://stockiq.app'}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
            Open StockIQ →
          </a>
        </div>
        <div style="padding:16px 32px;text-align:center;font-size:11px;color:rgba(255,255,255,0.2);">
          You're receiving this because you set up an alert on StockIQ.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildWelcomeHTML(name) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to StockIQ</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#0f172a,#1a1040);border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
        <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:28px;font-weight:800;letter-spacing:-1px;background:linear-gradient(90deg,#818cf8,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            StockIQ
          </span>
          <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;text-transform:uppercase;">AI Financial Intelligence</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;">Welcome, ${name}! 🎉</h1>
          <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(226,232,240,0.65);">
            Your AI-powered financial intelligence terminal is ready. Track markets, analyze your portfolio, discover opportunities, and set smart alerts — all in one place.
          </p>
          <div style="margin:28px 0;">
            <a href="${env.clientUrl || 'https://stockiq.app'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
              Launch Dashboard →
            </a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { sendRaw, sendAlertEmail, sendWelcomeEmail, sendPortfolioReport };
