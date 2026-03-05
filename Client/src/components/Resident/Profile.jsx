import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Building2, User } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ProfileHeader, PasswordChangeForm, Input } from "../shared";


export const ResidentProfile = () => {
  const [displayData, setDisplayData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    uCode: "",
    communityName: "",
    image: "",
  });

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    uCode: "",
    communityName: "",
    image: "",
  });

  const [isPassword, setIspassword] = useState(false);


  const [selectedImage, setSelectedImage] = useState(null);

  // ------------------------------------------------
  // Fetch Profile
  // ------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:3000/resident/profile", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          const fetched = {
            firstname: data.resident.firstname || "",
            lastname: data.resident.lastname || "",
            email: data.resident.email || "",
            contact: data.resident.contact || "",
            uCode: data.resident.uCode || "",
            communityName: data.resident.communityName || "",
            image: data.resident.image || "",
          };

          setDisplayData(fetched);
          setFormData(fetched);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    }

    loadProfile();
  }, []);

  // ------------------------------------------------
  // Handle Updates
  // ------------------------------------------------
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };


  const handleSaveProfile = async () => {
    try {
      const form = new FormData();

      form.append("firstName", formData.firstname);
      form.append("lastName", formData.lastname);
      form.append("contact", formData.contact);
      form.append("email", formData.email);
      form.append("uCode", formData.uCode);

      if (selectedImage) {
        form.append("image", selectedImage);
      }

      // only if image upload exists later
      // form.append("image", selectedFile);

      const res = await fetch("http://localhost:3000/resident/profile", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Update failed");
        return;
      }

      setDisplayData(formData);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };



  const initials =
    displayData.firstname && displayData.lastname
      ? `${displayData.firstname[0]}${displayData.lastname[0]}`.toUpperCase()
      : '?';

  const handlePasswordSubmitShared = async ({ cp, np, cnp }) => {
    if (np !== cnp) { alert('New password and confirm password do not match.'); return; }
    try {
      const res = await fetch('http://localhost:3000/resident/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: cp, newPassword: np }),
      });
      const data = await res.json();
      if (!data.success && !data.ok) { alert(data.message || 'Password update failed.'); return; }
      alert('Password updated successfully!');
    } catch (err) { alert('Something went wrong while updating password.'); }
  };

  return (
    <>
      {/* ── Shared ProfileHeader ────────────────────── */}
      <ProfileHeader
        initials={initials}
        imageSrc={displayData.image || ''}
        name={`${displayData.firstname || ''} ${displayData.lastname || ''}`.trim() || 'Loading...'}
        role={formData.communityName}
        subtitle={`Unit Code: ${formData.uCode}`}
        onImageChange={(file) => setSelectedImage(file)}
        actionLabel={isPassword ? 'Edit Profile' : 'Change Password'}
        onAction={() => setIspassword((p) => !p)}
      />

      {/* PASSWORD MODE */}
      {isPassword ? (
        <div className="mt-3">
          {/* ── Shared PasswordChangeForm ─────────────── */}
          <PasswordChangeForm onSubmit={handlePasswordSubmitShared} />
        </div>
      ) : (
        // PROFILE MODE
        <div className="row g-4 mt-3">
          {/* LEFT - Personal Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <User size={20} className="text-primary" />
                Personal Information
              </h6>

              <div className="d-flex flex-column gap-2">
                <div>
                  <small className="fw-semibold text-dark mb-1 d-block">Full Name</small>
                  <div className="d-flex gap-2">
                    <Input id="firstname" placeholder="First Name" value={formData.firstname} onChange={handleChange} />
                    <Input id="lastname" placeholder="Last Name" value={formData.lastname} onChange={handleChange} />
                  </div>
                </div>
                <Input type="email" label="Email" id="email" value={formData.email} onChange={handleChange} />
                <Input label="Contact" id="contact" value={formData.contact} onChange={handleChange} />
                <Input label="Unit Code" id="uCode" value={formData.uCode} readOnly />
                <div className="d-flex py-2 justify-content-end">
                  <button className="btn w-50 btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT - Community Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <Building2 size={20} className="text-success" />
                Community Details
              </h6>

              <div className="d-flex flex-column gap-2">
                <Input label="Community Name" id="communityName" value={formData.communityName} readOnly />
                <Input label="Unit Code" id="uCode_ro" value={formData.uCode} readOnly />
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
