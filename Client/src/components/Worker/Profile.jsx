/**
 * @license Proprietary
 * @fileoverview Worker Profile Component
 * @copyright All rights reserved
 */

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader } from "../Loader";
import { ProfileHeader, PasswordChangeForm, Input } from "../shared";

export const WorkerProfile = () => {
    const [formData, setFormData] = useState({
        name: "", email: "", contact: "", address: "",
        department: "", shift: "", image: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPassword, setIsPassword] = useState(false);

    // ── Fetch profile on mount ──────────────────────────────────
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/worker/profile", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success && data.worker) {
                    const w = data.worker;
                    setFormData({
                        name: w.name || "",
                        email: w.email || "",
                        contact: w.contact || "",
                        address: w.address || "",
                        department: Array.isArray(w.jobRole) ? w.jobRole.join(", ") : w.jobRole || "",
                        shift: w.shift || "",
                        image: w.image || "",
                    });
                }
            } catch (err) {
                console.error("Worker profile fetch error:", err);
                toast.error("Failed to load profile");
            } finally {
                setIsLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { id, name, value } = e.target;
        setFormData((prev) => ({ ...prev, [id || name]: value }));
    };

    const handleImageChange = (file) => {
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setFormData((prev) => ({ ...prev, image: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = new FormData();
            body.append("name", formData.name);
            body.append("email", formData.email);
            body.append("contact", formData.contact);
            body.append("address", formData.address);
            if (imageFile) body.append("image", imageFile);

            const res = await fetch("/worker/profile", {
                method: "POST",
                credentials: "include",
                body,
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Profile updated successfully");
                if (data.worker) {
                    const w = data.worker;
                    setFormData((prev) => ({
                        ...prev,
                        name: w.name || prev.name,
                        email: w.email || prev.email,
                        contact: w.contact || prev.contact,
                        address: w.address || prev.address,
                        department: Array.isArray(w.jobRole) ? w.jobRole.join(", ") : w.jobRole || prev.department,
                        image: w.image || prev.image,
                    }));
                }
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while updating profile");
        }
    };

    const handlePasswordSubmit = async ({ cp, np, cnp }) => {
        if (np !== cnp) { toast.error("Passwords do not match"); return; }
        try {
            const res = await fetch("/worker/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword: cp, newPassword: np }),
            });
            const data = await res.json();
            if (data.success) toast.success(data.message || "Password changed successfully");
            else toast.error(data.message || "Failed to change password");
        } catch (err) {
            toast.error("Something went wrong while changing password");
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
        ? formData.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
        : "?";

    return (
        <div className="container worker-profile-container m-0">
            <ProfileHeader
                initials={workerInitials}
                imageSrc={formData.image || ""}
                name={formData.name || "Worker"}
                role={formData.department}
                subtitle={formData.shift ? `Shift: ${formData.shift}` : ""}
                onImageChange={handleImageChange}
                actionLabel={isPassword ? "Edit Profile" : "Change Password"}
                onAction={() => setIsPassword((p) => !p)}
            />

            {isPassword ? (
                <div className="mt-3">
                    <PasswordChangeForm onSubmit={handlePasswordSubmit} />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="row mt-4">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                <h5 className="mb-4">Profile Information</h5>
                                <div className="d-flex flex-column gap-2">
                                    <Input label="Full Name" id="name" value={formData.name} onChange={handleChange} />
                                    <Input type="email" label="Email" id="email" value={formData.email} onChange={handleChange} />
                                    <Input label="Phone Number" id="contact" value={formData.contact} onChange={handleChange} />
                                    <Input label="Address" id="address" value={formData.address} onChange={handleChange} />
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                    <button className="btn btn-primary" type="submit">
                                        <i className="bi bi-save me-2"></i>Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                <h5 className="mb-4">Work Information</h5>
                                <div className="d-flex flex-column gap-2">
                                    <Input label="Department" value={formData.department} readOnly />
                                    <Input label="Shift" value={formData.shift || "—"} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};
