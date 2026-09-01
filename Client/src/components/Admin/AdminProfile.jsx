import { useState, useEffect } from "react";
import axios from "axios";
import Header from "./Header";
import { getSystemSettings, updateSystemSettings } from "../../services/adminService";
export default function AdminProfile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    image: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("/default-profile.png");
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [systemSettings, setSystemSettings] = useState({ skip2FA: false });
  const [settingsLoading, setSettingsLoading] = useState(false);
  // ===== Fetch Admin Profile =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/admin/api/profile");
        const json = res.data;
        if (json && json.admin) {
          const { name, email, image } = json.admin;
          setFormData({ name, email });
          setOriginalData({ name, email, image: image || "" });
          if (image) setPreviewUrl(image);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setErrorMsg(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  // ===== Fetch System Settings =====
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettingsLoading(true);
        const res = await getSystemSettings();
        if (res.success) {
          setSystemSettings(res.settings);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const handleToggle2FA = async () => {
    try {
      const newStatus = !systemSettings.skip2FA;
      setSettingsLoading(true);
      const res = await updateSystemSettings({ skip2FA: newStatus });
      if (res.success) {
        setSystemSettings(res.settings);
      } else {
        alert("Failed to update settings");
      }
    } catch (err) {
      console.error("Error toggling 2FA:", err);
      alert("An error occurred");
    } finally {
      setSettingsLoading(false);
    }
  };
  // ===== Input Handlers =====
  const handleProfileChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  // ===== Detect if any change made =====
  const isFormChanged = () => {
    const imageChanged = profileImage !== null;
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      imageChanged
    );
  };
  // ===== Save Profile (API) =====
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      if (profileImage) formDataToSend.append("image", profileImage);
      const res = await axios.post("/admin/api/profile/update", formDataToSend);
      const json = res.data;
      setSuccessMsg("Profile updated successfully!");
      if (json.admin.image) setPreviewUrl(json.admin.image);
      // Reset original data to latest saved version
      setOriginalData({
        name: formData.name,
        email: formData.email,
        image: json.admin.image || originalData.image,
      });
      setProfileImage(null);
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  // ===== Change Password (API) =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");
    setSuccessMsg("");
    if (passwordData.new !== passwordData.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    try {
      const res = await axios.post("/admin/api/profile/change-password", {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
        confirmPassword: passwordData.confirm,
      });
      const json = res.data;
      setSuccessMsg("Password updated successfully!");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err) {
      console.error("Password change error:", err);
      setErrorMsg(err.response?.data?.message || err.message);
    }
  };
  return (
    <div style={{ width: "100%" }}>
      {/* ===== Header ===== */}
      <div style={{ marginBottom: "20px" }}>
        <Header title="Profile Management" />
      </div>
      <div className="row g-3">
        {/* ===== Left: Profile Info ===== */}
        <div className="col-lg-6">
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              height: "100%",
            }}
          >
            <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "16px", fontSize: "15px" }}>
              <i className="bi bi-person-circle me-2 text-primary"></i>
              Profile Information
            </h6>
            <div className="text-center mb-3">
              <label htmlFor="imageUpload" style={{ cursor: "pointer" }}>
                <div
                  className="rounded-circle overflow-hidden mx-auto position-relative"
                  style={{
                    width: "80px",
                    height: "80px",
                    border: "2.5px solid #3b82f6",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.2)",
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <i
                      className="bi bi-person-fill"
                      style={{
                        fontSize: "2.5rem",
                        color: "#94a3b8",
                        lineHeight: "80px",
                      }}
                    ></i>
                  )}
                </div>
              </label>
              <input
                type="file"
                id="imageUpload"
                className="d-none"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>Click to change photo</div>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="mb-2">
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Name</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: "13px", height: "36px", borderRadius: "8px", borderColor: "#e2e8f0" }}
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  style={{ fontSize: "13px", height: "36px", borderRadius: "8px", borderColor: "#e2e8f0" }}
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              {successMsg && (
                <div className="alert alert-success py-1 px-2 small mb-2">{successMsg}</div>
              )}
              {errorMsg && (
                <div className="alert alert-danger py-1 px-2 small mb-2">{errorMsg}</div>
              )}
              <button
                type="submit"
                disabled={loading || !isFormChanged()}
                style={{
                  background: isFormChanged() ? "#0f172a" : "#94a3b8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: isFormChanged() ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                {loading ? "Saving..." : isFormChanged() ? "Save Changes" : "No Changes"}
              </button>
            </form>
          </div>
        </div>
        {/* ===== Right: Change Password ===== */}
        <div className="col-lg-6">
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              height: "100%",
            }}
          >
            <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "16px", fontSize: "15px" }}>
              <i className="bi bi-shield-lock-fill text-primary me-2"></i>
              Change Password
            </h6>
            <form onSubmit={handleChangePassword}>
              <div className="mb-2">
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  style={{ fontSize: "13px", height: "36px", borderRadius: "8px", borderColor: "#e2e8f0" }}
                  name="current"
                  placeholder="Enter current password"
                  value={passwordData.current}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ fontSize: "13px", height: "36px", borderRadius: "8px", borderColor: "#e2e8f0" }}
                  name="new"
                  placeholder="Enter new password"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.confirm ? "is-invalid" : ""}`}
                  style={{ fontSize: "13px", height: "36px", borderRadius: "8px", borderColor: "#e2e8f0" }}
                  name="confirm"
                  placeholder="Confirm new password"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                  required
                />
                {errors.confirm && (
                  <div className="invalid-feedback small">{errors.confirm}</div>
                )}
              </div>
              <button
                type="submit"
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* ===== System Settings Row ===== */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "12px", fontSize: "15px" }}>
              <i className="bi bi-gear-fill me-2 text-primary"></i>
              System Settings
            </h6>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
              <div>
                <h6 style={{ fontWeight: 600, fontSize: "13.5px", margin: "0 0 2px 0" }}>Skip 2FA (OTP) for Non-Admin Users</h6>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  When enabled, Residents, Managers, and Staff will skip the OTP verification step during login.
                  <span className="text-danger fw-semibold ms-2">(Note: OTP remains active for Admins)</span>
                </p>
              </div>
              <div className="form-check form-switch fs-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={systemSettings.skip2FA}
                  onChange={handleToggle2FA}
                  disabled={settingsLoading}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
