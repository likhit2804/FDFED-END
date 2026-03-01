import React, { useState } from "react";
import { adminLogin, adminVerifyOtp, adminResendOtp } from "../../../features/admin/services/adminService";
import { useAdminAuth } from "../../../features/admin/context/AdminAuthContext";

const AdminLogin = () => {
  const { login } = useAdminAuth() || {};
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState(null);
  const [resending, setResending] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Step 1: Submit email + password
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Please enter your password";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const data = await adminLogin(formData.email, formData.password);

    if (data.requiresOtp) {
      // Credentials verified, move to OTP step
      setTempToken(data.tempToken);
      setOtpStep(true);
      setErrors({});
    } else if (data.success) {
      // Direct login (no 2FA)
      if (login) {
        login({ email: formData.email });
      } else {
        localStorage.setItem("adminSession", JSON.stringify({ email: formData.email }));
      }
      window.location.href = data.redirect || "/admin/dashboard";
    } else {
      setErrors({ password: data.message || "Invalid credentials" });
    }

    setLoading(false);
  };

  // Step 2: Submit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 4) {
      setErrors({ otp: "Please enter the OTP sent to your email" });
      return;
    }

    setErrors({});
    setLoading(true);

    const data = await adminVerifyOtp(otp, tempToken);

    if (data.token || data.user) {
      // OTP verified, login complete
      if (login) {
        login({ email: formData.email, ...data.user });
      } else {
        localStorage.setItem("adminSession", JSON.stringify({ email: formData.email }));
      }
      window.location.href = "/admin/dashboard";
    } else {
      setErrors({ otp: data.message || "Invalid OTP" });
    }

    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    setErrors({});
    try {
      await adminResendOtp(tempToken);
      setErrors({ otp: "New OTP sent to your email" });
    } catch {
      setErrors({ otp: "Failed to resend OTP" });
    }
    setResending(false);
  };

  // OTP Step UI
  if (otpStep) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <form
          onSubmit={handleOtpSubmit}
          className="p-4 bg-white rounded-4 shadow"
          style={{ width: "320px" }}
        >
          <h4 className="text-center mb-2 fw-bold text-dark">Verify OTP</h4>
          <p className="text-center text-muted mb-4" style={{ fontSize: "13px" }}>
            Enter the OTP sent to <strong>{formData.email}</strong>
          </p>

          <div className="mb-3">
            <input
              type="text"
              className="form-control text-center"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              autoFocus
              style={{ fontSize: "18px", letterSpacing: "4px" }}
            />
            {errors.otp && (
              <div className={errors.otp.includes("sent") ? "text-success mt-2" : "text-danger mt-2"} style={{ fontSize: "13px" }}>
                {errors.otp}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-dark w-100 mt-2" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </button>

          <button
            type="button"
            className="btn btn-link w-100 mt-2 text-secondary"
            onClick={handleResendOtp}
            disabled={resending}
            style={{ fontSize: "13px" }}
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>

          <button
            type="button"
            className="btn btn-link w-100 text-secondary"
            onClick={() => { setOtpStep(false); setOtp(""); setErrors({}); }}
            style={{ fontSize: "13px" }}
          >
            ← Back to login
          </button>
        </form>
      </div>
    );
  }

  // Login Step UI
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white rounded-4 shadow"
        style={{ width: "320px" }}
      >
        <h4 className="text-center mb-4 fw-bold text-dark">Admin Login</h4>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
          />
          {errors.email && <div className="text-danger">{errors.email}</div>}
        </div>

        <div className="mb-3 position-relative">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          <i
            className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"
              } position-absolute end-0 top-50 me-3 text-secondary`}
            style={{ cursor: "pointer" }}
            onClick={() => setShowPassword(!showPassword)}
          ></i>
          {errors.password && <div className="text-danger">{errors.password}</div>}
        </div>

        <button type="submit" className="btn btn-dark w-100 mt-3" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
