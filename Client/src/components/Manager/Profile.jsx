import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ProfileHeader, PasswordChangeForm } from "../shared";
import { PlanChangeForm } from "./Profile/PlanChangeForm";
import { ProfileEditSection } from "./Profile/ProfileEditSection";

export const ManagerProfile = () => {
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", location: "", address: "",
        department: "Community Manager", roleTitle: "Community Manager",
        communityName: "", workEmail: "",
    });
    const [isPassword, setIspassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState("");

    // Subscription
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [plans, setPlans] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState("standard");
    const [planLoading, setPlanLoading] = useState(false);
    const [planSubmitting, setPlanSubmitting] = useState(false);
    const [planError, setPlanError] = useState("");

    // Community code
    const [communityCode, setCommunityCode] = useState("");
    const [codeLoading, setCodeLoading] = useState(false);

    // ── Data loading ──
    useEffect(() => {
        setLoading(true); setError(null);

        fetch("http://localhost:3000/manager/profile/api", { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" })
            .then((r) => r.json()).then((data) => {
                if (data.success) {
                    setFormData({
                        name: data.manager.name || "", email: data.manager.email || "",
                        phone: data.manager.contact || "", location: data.manager.location || "",
                        address: data.manager.address || "", department: "Community Manager",
                        roleTitle: "Community Manager", communityName: data.community?.name || "",
                        workEmail: data.manager.email || "",
                    });
                    setCommunityCode(data.community.communityCode);
                } else { setError(data.message || "Failed to load profile"); }
            })
            .catch(() => setError("Failed to load profile data"))
            .finally(() => setLoading(false));

        fetch("http://localhost:3000/manager/subscription-status", { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" })
            .then((r) => r.json()).then((sub) => { if (sub.success && sub.community) setSubscriptionInfo(sub.community); })
            .catch(() => { });
    }, []);

    // ── Handlers ──
    const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = () => {
        const fd = new FormData();
        fd.append("name", formData.name); fd.append("email", formData.email);
        fd.append("contact", formData.phone); fd.append("location", formData.location);
        fd.append("address", formData.address);

        fetch("http://localhost:3000/manager/profile", { method: "POST", body: fd, credentials: "include" })
            .then((r) => r.json()).then((data) => {
                if (data.success) { setError(null); alert("Profile updated successfully!"); }
                else { setError(data.message || "Failed to update profile"); }
            }).catch(() => setError("Failed to update profile"));
    };

    const handlePasswordSubmit = async ({ cp, np, cnp }) => {
        setPasswordMessage("");
        if (np !== cnp) { setPasswordMessage("Passwords do not match!"); return; }
        try {
            const res = await fetch("http://localhost:3000/manager/profile/changePassword", {
                method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                body: JSON.stringify({ cp, np, cnp }),
            });
            const data = await res.json();
            if (data.success) {
                setPasswordMessage("Password changed successfully!");
                setTimeout(() => { setIspassword(false); setPasswordMessage(""); }, 1500);
            } else { setPasswordMessage(data.message || "Failed to change password"); }
        } catch { setPasswordMessage("Failed to change password"); }
    };

    const openPlanForm = () => {
        setShowPlanForm(true); setPlanError("");
        if (plans) return;
        setPlanLoading(true);
        fetch("http://localhost:3000/manager/subscription-plans", { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" })
            .then((r) => r.json()).then((data) => {
                if (data.success && data.plans) setPlans(data.plans);
                else setPlanError(data.message || "Failed to load plans");
            }).catch(() => setPlanError("Failed to load plans"))
            .finally(() => setPlanLoading(false));
    };

    const submitPlanChange = (e) => {
        e.preventDefault(); setPlanError("");
        if (!subscriptionInfo?._id) { setPlanError("Community information not available"); return; }
        if (!plans?.[selectedPlan]) { setPlanError("Please select a valid plan"); return; }
        const plan = plans[selectedPlan];
        setPlanSubmitting(true);
        fetch("http://localhost:3000/manager/subscription-payment", {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ communityId: subscriptionInfo._id, subscriptionPlan: selectedPlan, amount: plan.price, paymentMethod: "card", planDuration: plan.duration || "monthly", paymentDate: new Date().toISOString() }),
        }).then((r) => r.json()).then((data) => {
            if (data.success) {
                alert("Subscription plan updated successfully!");
                setSubscriptionInfo((p) => p ? { ...p, subscriptionPlan: selectedPlan, subscriptionStatus: data.subscriptionStatus || p.subscriptionStatus, planEndDate: data.planEndDate || p.planEndDate } : p);
                setShowPlanForm(false);
            } else { setPlanError(data.message || "Failed to update plan"); }
        }).catch(() => setPlanError("Failed to update plan"))
            .finally(() => setPlanSubmitting(false));
    };

    const handleRotateCommunityCode = () => {
        setCodeLoading(true);
        fetch("http://localhost:3000/manager/community/rotate-code", { method: "POST", credentials: "include" })
            .then((r) => r.json()).then((data) => {
                if (data.success) { setCommunityCode(data.communityCode); alert("Community code updated successfully"); }
                else { alert(data.message || "Failed to update code"); }
            }).catch(() => alert("Failed to update community code"))
            .finally(() => setCodeLoading(false));
    };

    const initials = formData.name ? formData.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() : "?";

    return (
        <>
            {loading ? (
                <div className="text-center p-4">Loading profile...</div>
            ) : error && !isPassword ? (
                <div className="text-center text-danger p-4">{error}</div>
            ) : (
                <>
                    <ProfileHeader
                        initials={initials} name={formData.name} role="Community Manager" subtitle={formData.location}
                        onImageChange={(file) => { const r = new FileReader(); r.onload = () => setFormData((p) => ({ ...p, image: r.result })); r.readAsDataURL(file); }}
                        actionLabel={isPassword ? "Edit Profile" : "Change Password"}
                        onAction={() => setIspassword((p) => !p)}
                    />

                    {/* Subscription + Community + Structure cards */}
                    <div>
                        <div className="card border-1 shadow-sm rounded-4 p-3 mt-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 fw-semibold">Subscription</h6>
                                    <p className="mb-1 text-secondary">Plan: <strong>{subscriptionInfo?.planName || subscriptionInfo?.subscriptionPlan || "Not subscribed"}</strong></p>
                                    <p className="mb-1 text-secondary">Status: <strong>{subscriptionInfo?.subscriptionStatus || "pending"}</strong></p>
                                    {subscriptionInfo?.planPrice && <p className="mb-1 text-secondary small">Price: <strong>₹{subscriptionInfo.planPrice}/{subscriptionInfo.planDuration || "monthly"}</strong></p>}
                                    {subscriptionInfo?.planMaxResidents !== undefined && <p className="mb-1 text-secondary small">Max Residents: <strong>{subscriptionInfo.planMaxResidents || "Unlimited"}</strong></p>}
                                    {typeof subscriptionInfo?.totalMembers === "number" && <p className="mb-0 text-secondary small">Current Residents: <strong>{subscriptionInfo.totalMembers}</strong></p>}
                                </div>
                                <button type="button" className="btn btn-outline-primary" onClick={openPlanForm}>Update / Next Plan</button>
                            </div>
                        </div>
                        <div className="card border-1 shadow-sm rounded-4 p-3 mt-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div><h6 className="mb-1 fw-semibold">Community details</h6></div>
                                <p className="mb-1 text-secondary">Community Code: <strong>{communityCode || "—"}</strong></p>
                                <button type="button" className="btn btn-outline-primary" onClick={handleRotateCommunityCode}>Update code</button>
                            </div>
                        </div>
                        <div className="card border-1 shadow-sm rounded-4 p-3 mt-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 fw-semibold">Manage Structure</h6>
                                    <p className="mb-0 text-secondary small">Set up or update blocks and flats for your community</p>
                                </div>
                                <a href="/manager/setup" className="btn btn-outline-primary">Go to Setup</a>
                            </div>
                        </div>
                    </div>

                    {showPlanForm && (
                        <PlanChangeForm
                            plans={plans} planLoading={planLoading} planError={planError}
                            selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
                            planSubmitting={planSubmitting}
                            onSubmit={submitPlanChange} onCancel={() => setShowPlanForm(false)}
                        />
                    )}

                    {isPassword ? (
                        <div className="mt-3">
                            <PasswordChangeForm onSubmit={handlePasswordSubmit} message={passwordMessage} />
                        </div>
                    ) : (
                        <ProfileEditSection formData={formData} onChange={handleChange} onSave={handleSubmit} />
                    )}
                </>
            )}
        </>
    );
};
