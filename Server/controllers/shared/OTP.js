/**
 * @deprecated — OTP logic has been consolidated into `utils/otp.js`.
 *
 * This file is kept ONLY to avoid breaking imports that haven't been updated yet.
 * All functionality is re-exported from the canonical location.
 *
 * TODO: Update every import of this file to import directly from `../../utils/otp.js`
 *       and then delete this file.
 */
export {
  sendOtp as OTP,
  verify,
  sendPassword,
  generateSecurePassword,
  sendLoginOtp,
  verifyOtp,
  resendOtp,
  sendTemporaryPassword,
} from "../../utils/otp.js";
