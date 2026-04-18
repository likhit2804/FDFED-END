import React, { useEffect, useState } from "react";
import { Building2, User } from "lucide-react";
import { toast } from "react-toastify";

import { Loader } from "../Loader";
import { PasswordChangeForm, ProfileHeader } from "../shared";
import { ProfileEditPanels } from "../shared/nonAdmin/ProfileEditPanels";
import { getInitials } from "../shared/nonAdmin/profileUtils";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";

const mapSecurityProfile = (security = {}) => ({
  name: security.name || "",
  email: security.email || "",
  contact: security.contact || "",
  address: security.address || "",
  communityName: security.community?.communityName || "",
  image: security.image || "",
});

export const SecurityProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    communityName: "",
    image: "",
  });
  const [isPassword, setIsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/security/profile", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.security) {
          setFormData(mapSecurityProfile(data.security));
        }
      } catch (error) {
        console.error("Security profile fetch error:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { id, name, value } = event.target;
    setFormData((previous) => ({ ...previous, [id || name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/security/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Profile update failed");
        return;
      }
      toast.success("Profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile");
    }
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    if (np !== cnp) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: cp, newPassword: np }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Password update failed");
        return;
      }
      toast.success("Password updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while updating password");
    }
  };

  if (isLoading) {
    return (
      <ManagerPageShell
        eyebrow="Security Desk"
        title="Preparing security profile."
        description="Loading guard identity and account controls."
      >
        <div className="manager-ui-empty">
          <Loader />
        </div>
      </ManagerPageShell>
    );
  }

  return (
    <ManagerPageShell
      eyebrow="Security Desk"
      title="Keep guard profile and access details updated."
      description="Manage security account information and password settings in one consistent profile workspace."
    >
      <ManagerSection
        eyebrow="Identity"
        title="Security profile"
        description="Review and update personal and community profile data."
      >
        <div className="ue-profile-page-stack ue-role-page">
          <ProfileHeader
            initials={getInitials(formData.name)}
            imageSrc={formData.image || ""}
            name={formData.name || "Security team member"}
            role={formData.communityName}
            subtitle={formData.address}
            actionLabel={isPassword ? "Edit Profile" : "Change Password"}
            onAction={() => setIsPassword((previous) => !previous)}
          />

          {isPassword ? (
            <div className="ue-profile-block">
              <PasswordChangeForm onSubmit={handlePasswordSubmit} />
            </div>
          ) : (
            <ProfileEditPanels
              leftPanel={{
                title: "Personal Information",
                icon: <User size={18} />,
                onChange: handleChange,
                fields: [
                  { label: "Full Name", id: "name", value: formData.name },
                  { label: "Email", type: "email", id: "email", value: formData.email },
                  { label: "Contact", id: "contact", value: formData.contact },
                  { label: "Address", id: "address", value: formData.address },
                ],
              }}
              rightPanel={{
                title: "Community Details",
                icon: <Building2 size={18} />,
                fields: [
                  { label: "Community", value: formData.communityName, readOnly: true },
                  { label: "Address", value: formData.address, readOnly: true },
                ],
              }}
              onSave={handleSaveProfile}
            />
          )}
        </div>
      </ManagerSection>
    </ManagerPageShell>
  );
};
