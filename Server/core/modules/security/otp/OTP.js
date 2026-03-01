import { sendOTPEmail, sendTemporaryPasswordEmail } from "../../../utils/emailService.js";

const store = new Map(); // key: email, value: { code, expiresAt, attempts }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setOtp(email, code, ttlMs = 5 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  store.set(email, { code, expiresAt, attempts: 0 });
}

export function verifyOtp(email, code) {
  const record = store.get(email);
  if (!record) return { ok: false, reason: "not_found" };
  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return { ok: false, reason: "expired" };
  }
  record.attempts += 1;
  if (record.attempts > 5) {
    store.delete(email);
    return { ok: false, reason: "too_many_attempts" };
  }
  const ok = record.code === code;
  if (ok) store.delete(email);
  return { ok, reason: ok ? undefined : "mismatch" };
}

export async function sendLoginOtp(email) {
  const code = generateOTP();
  setOtp(email, code);

  await sendOTPEmail(email, code, 5);
  return true;
}

export function resendOtp(email) {
  return sendLoginOtp(email);
}

export async function sendTemporaryPassword(email, password) {
  await sendTemporaryPasswordEmail(email, password);
  return true;
}

// Backward-compatible helper used by manager user-management routes.
export async function sendPassword({ email }) {
  const password = Math.random().toString(36).slice(-10);
  await sendTemporaryPasswordEmail(email, password);
  return password;
}

