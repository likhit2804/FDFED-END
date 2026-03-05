/**
 * @license Proprietary
 * @fileoverview Worker Profile Component
 * @copyright All rights reserved
 */

import React, { useEffect, useState } from "react";

import image from "../../imgs/image.png";

import { toast } from "react-toastify";
import { Loader } from "../Loader";
import { ProfileHeader, PasswordChangeForm, Input } from "../shared";



export const WorkerProfile = () => {
    const [formData, setFormData] = useState({
        name: "Rahul Sharma",
        email: "rahul.sharma@urbanease.com",
        contact: "+1 (555) 123-467",
        address: "San Francisco, CA",
        department: "Plumber",
        status: true,
        image: image,
        shift: "9:00AM to 5:00PM"
    });
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file)
            return;



        setImageFile(file);

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleToggle = () => {
        setFormData((prev) => ({
            ...prev,
            status: !prev.status
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const body = new FormData();
            body.append("name", formData.name || "");
            body.append("email", formData.email || "");
            body.append("contact", formData.contact || "");
            body.append("address", formData.address || "");
            if (imageFile) {
                body.append("image", imageFile);
            }

            const response = await fetch("http://localhost:3000/worker/profile", {
                method: "POST",
                credentials: "include",
                body
            });

            const data = await response.json();

            if (data.success && data.r) {
                const jobRole = data.r.jobRole;
                toast.success(data.message || "Profile updated successfully");
                setFormData((prev) => ({
                    ...prev,
                    name: data.r.name || prev.name,
                    email: data.r.email || prev.email,
                    contact: data.r.contact || prev.contact,
                    address: data.r.address || prev.address,
                    department: Array.isArray(jobRole) ? jobRole.join(", ") : jobRole || prev.department,
                    // Refresh image preview if it was updated
                    image: data.r.image ? `http://localhost:3000/${data.r.image
                        }` : prev.image
                }));
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while updating profile");
        }
    };



    if (isLoading) {
        return (
            <div className="d-flex h-100 justify-content-center align-items-center">
                <Loader />
            </div>
        );
    }

    const workerInitials = formData.name
        ? formData.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : '?';

    const handlePasswordSubmitShared = async ({ cp, np, cnp }) => {
        if (np !== cnp) { toast.error('New password and confirm password do not match'); return; }
        try {
            const response = await fetch('http://localhost:3000/worker/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ cp, np }),
            });
            const data = await response.json();
            if (data.success) { toast.success(data.message || 'Password changed successfully'); }
            else { toast.error(data.message || 'Failed to change password'); }
        } catch (err) { toast.error('Something went wrong while changing password'); }
    };

    return (
        <div className="container worker-profile-container m-0">
            {/* ── Shared ProfileHeader ─────────────────────── */}
            <ProfileHeader
                initials={workerInitials}
                imageSrc={formData.image !== image ? formData.image : ''}
                name={formData.name}
                role={formData.department}
                subtitle={formData.shift ? `Shift: ${formData.shift}` : ''}
                onImageChange={handleImageChange}
                actionLabel={isPassword ? 'Edit Profile' : 'Change Password'}
                onAction={() => setIspassword(prev => !prev)}
            />

            {
                isPassword ? (
                    <div className="mt-3">
                        {/* ── Shared PasswordChangeForm ─────────────── */}
                        <PasswordChangeForm onSubmit={handlePasswordSubmitShared} />
                    </div>

                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="row mt-4">
                            <div className="col-md-6">
                                <div className="card info-card">
                                    <div className="card-body">
                                        <h5 className="mb-4">Profile Information</h5>
                                        <div className="d-flex flex-column gap-2">
                                            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
                                            <Input type="email" label="Email" name="email" value={formData.email} onChange={handleChange} />
                                            <Input label="Phone Number" name="contact" value={formData.contact} onChange={handleChange} />
                                            <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
                                        </div>
                                        <div className="d-flex justify-content-end mt-3">
                                            <button className="btn btn-primary" type="submit"><i className="bi bi-save me-2"></i>Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card info-card mb-3">
                                    <div className="card-body">
                                        <h5 className="mb-4">Work Information</h5>
                                        <div className="d-flex flex-column gap-2">
                                            <Input label="Department" value={formData.department} readOnly />
                                            <Input label="Shift" value={formData.shift} readOnly />
                                            <Input label="Average Rating" value="4.5" readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                )
            } </div>
    );
};
