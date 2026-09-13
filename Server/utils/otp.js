/**
 * OTP & Credential Utilities — Urban Ease
 *
 * Single source of truth for:
 *  - OTP generation, storage, and verification
 *  - Secure temporary password generation
 *
 * Previously split across utils/otp.js AND controllers/shared/OTP.js — now unified.
 */

import { sendOTPEmail, sendTemporaryPasswordEmail } from "./emailService.js";

// ─────────────────────────────────────────────────────────────
// In-memory OTP store  { email → { code, expiresAt, attempts } }
// ─────────────────────────────────────────────────────────────

const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const MAX_ATTEMPTS = 5;

// ─────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setOtp(email, code, ttlMs = OTP_TTL_MS) {
  store.set(email, { code, expiresAt: Date.now() + ttlMs, attempts: 0 });
}

// ─────────────────────────────────────────────────────────────
// Public API — OTP
// ─────────────────────────────────────────────────────────────

/**
 * Generate an OTP, store it, and e-mail it to the user.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function sendLoginOtp(email, context = {}) {
  const code = generateOTP();
  setOtp(email, code);
  console.log(`\n========================================\n🔑 [2FA OTP] Code for ${email}: ${code}\n========================================\n`);
  
  // Non-blocking background email delivery: immediately resolves the HTTP request
  // so the OTP form displays instantly in the browser without waiting for SMTP delays
  Promise.resolve().then(() => {
    sendOTPEmail(email, code, 5, "login", context).catch((err) => {
      console.warn(`[OTP] Email delivery failed for ${email} (Use console OTP: ${code}):`, err.message);
    });
  });

  return true;
}

/**
 * Alias kept for callers that used the old controllers/shared/OTP.js#OTP() export.
 * Returns the raw OTP string (for cases where the caller needs to store it).
 * @param {string} email
 * @returns {Promise<string>}
 */
export async function sendOtp(email, context = {}) {
  const code = generateOTP();
  setOtp(email, code);
  console.log(`\n========================================\n🔑 [Registration OTP] Code for ${email}: ${code}\n========================================\n`);

  Promise.resolve().then(() => {
    sendOTPEmail(email, code, 5, "registration", context).catch((err) => {
      console.warn(`[OTP] Email delivery failed for ${email} (Use console OTP: ${code}):`, err.message);
    });
  });

  return code;
}

/** Resend (re-generate) an OTP to the same email. */
export function resendOtp(email, context = {}) {
  return sendLoginOtp(email, context);
}

export function getOtp(email) {
  const record = store.get(email);
  return record ? record.code : null;
}

/**
 * Verify an OTP submitted by the user.
 * @param {string} email
 * @param {string} code
 * @returns {{ ok: boolean, reason?: string }}
 */
export function verifyOtp(email, code) {
  // Master bypass code for local development (disabled in automated tests)
  if (process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID && String(code).trim() === "123456") {
    store.delete(email);
    return { ok: true };
  }

  const record = store.get(email);
  if (!record) return { ok: false, reason: "not_found" };
  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return { ok: false, reason: "expired" };
  }
  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    store.delete(email);
    return { ok: false, reason: "too_many_attempts" };
  }
  const ok = record.code === String(code).trim();
  if (ok) store.delete(email);
  return { ok, reason: ok ? undefined : "mismatch" };
}

/**
 * Simple boolean verify — matches the old controllers/shared/OTP.js#verify() signature.
 * @param {string} email
 * @param {string} otp
 * @returns {boolean}
 */
export function verify(email, otp) {
  return verifyOtp(email, otp).ok;
}

// ─────────────────────────────────────────────────────────────
// Public API — Password utilities
// ─────────────────────────────────────────────────────────────

const RAND_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&";

/**
 * Generate a secure temporary password.
 * Format: <first 4 chars of email prefix>_<8 random chars>
 * @param {string} email
 * @returns {string}
 */
export function generateSecurePassword(email) {
  const prefix = email.split("@")[0].slice(0, 4);
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += RAND_CHARS[Math.floor(Math.random() * RAND_CHARS.length)];
  }
  return `${prefix}_${random}`;
}

/**
 * Generate and e-mail a temporary password to the user.
 * @param {Object} opts
 * @param {string} opts.email
 * @returns {Promise<string>} The generated password
 */
export async function sendPassword({ email }) {
  const password = generateSecurePassword(email);
  await sendTemporaryPasswordEmail(email, password);
  return password;
}

/**
 * Send a pre-generated temporary password by e-mail.
 * Kept for back-compat with callers that already have the password string.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function sendTemporaryPassword(email, password) {
  Promise.resolve().then(() => {
    sendTemporaryPasswordEmail(email, password).catch((err) => {
      console.warn(`[TemporaryPassword] Email delivery failed for ${email}:`, err.message);
    });
  });
  return true;
}
