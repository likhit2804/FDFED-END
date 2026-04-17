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
export async function sendLoginOtp(email) {
  const code = generateOTP();
  setOtp(email, code);
  await sendOTPEmail(email, code, 5);
  return true;
}

/**
 * Alias kept for callers that used the old controllers/shared/OTP.js#OTP() export.
 * Returns the raw OTP string (for cases where the caller needs to store it).
 * @param {string} email
 * @returns {Promise<string>}
 */
export async function sendOtp(email) {
  const code = generateOTP();
  setOtp(email, code);
  await sendOTPEmail(email, code, 5);
  return code;
}

/** Resend (re-generate) an OTP to the same email. */
export function resendOtp(email) {
  return sendLoginOtp(email);
}

/**
 * Verify an OTP submitted by the user.
 * @param {string} email
 * @param {string} code
 * @returns {{ ok: boolean, reason?: string }}
 */
export function verifyOtp(email, code) {
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
  const ok = record.code === String(code);
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
  await sendTemporaryPasswordEmail(email, password);
  return true;
}
