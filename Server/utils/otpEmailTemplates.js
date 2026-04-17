/**
 * Reusable OTP email templates for Urban Ease.
 * One common HTML shell + context-specific copy (login, registration, etc.).
 */

const OTP_CONTENT_MAP = {
  login: {
    title: "Your login OTP",
    subtitle: "Use this one-time code to complete your sign in.",
    note: "If you did not try to sign in, you can ignore this email safely.",
  },
  registration: {
    title: "Verify your email",
    subtitle: "Use this OTP to complete your account registration.",
    note: "If this wasn't you, no account changes were made.",
  },
  general: {
    title: "Your OTP code",
    subtitle: "Use this one-time code to continue your secure action.",
    note: "For security, never share this OTP with anyone.",
  },
};

function getOtpCopy(type = "general") {
  return OTP_CONTENT_MAP[type] || OTP_CONTENT_MAP.general;
}

function normalizeOtp(otp) {
  const code = String(otp || "").replace(/\s+/g, "");
  return code;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function createCommonOtpEmailTemplate({
  otp,
  expiryMinutes = 5,
  title,
  subtitle,
  note,
  username,
  userType,
  purpose,
  requestTime = new Date(),
  logoSrc = "",
}) {
  const displayCode = normalizeOtp(otp);
  const brandHtml = logoSrc
    ? `<img src="${logoSrc}" alt="Urban Ease" style="display:block;height:30px;width:auto;max-width:220px;" />`
    : `<div style="font-size:12px;letter-spacing:1px;font-weight:700;text-transform:uppercase;opacity:.95;">Urban Ease</div>`;
  const details = [
    { label: "Username", value: username || "Not provided" },
    { label: "User Type", value: userType || "Not provided" },
    { label: "Purpose", value: purpose || "Authentication" },
    { label: "Requested At", value: formatTimestamp(requestTime) },
    { label: "Expires In", value: `${expiryMinutes} minutes` },
  ];
  const detailRowsHtml = details
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:8px 0;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;">${escapeHtml(
          label
        )}</td>
        <td style="padding:8px 0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">${escapeHtml(
          value
        )}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 12px;background:#f4f6fb;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#ffffff;">
                ${brandHtml}
                <div style="margin-top:6px;font-size:22px;line-height:1.3;font-weight:700;">${title}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#475569;">${subtitle}</p>
                <div style="margin:16px 0 10px;padding:20px 14px;border:1px dashed #c4b5fd;border-radius:12px;background:#faf5ff;text-align:center;">
                  <div style="font-size:34px;line-height:1;font-weight:800;letter-spacing:2px;color:#4c1d95;font-family:Consolas,Monaco,monospace;user-select:all;-webkit-user-select:all;">${displayCode}</div>
                  <div style="margin-top:10px;font-size:12px;color:#6b7280;">Valid for ${expiryMinutes} minutes</div>
                </div>
                <div style="margin:14px 0 8px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    ${detailRowsHtml}
                  </table>
                </div>
                <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  This is an automated security email from Urban Ease. Please do not reply.
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

export function createOtpEmailByType({
  otp,
  expiryMinutes = 5,
  type = "general",
  username,
  userType,
  logoSrc,
}) {
  const copy = getOtpCopy(type);
  const defaultPurposeByType = {
    login: "Login Verification",
    registration: "Registration Verification",
    general: "Secure Verification",
  };
  return createCommonOtpEmailTemplate({
    otp,
    expiryMinutes,
    title: copy.title,
    subtitle: copy.subtitle,
    note: copy.note,
    username,
    userType,
    logoSrc,
    purpose: defaultPurposeByType[type] || defaultPurposeByType.general,
  });
}

export function createLoginOtpEmailTemplate({ otp, expiryMinutes = 5, username, userType }) {
  return createOtpEmailByType({
    otp,
    expiryMinutes,
    type: "login",
    username,
    userType,
  });
}

export function createRegistrationOtpEmailTemplate({
  otp,
  expiryMinutes = 5,
  username,
  userType,
}) {
  return createOtpEmailByType({
    otp,
    expiryMinutes,
    type: "registration",
    username,
    userType,
  });
}
