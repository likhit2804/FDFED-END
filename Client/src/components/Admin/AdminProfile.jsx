import React, { useState, useEffect } from "react";
import Header from "./Header";

export default function AdminProfile() {
  const [formData, setFormData] = useState({
    name: "Admin User",
    email: "admin@example.com",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Prefill static data
  useEffect(() => {
    setPreviewUrl("/default-profile.png"); // placeholder image path
  }, []);

  // --- Handle Inputs ---
  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

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

  // --- Static Handlers (no backend) ---
  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert(`Profile Updated!\nName: ${formData.name}\nEmail: ${formData.email}`);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setErrors({});
    if (passwordData.new !== passwordData.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    alert("Password updated successfully!");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  return (
    <>
      {/* Header */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Profile Management" />
      </div>

      <div className="container-fluid px-4 pb-5">
        <div className="row g-4">
          {/* Left Column - Profile Info */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-person-circle me-2 text-danger"></i>Profile
                Information
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
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2 mt-3"
                >
                  <i className="bi bi-save me-2"></i>Save Changes
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Change Password */}
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
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className={`form-control rounded-3 ${
                      errors.confirm ? "is-invalid" : ""
                    }`}
                    name="confirm"
                    placeholder="Confirm new password"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                  />
                  {errors.confirm && (
                    <div className="invalid-feedback">{errors.confirm}</div>
                  )}
                </div>

                <div className="p-3 border rounded-4 bg-light mb-3">
                  <h6 className="fw-semibold mb-2">
                    <i className="bi bi-shield-check me-2 text-success"></i>
                    Password Requirements
                  </h6>
                  <ul className="mb-0 small text-muted">
                    <li>Minimum 8 characters long</li>
                    <li>At least one uppercase and one lowercase letter</li>
                    <li>At least one number or special character</li>
                    <li>Not similar to your personal information</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2"
                >
                  <i className="bi bi-key-fill me-2"></i>Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
