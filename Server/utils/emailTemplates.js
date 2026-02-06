/**
 * Unified Email Templates for Urban Ease
 * 
 * This module provides consistent, branded email templates for all email communications.
 * All templates share the same base structure with customizable content.
 */

/**
 * Base Email Template
 * @param {Object} params - Template parameters
 * @param {string} params.headerTitle - Main header title
 * @param {string} params.headerIcon - Emoji icon for header
 * @param {string} params.headerClass - CSS class for header styling (approved, rejected, info, warning)
 * @param {string} params.content - Main email content (HTML)
 * @param {string} params.footerText - Additional footer text (optional)
 * @returns {string} Complete HTML email template
 */
export function createBaseEmailTemplate({ 
  headerTitle, 
  headerIcon = '🔔', 
  headerClass = 'info', 
  content, 
  footerText = '' 
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .header {
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    
    .header.approved {
      background: linear-gradient(135deg, #4CAF50, #2e7d32);
    }
    
    .header.rejected {
      background: linear-gradient(135deg, #e53935, #b71c1c);
    }
    
    .header.info {
      background: linear-gradient(135deg, #1976d2, #0d47a1);
    }
    
    .header.warning {
      background: linear-gradient(135deg, #fb8c00, #ef6c00);
    }
    
    .header.security {
      background: linear-gradient(135deg, #5e35b1, #4527a0);
    }
    
    .header-icon {
      font-size: 48px;
      margin-bottom: 12px;
      line-height: 1;
    }
    
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 32px 28px;
      font-size: 16px;
      color: #444;
    }
    
    .content p {
      margin: 0 0 16px 0;
    }
    
    .content p:last-child {
      margin-bottom: 0;
    }
    
    .highlight-box {
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
      padding: 18px 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    
    .highlight-box.success {
      background: #e8f5e9;
      border-left-color: #4CAF50;
    }
    
    .highlight-box.warning {
      background: #fff3e0;
      border-left-color: #fb8c00;
    }
    
    .highlight-box.error {
      background: #ffebee;
      border-left-color: #e53935;
    }
    
    .credentials-box {
      background: #e3f2fd;
      border: 1px solid #90caf9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .credentials-box h3 {
      margin: 0 0 12px 0;
      color: #1565c0;
      font-size: 18px;
    }
    
    .credentials-box p {
      margin: 8px 0;
    }
    
    .credential-value {
      background: #f1f3f4;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: bold;
      color: #d32f2f;
      display: inline-block;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 28px;
      margin: 20px 0 10px 0;
      background: #1976d2;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 14px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      background: #1565c0;
      box-shadow: 0 6px 15px rgba(25, 118, 210, 0.4);
      transform: translateY(-2px);
    }
    
    .btn.success {
      background: #4CAF50;
      box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
    }
    
    .btn.success:hover {
      background: #45a049;
    }
    
    .btn-container {
      text-align: center;
      margin: 24px 0;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 24px 0;
    }
    
    .footer {
      text-align: center;
      font-size: 13px;
      color: #666;
      padding: 20px;
      background: #f1f3f4;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: inherit;
      margin-bottom: 8px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .content {
        padding: 24px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .btn {
        padding: 12px 24px;
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header ${headerClass}">
      <div class="header-icon">${headerIcon}</div>
      <div class="logo">Urban Ease</div>
      <h1>${headerTitle}</h1>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>
        <strong>Urban Ease</strong> - Community Management Platform<br />
        This is an automated message. Please do not reply to this email.
      </p>
      ${footerText ? `<p style="margin-top: 12px;">${footerText}</p>` : ''}
      <p style="margin-top: 12px;">
        Need help? Contact us at 
        <a href="mailto:support@urbaneaseapp.com">support@urbaneaseapp.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * OTP Email Template
 * @param {Object} params
 * @param {string} params.otp - One-time password code
 * @param {number} params.expiryMinutes - OTP expiry time in minutes (default: 5)
 * @returns {string} HTML email template
 */
export function createOTPEmailTemplate({ otp, expiryMinutes = 5 }) {
  const content = `
    <p>Hello,</p>
    <p>We received a request to verify your account. Please use the One-Time Password (OTP) below to proceed:</p>
    
    <div class="credentials-box">
      <h3>🔐 Your OTP Code</h3>
      <p style="font-size: 28px; text-align: center; letter-spacing: 4px; font-weight: bold; color: #1976d2; margin: 16px 0;">
        ${otp}
      </p>
    </div>
    
    <div class="highlight-box warning">
      <p><strong>⏰ Important:</strong> This OTP is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
      <p style="margin-bottom: 0;"><strong>🔒 Security Notice:</strong> Never share this code with anyone. Urban Ease will never ask for your OTP.</p>
    </div>
    
    <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Verify Your Account',
    headerIcon: '🔐',
    headerClass: 'security',
    content
  });
}

/**
 * Temporary Password Email Template
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Temporary password
 * @param {string} params.loginUrl - URL to login page
 * @returns {string} HTML email template
 */
export function createTemporaryPasswordTemplate({ email, password, loginUrl }) {
  const content = `
    <p>Hello,</p>
    <p>Welcome to <strong>Urban Ease</strong>! Your account has been created successfully. Please use the temporary credentials below to sign in:</p>
    
    <div class="credentials-box">
      <h3>🔑 Login Credentials</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> <span class="credential-value">${password}</span></p>
    </div>
    
    <div class="highlight-box warning">
      <p><strong>⚠️ Action Required:</strong> For security reasons, please change your password immediately after your first login.</p>
      <p style="margin-bottom: 0;"><strong>🔒 Keep It Safe:</strong> Never share your password with anyone.</p>
    </div>
    
    <div class="btn-container">
      <a href="${loginUrl}" class="btn">Login to Your Account</a>
    </div>
    
    <p style="margin-top: 24px;">If you did not expect this email or need assistance, please contact our support team.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Welcome to Urban Ease',
    headerIcon: '🎉',
    headerClass: 'info',
    content
  });
}

/**
 * Application Approved Email Template
 * @param {Object} params
 * @param {string} params.adminName - Name of approving admin
 * @param {string} params.paymentLink - URL to payment page
 * @param {string} params.message - Custom message (optional)
 * @returns {string} HTML email template
 */
export function createApplicationApprovedTemplate({ adminName, paymentLink, message = '' }) {
  const content = `
    <p>Hello,</p>
    <p>Congratulations! Your community manager application has been <strong>approved</strong> by ${adminName}.</p>
    
    ${message ? `<div class="highlight-box success"><p>${message}</p></div>` : ''}
    
    <div class="highlight-box">
      <p><strong>📋 Next Steps:</strong></p>
      <ol style="margin: 8px 0 0 20px; padding: 0;">
        <li>Complete your subscription payment using the button below</li>
        <li>Receive your login credentials via email</li>
        <li>Access your community management dashboard</li>
      </ol>
    </div>
    
    <div class="btn-container">
      <a href="${paymentLink}" class="btn success">Complete Payment & Activate Account</a>
    </div>
    
    <p style="margin-top: 24px;">If you have any questions, feel free to reach out to our support team.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Application Approved!',
    headerIcon: '✅',
    headerClass: 'approved',
    content
  });
}

/**
 * Application Rejected Email Template
 * @param {Object} params
 * @param {string} params.adminName - Name of rejecting admin
 * @param {string} params.reason - Rejection reason
 * @returns {string} HTML email template
 */
export function createApplicationRejectedTemplate({ adminName, reason }) {
  const content = `
    <p>Hello,</p>
    <p>Thank you for your interest in Urban Ease. After careful review, ${adminName} has decided not to approve your application at this time.</p>
    
    <div class="highlight-box error">
      <p><strong>Reason for Rejection:</strong></p>
      <p>${reason}</p>
    </div>
    
    <p>We appreciate your interest in our platform. If you believe this decision was made in error or if you have additional information to provide, please contact our support team.</p>
    
    <p>Thank you for your understanding.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Application Status Update',
    headerIcon: '📋',
    headerClass: 'rejected',
    content
  });
}

/**
 * Account Activated Email Template
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Account password
 * @param {string} params.loginUrl - URL to login page
 * @returns {string} HTML email template
 */
export function createAccountActivatedTemplate({ email, password, loginUrl }) {
  const content = `
    <p>Hello,</p>
    <p>Great news! Your payment has been processed successfully, and your Urban Ease account is now <strong>active</strong>! 🎉</p>
    
    <div class="credentials-box">
      <h3>🔑 Your Login Credentials</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> <span class="credential-value">${password}</span></p>
    </div>
    
    <div class="highlight-box warning">
      <p><strong>🔒 Security First:</strong> Please login and change your password immediately to secure your account.</p>
    </div>
    
    <div class="btn-container">
      <a href="${loginUrl}" class="btn success">Login to Dashboard</a>
    </div>
    
    <div class="divider"></div>
    
    <p><strong>What's Next?</strong></p>
    <ul style="margin: 8px 0 0 20px; padding: 0;">
      <li>Complete your community profile setup</li>
      <li>Add residents and staff members</li>
      <li>Configure amenities and common spaces</li>
      <li>Start managing your community efficiently</li>
    </ul>
    
    <p style="margin-top: 20px;">Welcome to the Urban Ease family! We're excited to help you manage your community.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Account Activated - Welcome!',
    headerIcon: '🚀',
    headerClass: 'approved',
    content,
    footerText: 'Get started today and experience seamless community management.'
  });
}

/**
 * Payment Link Email Template
 * @param {Object} params
 * @param {string} params.paymentLink - URL to payment page
 * @param {string} params.expiryDays - Number of days until link expires (default: 7)
 * @returns {string} HTML email template
 */
export function createPaymentLinkTemplate({ paymentLink, expiryDays = 7 }) {
  const content = `
    <p>Hello,</p>
    <p>This is a reminder to complete your subscription payment to activate your Urban Ease account.</p>
    
    <div class="highlight-box warning">
      <p><strong>⏰ Action Required:</strong> Please complete your payment within <strong>${expiryDays} days</strong> to maintain your approval status.</p>
    </div>
    
    <div class="btn-container">
      <a href="${paymentLink}" class="btn">Complete Payment Now</a>
    </div>
    
    <p style="margin-top: 24px;"><strong>What happens after payment?</strong></p>
    <ul style="margin: 8px 0 0 20px; padding: 0;">
      <li>Immediate account activation</li>
      <li>Login credentials sent to your email</li>
      <li>Full access to community management tools</li>
    </ul>
    
    <p style="margin-top: 20px;">If you're experiencing any issues with the payment process, please don't hesitate to contact our support team.</p>
  `;

  return createBaseEmailTemplate({
    headerTitle: 'Complete Your Payment',
    headerIcon: '💳',
    headerClass: 'warning',
    content
  });
}

/**
 * Generic Notification Email Template
 * @param {Object} params
 * @param {string} params.title - Email title
 * @param {string} params.message - Main message content
 * @param {string} params.icon - Header icon (default: 🔔)
 * @param {string} params.type - Email type: 'info', 'success', 'warning', 'error' (default: 'info')
 * @returns {string} HTML email template
 */
export function createNotificationTemplate({ title, message, icon = '🔔', type = 'info' }) {
  const content = `
    <p>Hello,</p>
    ${message}
  `;

  return createBaseEmailTemplate({
    headerTitle: title,
    headerIcon: icon,
    headerClass: type,
    content
  });
}
