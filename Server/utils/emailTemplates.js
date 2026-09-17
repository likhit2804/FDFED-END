/**
 * Unified Email Templates for Urban Ease
 * 
 * This module provides consistent, branded email templates for all email communications.
 * All templates share the original UrbanEase OTP template structure with zero emojis.
 */

import {
  createUrbanEaseStandardEmail,
  createCommonOtpEmailTemplate,
  createTemporaryPasswordEmailTemplate,
  createApplicationApprovedEmailTemplate,
  createAccountActivatedEmailTemplate,
  ORIGINAL_OTP_LOGO,
} from './otpEmailTemplates.js';

/**
 * Base Email Template
 * Wraps content in the canonical UrbanEase OTP layout.
 * @param {Object} params - Template parameters
 * @param {string} params.headerTitle - Main header title
 * @param {string} params.content - Main email content (HTML)
 * @param {string} [params.footerText] - Additional footer text
 * @returns {string} Complete HTML email template
 */
export function createBaseEmailTemplate({
  headerTitle = "Urban Ease",
  content = "",
  footerText = "",
}) {
  return createUrbanEaseStandardEmail({
    title: headerTitle,
    subtitle: "",
    mainBlock: `<div>${content}</div>`,
    securityNote: footerText,
    logoSrc: ORIGINAL_OTP_LOGO,
  });
}

/**
 * OTP Email Template — Original UrbanEase OTP layout
 */
export function createOTPEmailTemplate({ otp, expiryMinutes = 5, logoSrc = ORIGINAL_OTP_LOGO }) {
  return createCommonOtpEmailTemplate({
    otp,
    expiryMinutes,
    logoSrc,
  });
}

/**
 * Temporary Password Email Template (Unified with Urban Ease OTP template)
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Temporary password
 * @param {string} params.loginUrl - URL to login page
 * @param {string} [params.userType] - User type / role
 * @param {string} [params.username] - User display name
 * @returns {string} HTML email template
 */
export function createTemporaryPasswordTemplate({
  email,
  password,
  loginUrl,
  username = "",
}) {
  return createTemporaryPasswordEmailTemplate({
    email,
    password,
    loginUrl,
    username,
  });
}

/**
 * Application Approved Email Template
 * Uses the exact original OTP template layout with zero emojis.
 */
export function createApplicationApprovedTemplate({
  adminName,
  paymentLink,
  message = '',
  applicantName = '',
}) {
  return createApplicationApprovedEmailTemplate({
    adminName,
    paymentLink,
    message,
    applicantName,
  });
}

/**
 * Application Rejected Email Template
 * Uses the exact original OTP template layout with zero emojis.
 */
export function createApplicationRejectedTemplate({ adminName, reason, applicantName = "" }) {
  const greeting = applicantName ? `Hello ${applicantName},` : "Hello,";
  const subtitle = `${greeting}<br/>Thank you for your interest in Urban Ease. After review, ${adminName} has decided not to approve your application at this time.`;

  const mainBlock = `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:18px 20px;
      margin-bottom:16px;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Reason for Decision</div>
      <div style="font-size:14px;line-height:1.6;color:#18181b;">${reason}</div>
    </div>
    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.65;">
      If you believe this decision was made in error or if you have additional information to provide, please contact our support team.
    </p>
  `;

  return createUrbanEaseStandardEmail({
    title: "Application Status Update",
    subtitle,
    mainBlock,
    securityNote: "Thank you for your interest in Urban Ease.",
  });
}

/**
 * Account Activated Email Template
 * Uses the exact original OTP template layout with zero emojis.
 */
export function createAccountActivatedTemplate({
  email,
  password,
  loginUrl,
  applicantName = '',
}) {
  return createAccountActivatedEmailTemplate({
    email,
    password,
    loginUrl,
    applicantName,
  });
}

/**
 * Payment Link Email Template
 * Uses the exact original OTP template layout with zero emojis.
 */
export function createPaymentLinkTemplate({ paymentLink, expiryDays = 7, applicantName = "" }) {
  const greeting = applicantName ? `Hello ${applicantName},` : "Hello,";
  const subtitle = `${greeting}<br/>This is a reminder to complete your subscription payment to activate your Urban Ease account. Valid for ${expiryDays} days.`;

  const mainBlock = `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:18px 20px;
      margin-bottom:20px;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Action Required</div>
      <p style="margin:0;font-size:14px;color:#71717a;line-height:1.6;">
        Please complete your payment within ${expiryDays} days to maintain your approval status and receive your login credentials.
      </p>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${paymentLink}" style="
        display:inline-block;
        padding:12px 28px;
        background:#18181b;
        color:#ffffff;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
        border-radius:6px;
      ">Complete Payment Now</a>
    </div>
  `;

  return createUrbanEaseStandardEmail({
    title: "Complete Your Payment",
    subtitle,
    mainBlock,
    securityNote: "If you have any questions regarding the payment process, please contact our support team.",
  });
}

/**
 * Generic Notification Email Template
 * Uses the exact original OTP template layout with zero emojis.
 */
export function createNotificationTemplate({ title, message }) {
  const mainBlock = `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:18px 20px;
    ">
      <div style="font-size:14px;line-height:1.65;color:#18181b;">${message}</div>
    </div>
  `;

  return createUrbanEaseStandardEmail({
    title,
    subtitle: "Notification from Urban Ease:",
    mainBlock,
    securityNote: "This is an automated message from Urban Ease. Please do not reply directly to this email.",
  });
}

export default {
  createBaseEmailTemplate,
  createOTPEmailTemplate,
  createTemporaryPasswordTemplate,
  createApplicationApprovedTemplate,
  createApplicationRejectedTemplate,
  createAccountActivatedTemplate,
  createPaymentLinkTemplate,
  createNotificationTemplate,
};
