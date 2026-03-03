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
 * OTP Email Template — Narrow vertical with logo
 */
export function createOTPEmailTemplate({ otp, expiryMinutes = 5 }) {
  const code = String(otp);
  const mid = Math.ceil(code.length / 2);
  const chunked = code.slice(0, mid) + '\u00a0\u00a0' + code.slice(mid);
  const logoSrc = 'data:image/png;base64,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';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your sign-in code — UrbanEase</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px;">
    <tr>
      <td align="center" valign="top">
        <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#ffffff;border-radius:10px;">

          <!-- logo header -->
          <tr>
            <td align="center" style="background:#18181b;border-radius:10px 10px 0 0;padding:24px 36px;">
              <img src="${logoSrc}" alt="UrbanEase" width="160" style="display:block;max-width:160px;height:auto;"/>
            </td>
          </tr>

          <!-- heading -->
          <tr>
            <td style="padding:32px 36px 0;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#18181b;letter-spacing:-0.2px;">Your sign-in code</p>
            </td>
          </tr>

          <!-- subtext -->
          <tr>
            <td style="padding:10px 36px 0;">
              <p style="margin:0;font-size:14px;color:#71717a;line-height:1.65;">
                Enter this code to complete your sign-in. Valid for the next <strong style="color:#18181b;">${expiryMinutes} minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- OTP code block — large, monospace, easy to select & copy -->
          <tr>
            <td style="padding:28px 36px;">
              <div style="
                background:#fafafa;
                border:1px solid #e4e4e7;
                border-radius:8px;
                padding:32px 20px 20px;
                text-align:center;
              ">
                <span style="
                  display:block;
                  font-size:46px;
                  font-weight:700;
                  letter-spacing:10px;
                  color:#18181b;
                  font-family:'Courier New',Courier,monospace;
                  line-height:1;
                  user-select:all;
                  -webkit-user-select:all;
                ">${chunked}</span>
                <span style="display:block;margin-top:14px;font-size:12px;color:#a1a1aa;letter-spacing:0.2px;">Expires in ${expiryMinutes} min · Click the code to select it</span>
              </div>
            </td>
          </tr>

          <!-- security note -->
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                Never share this code with anyone. UrbanEase will never ask for it.
                If you didn't request this, your account is safe — no action needed.
              </p>
            </td>
          </tr>

          <!-- divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:#f0f0f0;"></div>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:20px 36px 28px;">
              <p style="margin:0;font-size:12px;color:#d4d4d8;line-height:1.7;">
                UrbanEase · Community Management<br/>
                Questions? <a href="mailto:urbanease.team@gmail.com" style="color:#a1a1aa;text-decoration:none;">urbanease.team@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
