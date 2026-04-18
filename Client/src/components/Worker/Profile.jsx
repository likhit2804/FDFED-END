import React, { useEffect, useState } from "react";
import { Briefcase, User } from "lucide-react";
import { toast } from "react-toastify";

import { Loader } from "../Loader";
import { PasswordChangeForm, ProfileHeader } from "../shared";
import { ProfileEditPanels } from "../shared/nonAdmin/ProfileEditPanels";
import { getInitials } from "../shared/nonAdmin/profileUtils";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";

const mapWorkerProfile = (worker = {}) => ({
  name: worker.name || "",
  email: worker.email || "",
  contact: worker.contact || "",
  address: worker.address || "",
  department: Array.isArray(worker.jobRole) ? worker.jobRole.join(", ") : worker.jobRole || "",
  shift: worker.shift || "",
  image: worker.image || "",
});

export const WorkerProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    department: "",
    shift: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPassword, setIsPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/worker/profile", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.worker) {
          setFormData(mapWorkerProfile(data.worker));
        }
      } catch (error) {
        console.error("Worker profile fetch error:", error);
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

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setFormData((previous) => ({ ...previous, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("email", formData.email);
      body.append("contact", formData.contact);
      body.append("address", formData.address);
      if (imageFile) body.append("image", imageFile);

      const response = await fetch("/worker/profile", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to update profile");
        return;
      }

      toast.success(data.message || "Profile updated successfully");
      if (data.worker) {
        setFormData((previous) => ({ ...previous, ...mapWorkerProfile(data.worker) }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while updating profile");
    }
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    if (np !== cnp) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/worker/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: cp, newPassword: np }),
      });
      const data = await response.json();
      if (data.success) toast.success(data.message || "Password changed successfully");
      else toast.error(data.message || "Failed to change password");
    } catch (error) {
      toast.error("Something went wrong while changing password");
    }
  };

  if (isLoading) {
    return (
      <ManagerPageShell
        eyebrow="Worker Desk"
        title="Preparing worker profile."
        description="Loading worker identity, role assignment, and account settings."
      >
        <div className="manager-ui-empty">
          <Loader />
        </div>
      </ManagerPageShell>
    );
  }

  return (
    <ManagerPageShell
      eyebrow="Worker Desk"
      title="Manage worker profile details and account access."
      description="Keep personal details, shift assignment, and password settings updated in one place."
    >
      <ManagerSection
        eyebrow="Identity"
        title="Worker profile"
        description="Review profile details and work assignment information."
      >
        <div className="ue-profile-page-stack ue-role-page">
          <ProfileHeader
            initials={getInitials(formData.name)}
            imageSrc={formData.image || ""}
            name={formData.name || "Worker"}
            role={formData.department}
            subtitle={formData.shift ? `Shift: ${formData.shift}` : ""}
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
                title: "Profile Information",
                icon: <User size={18} />,
                onChange: handleChange,
                fields: [
                  { label: "Full Name", id: "name", value: formData.name },
                  { label: "Email", type: "email", id: "email", value: formData.email },
                  { label: "Phone Number", id: "contact", value: formData.contact },
                  { label: "Address", id: "address", value: formData.address },
                ],
              }}
              rightPanel={{
                title: "Work Information",
                icon: <Briefcase size={18} />,
                fields: [
                  { label: "Department", value: formData.department, readOnly: true },
                  { label: "Shift", value: formData.shift || "-", readOnly: true },
                ],
              }}
              onSave={handleSubmit}
            />
          )}
        </div>
      </ManagerSection>
    </ManagerPageShell>
  );
};
