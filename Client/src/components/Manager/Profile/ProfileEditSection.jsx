import React from "react";
import { Briefcase, User } from "lucide-react";

import { ProfileEditPanels } from "../../shared/nonAdmin/ProfileEditPanels";

export const ProfileEditSection = ({ formData, onChange, onSave }) => (
  <ProfileEditPanels
    leftPanel={{
      title: "Personal Information",
      icon: <User size={18} />,
      onChange,
      fields: [
        { label: "Full Name", name: "name", value: formData.name },
        { label: "Email", type: "email", name: "email", value: formData.email },
        { label: "Phone Number", type: "tel", name: "phone", value: formData.phone },
        { label: "Address", name: "address", value: formData.address },
      ],
    }}
    rightPanel={{
      title: "Professional Details",
      icon: <Briefcase size={18} />,
      fields: [
        { label: "Role Title", value: formData.roleTitle, readOnly: true },
        { label: "Community Name", value: formData.communityName, readOnly: true },
        { label: "Work Email", type: "email", value: formData.workEmail, readOnly: true },
      ],
    }}
    onSave={onSave}
  />
);
