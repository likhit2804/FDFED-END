import { sendOTPEmail, sendTemporaryPasswordEmail } from "../../utils/emailService.js";
import Resident from "../../models/resident.js";
import Worker from "../../models/workers.js";
import Security from "../../models/security.js";

import dotenv from "dotenv";
dotenv.config();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP store per email with expiry
const otpStore = new Map(); // email -> { otp, expiresAt }

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function OTP(email) {
  const otp = generateOTP();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });

  await sendOTPEmail(email, otp, 5);
  return otp;
}

function verify(email, otp) {
  const entry = otpStore.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  const ok = entry.otp === String(otp);
  if (ok) otpStore.delete(email);
  return ok;
}

function generateSecurePassword(email) {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&";
  const randomLength = 8;

  const emailPrefix = email.split("@")[0].slice(0, 4);

  let randomPart = "";
  for (let i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * randomChars.length);
    randomPart += randomChars[randomIndex];
  }

  const password = emailPrefix + "_" + randomPart;

  return password;
}

async function sendPassword({ email, userType }) {
  const password = generateSecurePassword(email);

  await sendTemporaryPasswordEmail(email, password);
  return password;
}

export { OTP, verify, sendPassword };

