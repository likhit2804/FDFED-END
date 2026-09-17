import { useEffect, useState } from "react";
import axios from "axios";
import { Building2, User } from "lucide-react";
import { toast } from "react-toastify";
import { Loader } from "../Loader";
import { PasswordChangeForm, ProfileHeader } from "../shared";
import { ProfileEditPanels } from "../shared/nonAdmin/ProfileEditPanels";
import { buildDisplayName, getInitials } from "../shared/nonAdmin/profileUtils";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";

const mapResidentProfile = (resident = {}) => ({
  firstname: resident.firstname || resident.residentFirstname || "",
  lastname: resident.lastname || resident.residentLastname || "",
  email: resident.email || "",
  contact: resident.contact || "",
  uCode: resident.uCode || "",
  communityName: resident.communityName || resident.community?.name || "",
  image: resident.image || "",
});

export const ResidentProfile = () => {
  const cachedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const [formData, setFormData] = useState({
    firstname: cachedUser?.firstname || cachedUser?.residentFirstname || cachedUser?.name?.split(" ")[0] || "",
    lastname: cachedUser?.lastname || cachedUser?.residentLastname || cachedUser?.name?.split(" ").slice(1).join(" ") || "",
    email: cachedUser?.email || "",
    contact: cachedUser?.contact || "",
    uCode: cachedUser?.uCode || "",
    communityName: cachedUser?.communityName || "",
    image: cachedUser?.image || "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPassword, setIsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(!cachedUser?.email);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      let response;
      try {
        response = await axios.get("/resident/profile/api");
      } catch {
        response = await axios.get("/resident/profile");
      }
      const data = response.data;
      if (!data?.success || !data?.resident) {
        if (cachedUser?.email) {
          setFormData(mapResidentProfile(cachedUser));
        } else {
          setError(data?.message || "Failed to load profile");
        }
        return;
      }
      setError("");
      setFormData(mapResidentProfile(data.resident));
    } catch (requestError) {
      console.error("Resident profile fetch error:", requestError);
      if (cachedUser?.email) {
        setFormData(mapResidentProfile(cachedUser));
      } else {
        setError(requestError.response?.data?.message || "Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

      const response = await axios.post("/resident/profile", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      if (!data.success) {
        toast.error(data.message || "Update failed");
        return;
      }
      toast.success("Profile updated successfully");
    } catch (requestError) {
      console.error(requestError);
      toast.error(requestError.response?.data?.message || "Error updating profile");
    }
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    if (np !== cnp) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      const response = await axios.post("/resident/change-password", {
        currentPassword: cp,
        newPassword: np,
      });
      const data = response.data;
      if (!data.success && !data.ok) {
        toast.error(data.message || "Password update failed");
        return;
      }
      toast.success("Password updated successfully");
      setIsPassword(false);
    } catch (requestError) {
      console.error(requestError);
      toast.error(requestError.response?.data?.message || "Something went wrong while updating password");
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
  if (error && !formData.email) {
    return (
      <ManagerPageShell
        eyebrow="Resident Desk"
        title="Resident profile is unavailable."
        description="The profile could not be loaded right now."
      >
        <div className="manager-ui-empty text-danger">
          <p className="mb-2">{error}</p>
          <button
            type="button"
            className="manager-ui-button manager-ui-button--primary"
            onClick={() => {
              setIsLoading(true);
              setError("");
              loadProfile();
            }}
          >
            Retry
          </button>
        </div>
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
