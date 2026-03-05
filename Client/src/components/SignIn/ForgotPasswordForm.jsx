import React from "react";

const ROLE_OPTIONS = [
    { value: "Resident", label: "Resident" },
    { value: "Security", label: "Security" },
    { value: "Worker", label: "Worker" },
    { value: "communityManager", label: "Community Manager" },
];

/**
 * Forgot password modal overlay.
 */
export const ForgotPasswordForm = ({ email, setEmail, userType, setUserType, isSending, onSubmit, onCancel }) => (
    <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}
        onClick={onCancel}
    >
        <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", maxWidth: "450px", width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "8px", fontSize: "24px", color: "#333" }}>Forgot Password?</h2>
            <p style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}>Enter your email and role, and we'll send you a new password.</p>
            <form onSubmit={onSubmit}>
                <input type="email" className="input" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: "12px" }} />
                <select className="input" value={userType} onChange={(e) => setUserType(e.target.value)} style={{ marginBottom: "20px" }}>
                    <option value="" disabled>Select your role</option>
                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: "12px", border: "1px solid #ccc", background: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>Cancel</button>
                    <button type="submit" disabled={isSending} className="continue-btn" style={{ flex: 1, margin: 0 }}>{isSending ? "Sending..." : "Send Reset Email"}</button>
                </div>
            </form>
        </div>
    </div>
);
