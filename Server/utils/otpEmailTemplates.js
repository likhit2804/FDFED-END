/**
 * Unified email templates for Urban Ease.
 * Strictly maintains the original UrbanEase OTP template structure across ALL emails:
 * - Dark logo header (#18181b) with crisp UrbanEase logo
 * - Clean white card on #f2f2f2 background
 * - Consistent typography, clean monospace code/credential boxes, and minimalist buttons
 * - Zero emojis
 * - Original divider and UrbanEase support footer
 */

export const ORIGINAL_OTP_LOGO = 'data:image/png;base64,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';

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOtp(otp) {
  return String(otp || "").replace(/\s+/g, "");
}

/**
 * Standard Urban Ease Email Shell
 * Matches the original OTP email template 1:1.
 */
export function createUrbanEaseStandardEmail({
  title,
  subtitle,
  mainBlock = "",
  securityNote = "Never share this code or your credentials with anyone. UrbanEase will never ask for them.",
  logoSrc = "",
}) {
  const activeLogo = logoSrc || ORIGINAL_OTP_LOGO;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${escapeHtml(title)} — UrbanEase</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px;">
    <tr>
      <td align="center" valign="top">
        <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">

          <!-- logo header -->
          <tr>
            <td align="center" style="background:#18181b;border-radius:10px 10px 0 0;padding:24px 36px;">
              <img src="${activeLogo}" alt="UrbanEase" width="160" style="display:block;max-width:160px;height:auto;"/>
            </td>
          </tr>

          <!-- heading -->
          <tr>
            <td style="padding:32px 36px 0;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#18181b;letter-spacing:-0.2px;">${escapeHtml(title)}</p>
            </td>
          </tr>

          <!-- subtext -->
          <tr>
            <td style="padding:10px 36px 0;">
              <p style="margin:0;font-size:14px;color:#71717a;line-height:1.65;">
                ${subtitle}
              </p>
            </td>
          </tr>

          <!-- content block -->
          <tr>
            <td style="padding:24px 36px;">
              ${mainBlock}
            </td>
          </tr>

          <!-- security note -->
          ${securityNote ? `
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                ${securityNote}
              </p>
            </td>
          </tr>` : ""}

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
 * Common OTP Email Template (Original OTP layout)
 */
export function createCommonOtpEmailTemplate({
  otp,
  expiryMinutes = 5,
  title = "Your sign-in code",
  subtitle = "",
  note = "",
  logoSrc = "",
}) {
  const code = normalizeOtp(otp);
  const mid = Math.ceil(code.length / 2);
  const chunked = code.slice(0, mid) + '\u00a0\u00a0' + code.slice(mid);

  const finalSubtitle = subtitle || `Enter this code to complete your verification. Valid for the next <strong style="color:#18181b;">${expiryMinutes} minutes</strong>.`;

  const mainBlock = `
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
  `;

  const securityNote = note || "Never share this code with anyone. UrbanEase will never ask for it. If you didn't request this, your account is safe — no action needed.";

  return createUrbanEaseStandardEmail({
    title,
    subtitle: finalSubtitle,
    mainBlock,
    securityNote,
    logoSrc,
  });
}

export function createOtpEmailByType({
  otp,
  expiryMinutes = 5,
  type = "general",
  logoSrc,
}) {
  const copyByType = {
    login: {
      title: "Your sign-in code",
      subtitle: `Enter this code to complete your sign-in. Valid for the next <strong style="color:#18181b;">${expiryMinutes} minutes</strong>.`,
      note: "Never share this code with anyone. UrbanEase will never ask for it. If you didn't request this, your account is safe — no action needed.",
    },
    registration: {
      title: "Verify your email",
      subtitle: `Enter this code to complete your registration. Valid for the next <strong style="color:#18181b;">${expiryMinutes} minutes</strong>.`,
      note: "Never share this code with anyone. UrbanEase will never ask for it. If you didn't request this, no account was created.",
    },
    general: {
      title: "Your verification code",
      subtitle: `Enter this code to complete your verification. Valid for the next <strong style="color:#18181b;">${expiryMinutes} minutes</strong>.`,
      note: "Never share this code with anyone. UrbanEase will never ask for it.",
    },
  };

  const copy = copyByType[type] || copyByType.general;

  return createCommonOtpEmailTemplate({
    otp,
    expiryMinutes,
    title: copy.title,
    subtitle: copy.subtitle,
    note: copy.note,
    logoSrc,
  });
}

export function createLoginOtpEmailTemplate({ otp, expiryMinutes = 5, logoSrc }) {
  return createOtpEmailByType({ otp, expiryMinutes, type: "login", logoSrc });
}

export function createRegistrationOtpEmailTemplate({ otp, expiryMinutes = 10, logoSrc }) {
  return createOtpEmailByType({ otp, expiryMinutes, type: "registration", logoSrc });
}

export function createGeneralOtpEmailTemplate({ otp, expiryMinutes = 5, logoSrc }) {
  return createOtpEmailByType({ otp, expiryMinutes, type: "general", logoSrc });
}

/**
 * Temporary Password Email Template (Resident Registration)
 * Exactly follows the original OTP template layout with zero emojis.
 */
export function createTemporaryPasswordEmailTemplate({
  email,
  password,
  loginUrl = "http://localhost:5173/SignIn",
  username = "",
  role = "Resident",
  logoSrc = "",
}) {
  const greeting = username ? `Hello ${escapeHtml(username)},` : "Hello,";
  const normalizedRole = String(role || "Resident").toLowerCase();

  let roleTitle = "resident";
  let featuresHtml = `
    <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Digital Gate Passes:</strong> Generate 6-digit visitor codes for guests, food deliveries, and cabs.</td></tr>
    <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Issue Desk:</strong> Report plumbing or electrical issues with photos and track repairs live.</td></tr>
    <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Common Spaces:</strong> Book clubhouse, tennis court, and party spaces online.</td></tr>
    <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Maintenance Bills:</strong> Pay society dues securely via Razorpay and get receipts.</td></tr>
  `;

  if (normalizedRole.includes("worker")) {
    roleTitle = "maintenance staff";
    featuresHtml = `
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Duty Task Feed:</strong> Receive assigned plumbing, electrical, and repair work orders.</td></tr>
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Proof of Work:</strong> Upload completion photos directly from your phone to resolve tickets.</td></tr>
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Leave Management:</strong> Apply for leaves and track manager approval status.</td></tr>
    `;
  } else if (normalizedRole.includes("security")) {
    roleTitle = "gate security";
    featuresHtml = `
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Gate Pass Verification:</strong> Validate 6-digit resident visitor codes for instant barrier clearance.</td></tr>
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Visitor Check-In:</strong> Log unannounced visitors, cabs, and delivery executives.</td></tr>
      <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Issues Desk:</strong> Report parking violations or gate incidents directly to management.</td></tr>
    `;
  }

  const subtitle = `${greeting}<br/>Your ${roleTitle} account has been created successfully. Use the temporary credentials below to sign in:`;

  const mainBlock = `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:24px 20px;
      margin-bottom:20px;
    ">
      ${email ? `
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Email Address</div>
      <div style="font-size:15px;font-weight:600;color:#18181b;margin-bottom:16px;">${escapeHtml(email)}</div>
      ` : ""}
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Temporary Password</div>
      <div style="
        font-size:24px;
        font-weight:700;
        letter-spacing:1px;
        color:#18181b;
        font-family:'Courier New',Courier,monospace;
        user-select:all;
        -webkit-user-select:all;
      ">${escapeHtml(password)}</div>
    </div>
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:16px 20px;
      margin-bottom:20px;
      text-align:left;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Portal Features Available to You</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#3f3f46;line-height:1.6;">
        ${featuresHtml}
      </table>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${escapeHtml(loginUrl)}" style="
        display:inline-block;
        padding:12px 28px;
        background:#18181b;
        color:#ffffff;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
        border-radius:6px;
      ">Sign In to UrbanEase</a>
    </div>
  `;

  const securityNote = "For security reasons, please change your password immediately after your first sign in. Never share your password with anyone.";

  return createUrbanEaseStandardEmail({
    title: "Welcome to UrbanEase",
    subtitle,
    mainBlock,
    securityNote,
    logoSrc,
  });
}

/**
 * Application Approved Email Template
 * Exactly follows the original OTP template layout with zero emojis.
 */
export function createApplicationApprovedEmailTemplate({
  adminName = "Urban Ease Administration",
  paymentLink = "#",
  message = "",
  applicantName = "",
  logoSrc = "",
}) {
  const greeting = applicantName ? `Hello ${escapeHtml(applicantName)},` : "Hello,";
  const subtitle = `${greeting}<br/>Your community manager application has been approved by ${escapeHtml(adminName)}.`;

  const mainBlock = `
    ${message ? `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:16px 20px;
      margin-bottom:20px;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Admin Note</div>
      <div style="font-size:14px;line-height:1.6;color:#18181b;">${escapeHtml(message)}</div>
    </div>` : ""}
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:18px 20px;
      margin-bottom:20px;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Next Steps</div>
      <p style="margin:0;font-size:14px;color:#71717a;line-height:1.6;">
        Complete your subscription payment using the link below to activate your account and access your community management dashboard.
      </p>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${escapeHtml(paymentLink)}" style="
        display:inline-block;
        padding:12px 28px;
        background:#18181b;
        color:#ffffff;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
        border-radius:6px;
      ">Complete Payment & Activate Account</a>
    </div>
  `;

  const securityNote = "If you have any questions regarding your application or onboarding, please reach out to our support team.";

  return createUrbanEaseStandardEmail({
    title: "Application Approved",
    subtitle,
    mainBlock,
    securityNote,
    logoSrc,
  });
}

/**
 * Account Activated Email Template
 * Exactly follows the original OTP template layout with zero emojis.
 */
export function createAccountActivatedEmailTemplate({
  email,
  password,
  loginUrl = "#",
  applicantName = "",
  logoSrc = "",
}) {
  const greeting = applicantName ? `Hello ${escapeHtml(applicantName)},` : "Hello,";
  const subtitle = `${greeting}<br/>Your payment has been processed successfully and your UrbanEase account is now active. Use the credentials below to sign in:`;

  const mainBlock = `
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:24px 20px;
      margin-bottom:20px;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Email Address</div>
      <div style="font-size:15px;font-weight:600;color:#18181b;margin-bottom:16px;">${escapeHtml(email)}</div>
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Temporary Password</div>
      <div style="
        font-size:24px;
        font-weight:700;
        letter-spacing:1px;
        color:#18181b;
        font-family:'Courier New',Courier,monospace;
        user-select:all;
        -webkit-user-select:all;
      ">${escapeHtml(password)}</div>
    </div>
    <div style="
      background:#fafafa;
      border:1px solid #e4e4e7;
      border-radius:8px;
      padding:16px 20px;
      margin-bottom:20px;
      text-align:left;
    ">
      <div style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Manager Portal Capabilities</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#3f3f46;line-height:1.6;">
        <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Society Setup:</strong> Configure blocks, floors, and flat inventory in minutes.</td></tr>
        <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Resident Codes:</strong> Generate flat codes (UE-XXXX) to invite residents to register.</td></tr>
        <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Work Order Dispatch:</strong> Assign incoming resident complaints directly to duty workers.</td></tr>
        <tr><td style="padding:3px 0;vertical-align:top;width:14px;color:#18181b;">&bull;</td><td style="padding:3px 0;"><strong>Financial Control:</strong> Issue maintenance invoices and monitor Razorpay dues collections.</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${escapeHtml(loginUrl)}" style="
        display:inline-block;
        padding:12px 28px;
        background:#18181b;
        color:#ffffff;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
        border-radius:6px;
      ">Sign In to Dashboard</a>
    </div>
  `;

  const securityNote = "Please sign in and change your temporary password immediately to secure your account. Never share your password with anyone.";

  return createUrbanEaseStandardEmail({
    title: "Account Activated",
    subtitle,
    mainBlock,
    securityNote,
    logoSrc,
  });
}
