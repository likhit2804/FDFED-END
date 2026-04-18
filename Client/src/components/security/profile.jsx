import React, { useState, useEffect } from "react";
import { User, Building2 } from "lucide-react";
import { ProfileHeader, PasswordChangeForm, Input } from "../shared";
import { toast } from "react-toastify";
import { ManagerPageShell, ManagerSection } from "../Manager/ui";

export const SecurityProfile = () => {
  const [displayData, setDisplayData] = useState({ name: "", email: "", contact: "", address: "", communityName: "", image: "" });
  const [formData, setFormData] = useState({ name: "", email: "", contact: "", address: "", communityName: "", image: "" });
  const [isPassword, setIsPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/security/profile", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (data.success) {
          const s = data.security;
          const fetched = { name: s.name || "", email: s.email || "", contact: s.contact || "", address: s.address || "", communityName: s.community?.communityName || "", image: s.image || "" };
          setDisplayData(fetched);
          setFormData(fetched);
        }
      } catch (err) { console.error("Profile fetch error:", err); }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/security/profile", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.name, email: formData.email, contact: formData.contact, address: formData.address }) });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }
      toast.success("Profile updated!");
      setDisplayData(formData);
    } catch (error) { console.error(error); toast.error("Error updating profile."); }
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    if (np !== cnp) { toast.error("Passwords do not match."); return; }
    try {
      const res = await fetch("/security/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword: cp, newPassword: np }) });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }
      toast.success("Password updated successfully!");
    } catch (err) { console.error(err); toast.error("Something went wrong while updating password."); }
  };

  const initials = displayData.name ? displayData.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";

  return (
    <ManagerPageShell
      eyebrow="Security Desk"
      title="Keep guard profile and access details updated."
      description="Manage security account information and password settings in one consistent profile workspace."
    >
      <ManagerSection eyebrow="Identity" title="Security profile" description="Review and update personal and community profile data.">
        <div className="ue-profile-page-stack ue-role-page">
          <ProfileHeader
            initials={initials}
            imageSrc={displayData.image || ""}
            name={displayData.name || "Loading..."}
            role={displayData.communityName}
            subtitle={displayData.address}
            actionLabel={isPassword ? "Edit Profile" : "Change Password"}
            onAction={() => setIsPassword(prev => !prev)}
          />

          {isPassword ? (
            <div className="ue-profile-block">
              <PasswordChangeForm onSubmit={handlePasswordSubmit} />
            </div>
          ) : (
            <div className="row g-3 ue-profile-grid">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                  <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2"><User size={20} className="text-primary" /> Personal Information</h6>
                  <div className="d-flex flex-column gap-2">
                    <Input label="Full Name" id="name" value={formData.name} onChange={handleChange} />
                    <Input type="email" label="Email" id="email" value={formData.email} onChange={handleChange} />
                    <Input label="Contact" id="contact" value={formData.contact} onChange={handleChange} />
                    <Input label="Address" id="address" value={formData.address} onChange={handleChange} />
                    <div className="d-flex py-2 justify-content-end">
                      <button className="btn w-50 btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                  <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2"><Building2 size={20} className="text-success" /> Community Details</h6>
                  <div className="d-flex flex-column gap-2">
                    <Input label="Community" id="communityName" value={formData.communityName} readOnly />
                    <Input label="Address" id="address_display" value={formData.address} readOnly />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ManagerSection>
    </ManagerPageShell>
  );
};
