import React from "react";
import { User, Briefcase } from "lucide-react";
import { Input } from "../../shared";

/**
 * Profile edit section — personal info + professional details side by side.
 */
export const ProfileEditSection = ({ formData, onChange, onSave }) => (
    <div className="row g-4 mt-3">
        {/* Personal Information */}
        <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <User size={20} className="text-primary" />
                    <h6 className="mb-0 fw-semibold">Personal Information</h6>
                </div>
                <div className="d-flex flex-column gap-2 text-secondary">
                    <Input label="Full Name" name="name" value={formData.name} onChange={onChange} />
                    <Input type="email" label="Email" name="email" value={formData.email} onChange={onChange} />
                    <Input type="tel" label="Phone Number" name="phone" value={formData.phone} onChange={onChange} />
                    <Input label="Address" name="address" value={formData.address} onChange={onChange} />
                    <div className="d-flex py-2 justify-content-end">
                        <button className="btn w-50 btn-primary" type="button" onClick={onSave}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Professional Details */}
        <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <Briefcase size={20} className="text-success" />
                    <h6 className="mb-0 fw-semibold">Professional Details</h6>
                </div>
                <div className="d-flex flex-column gap-2 text-secondary">
                    <Input label="Role Title" value={formData.roleTitle} readOnly />
                    <Input label="Community Name" value={formData.communityName} readOnly />
                    <Input type="email" label="Work Email" value={formData.workEmail} readOnly />
                </div>
            </div>
        </div>
    </div>
);
