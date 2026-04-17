/**
 * Centralized Email Service for Urban Ease
 * 
 * This module provides a unified email sending service with:
 * - Single transporter instance (reusable)
 * - Consistent error handling
 * - Logging for all email operations
 * - Support for all email template types
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createTemporaryPasswordTemplate,
  createApplicationApprovedTemplate,
  createApplicationRejectedTemplate,
  createAccountActivatedTemplate,
  createPaymentLinkTemplate,
  createNotificationTemplate
} from './emailTemplates.js';
import { createOtpEmailByType } from './otpEmailTemplates.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OTP_LOGO_PATH = path.resolve(__dirname, '../../Client/src/imgs/logo_N_white_email.png');
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || '';

function buildCloudinaryLogoUrl() {
  if (EMAIL_LOGO_URL.trim()) return EMAIL_LOGO_URL.trim();
  return '';
}

// Validate required environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing email configuration: ${missingVars.join(', ')}`);
}

/**
 * Create and configure the email transporter
 * Singleton pattern - reuse the same transporter across all email sends
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Check EMAIL_USER and EMAIL_PASS in .env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    pool: true, // Use pooled connections for better performance
    maxConnections: 5,
    maxMessages: 100
  });
};

// Single transporter instance
let transporter = null;

/**
 * Get or create the email transporter
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Base function to send any email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - Email HTML content
 * @param {string} params.text - Plain text version (optional)
 * @param {Array} params.attachments - Inline/file attachments (optional)
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail({ to, subject, html, text = '', attachments = [] }) {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Urban Ease" <no-reply@urbaneaseapp.com>',
      to,
      subject,
      html,
      text: text || subject, // Fallback to subject if no text provided
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${subject} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password code
 * @param {number} expiryMinutes - OTP validity period (default: 5)
 * @param {'login'|'registration'|'general'} type - OTP email context (default: login)
 * @param {Object} context - additional identity context
 * @param {string} context.username - login username/email to show in template
 * @param {string} context.userType - role name to show in template
 */
export async function sendOTPEmail(
  email,
  otp,
  expiryMinutes = 5,
  type = 'login',
  context = {}
) {
  const cloudinaryLogoUrl = buildCloudinaryLogoUrl();
  const logoExists = fs.existsSync(OTP_LOGO_PATH);
  const useCidFallback = !cloudinaryLogoUrl && logoExists;
  const attachments = logoExists
    ? useCidFallback
      ? [
          {
            filename: 'urbanease-logo.png',
            path: OTP_LOGO_PATH,
            cid: 'urbanease-logo',
          },
        ]
      : []
    : [];

  const html = createOtpEmailByType({
    otp,
    expiryMinutes,
    type,
    username: context.username || email,
    userType: context.userType,
    logoSrc: cloudinaryLogoUrl || (useCidFallback ? 'cid:urbanease-logo' : ''),
  });
  const subjectByType = {
    login: 'Login OTP - Urban Ease',
    registration: 'Registration OTP - Urban Ease',
    general: 'Your OTP - Urban Ease'
  };
  const subject = subjectByType[type] || subjectByType.general;
  
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your OTP is: ${otp}. It expires in ${expiryMinutes} minutes. Do not share this code with anyone.`,
    attachments,
  });
}

/**
 * Send temporary password email
 * @param {string} email - Recipient email
 * @param {string} password - Temporary password
 */
export async function sendTemporaryPasswordEmail(email, password) {
  const loginUrl = process.env.CLIENT_BASE_URL 
    ? `${process.env.CLIENT_BASE_URL}/SignIn` 
    : 'http://localhost:5173/SignIn';
    
  const html = createTemporaryPasswordTemplate({ email, password, loginUrl });
  
  return sendEmail({
    to: email,
    subject: 'Welcome to Urban Ease - Temporary Password',
    html,
    text: `Welcome to Urban Ease! Your temporary password is: ${password}. Please login and change it immediately. Login at: ${loginUrl}`
  });
}

/**
 * Send application approved email with payment link
 * @param {string} email - Recipient email
 * @param {string} adminName - Name of approving admin
 * @param {string} paymentLink - URL to payment page
 * @param {string} message - Custom message (optional)
 */
export async function sendApplicationApprovedEmail(email, adminName, paymentLink, message = '') {
  const html = createApplicationApprovedTemplate({ adminName, paymentLink, message });
  
  return sendEmail({
    to: email,
    subject: 'Application Approved - Complete Your Payment',
    html,
    text: `Your application has been approved by ${adminName}. Complete your payment to activate your account: ${paymentLink}`
  });
}

/**
 * Send application rejected email
 * @param {string} email - Recipient email
 * @param {string} adminName - Name of rejecting admin
 * @param {string} reason - Rejection reason
 */
export async function sendApplicationRejectedEmail(email, adminName, reason) {
  const html = createApplicationRejectedTemplate({ adminName, reason });
  
  return sendEmail({
    to: email,
    subject: 'Application Status Update - Urban Ease',
    html,
    text: `Your application has been reviewed by ${adminName}. Reason: ${reason}`
  });
}

/**
 * Send account activated email with credentials
 * @param {string} email - Recipient email
 * @param {string} password - Account password
 */
export async function sendAccountActivatedEmail(email, password) {
  const loginUrl = process.env.CLIENT_BASE_URL 
    ? `${process.env.CLIENT_BASE_URL}/SignIn` 
    : 'http://localhost:5173/SignIn';
    
  const html = createAccountActivatedTemplate({ email, password, loginUrl });
  
  return sendEmail({
    to: email,
    subject: 'Account Activated - Welcome to Urban Ease!',
    html,
    text: `Your account is now active! Email: ${email}, Password: ${password}. Login at: ${loginUrl}`
  });
}

/**
 * Send payment link reminder email
 * @param {string} email - Recipient email
 * @param {string} paymentLink - URL to payment page
 * @param {number} expiryDays - Days until link expires (default: 7)
 */
export async function sendPaymentLinkEmail(email, paymentLink, expiryDays = 7) {
  const html = createPaymentLinkTemplate({ paymentLink, expiryDays });
  
  return sendEmail({
    to: email,
    subject: 'Reminder: Complete Your Payment - Urban Ease',
    html,
    text: `Complete your subscription payment within ${expiryDays} days: ${paymentLink}`
  });
}

/**
 * Send generic notification email
 * @param {string} email - Recipient email
 * @param {string} title - Email title/subject
 * @param {string} message - Message content (can include HTML)
 * @param {Object} options - Additional options
 * @param {string} options.icon - Header icon (default: 🔔)
 * @param {string} options.type - Email type: 'info', 'success', 'warning', 'error' (default: 'info')
 */
export async function sendNotificationEmail(email, title, message, options = {}) {
  const { icon = '🔔', type = 'info' } = options;
  const html = createNotificationTemplate({ title, message, icon, type });
  
  return sendEmail({
    to: email,
    subject: title,
    html
  });
}

/**
 * Send login OTP (alias for backward compatibility)
 */
export const sendLoginOtp = sendOTPEmail;

/**
 * Close the transporter connection pool (for graceful shutdown)
 */
export function closeEmailService() {
  if (transporter) {
    transporter.close();
    transporter = null;
    console.log('📧 Email service closed');
  }
}

// Export the base sendEmail function for custom use cases
export { sendEmail };

export default {
  sendOTPEmail,
  sendTemporaryPasswordEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendAccountActivatedEmail,
  sendPaymentLinkEmail,
  sendNotificationEmail,
  sendLoginOtp,
  sendEmail,
  closeEmailService
};
