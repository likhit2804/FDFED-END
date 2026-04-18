import React, { useState, useEffect } from "react";
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
    <>
      {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Profile Management" />
      </div>

      <div className="container-fluid px-4 pb-5">
        <div className="row g-4">
          {/* ===== Left: Profile Info ===== */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-person-circle me-2 text-danger"></i>
                Profile Information
              </h5>

              <div className="text-center mb-4">
                <label htmlFor="imageUpload" style={{ cursor: "pointer" }}>
                  <div
                    className="rounded-circle overflow-hidden mx-auto position-relative"
                    style={{
                      width: "120px",
                      height: "120px",
                      border: "3px solid #dc2626",
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
                          fontSize: "4rem",
                          color: "#ccc",
                          lineHeight: "120px",
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
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {successMsg && (
                  <div className="alert alert-success py-2">{successMsg}</div>
                )}
                {errorMsg && (
                  <div className="alert alert-danger py-2">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isFormChanged()}
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2 mt-3"
                >
                  {loading ? (
                    <span>
                      <i className="bi bi-hourglass-split me-2"></i>Saving...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      {isFormChanged() ? "Save Changes" : "No Changes"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ===== Right: Change Password ===== */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-shield-lock-fill text-danger me-2"></i>
                Change Password
              </h5>

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="current"
                    placeholder="Enter current password"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="new"
                    placeholder="Enter new password"
                    value={passwordData.new}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className={`form-control rounded-3 ${errors.confirm ? "is-invalid" : ""
                      }`}
                    name="confirm"
                    placeholder="Confirm new password"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                    required
                  />
                  {errors.confirm && (
                    <div className="invalid-feedback">{errors.confirm}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <i className="bi bi-hourglass-split me-2"></i>Updating...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-key-fill me-2"></i>Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ===== System Settings Row ===== */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-gear-fill me-2 text-danger"></i>
                System Settings
              </h5>

              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                <div>
                  <h6 className="fw-bold mb-1">Skip 2FA (OTP) for Non-Admin Users</h6>
                  <p className="text-muted small mb-0">
                    When enabled, Residents, Managers, and Staff will skip the OTP verification step during login.
                    <br />
                    <span className="text-danger fw-bold">Note: OTP remains mandatory for Admins.</span>
                  </p>
                </div>
                <div className="form-check form-switch fs-4">
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
    </>
  );
}
