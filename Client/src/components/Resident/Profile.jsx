import React, { useEffect, useState } from "react";
import { Building2, User } from "lucide-react";
import { toast } from "react-toastify";

import { Loader } from "../Loader";
import { PasswordChangeForm, ProfileHeader } from "../shared";
import { ProfileEditPanels } from "../shared/nonAdmin/ProfileEditPanels";
import { buildDisplayName, getInitials } from "../shared/nonAdmin/profileUtils";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";

const mapResidentProfile = (resident = {}) => ({
  firstname: resident.firstname || "",
  lastname: resident.lastname || "",
  email: resident.email || "",
  contact: resident.contact || "",
  uCode: resident.uCode || "",
  communityName: resident.communityName || "",
  image: resident.image || "",
});

export const ResidentProfile = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    uCode: "",
    communityName: "",
    image: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPassword, setIsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/resident/profile", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!data.success || !data.resident) {
          setError(data.message || "Failed to load profile");
          return;
        }
        setFormData(mapResidentProfile(data.resident));
      } catch (requestError) {
        console.error("Resident profile fetch error:", requestError);
        setError("Failed to load profile");
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

  const handleImageChange = (file) => {
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setFormData((previous) => ({ ...previous, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const body = new FormData();
      body.append("firstName", formData.firstname);
      body.append("lastName", formData.lastname);
      body.append("contact", formData.contact);
      body.append("email", formData.email);
      body.append("uCode", formData.uCode);
      if (selectedImage) body.append("image", selectedImage);

      const response = await fetch("/resident/profile", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Update failed");
        return;
      }
      toast.success("Profile updated successfully");
    } catch (requestError) {
      console.error(requestError);
      toast.error("Error updating profile");
    }
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    if (np !== cnp) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      const response = await fetch("/resident/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: cp, newPassword: np }),
      });
      const data = await response.json();
      if (!data.success && !data.ok) {
        toast.error(data.message || "Password update failed");
        return;
      }
      toast.success("Password updated successfully");
    } catch (requestError) {
      console.error(requestError);
      toast.error("Something went wrong while updating password");
    }
  };

  const residentName = buildDisplayName(formData.firstname, formData.lastname) || "Resident";

  if (isLoading) {
    return (
      <ManagerPageShell
        eyebrow="Resident Desk"
        title="Preparing resident profile."
        description="Loading resident identity and household details."
      >
        <div className="manager-ui-empty">
          <Loader />
        </div>
      </ManagerPageShell>
    );
  }

  if (error) {
    return (
      <ManagerPageShell
        eyebrow="Resident Desk"
        title="Resident profile is unavailable."
        description="The profile could not be loaded right now."
      >
        <div className="manager-ui-empty text-danger">{error}</div>
      </ManagerPageShell>
    );
  }

  return (
    <ManagerPageShell
      eyebrow="Resident Desk"
      title="Keep resident profile details current."
      description="Update personal details and account access from one unified profile workspace."
    >
      <ManagerSection
        eyebrow="Identity"
        title="Resident profile"
        description="Review and update personal and unit details."
      >
        <div className="ue-profile-page-stack ue-role-page">
          <ProfileHeader
            initials={getInitials(residentName)}
            imageSrc={formData.image || ""}
            name={residentName}
            role={formData.communityName}
            subtitle={`Unit Code: ${formData.uCode}`}
            onImageChange={handleImageChange}
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
                  {
                    key: "resident-name",
                    group: [
                      { label: "First Name", id: "firstname", value: formData.firstname },
                      { label: "Last Name", id: "lastname", value: formData.lastname },
                    ],
                  },
                  { label: "Email", type: "email", id: "email", value: formData.email },
                  { label: "Contact", id: "contact", value: formData.contact },
                  { label: "Unit Code", id: "uCode", value: formData.uCode, readOnly: true },
                ],
              }}
              rightPanel={{
                title: "Community Details",
                icon: <Building2 size={18} />,
                fields: [
                  { label: "Community Name", value: formData.communityName, readOnly: true },
                  { label: "Unit Code", value: formData.uCode, readOnly: true },
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
