import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

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

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mes = {
    from: '"Urban ease" <no-reply@urbaneaseapp.com>',
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <p>We received a login request for your account.</p>
        <p><strong style="font-size: 18px;">OTP: ${code}</strong></p>
        <p>This code expires in 5 minutes and can be used once.</p>
      </div>
    `,
  };

  await transporter.sendMail(mes);
  return true;
}

export function resendOtp(email) {
  // For potential future use
  return sendLoginOtp(email);
}
