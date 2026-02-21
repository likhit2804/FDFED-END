import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../../assets/css/SignIn.css';
import logo from '../../imgs/Logo.png';

export const ResidentRegister = () => {
  const navigate = useNavigate();

  // Step 1: code entry / Step 2: personal details
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [code, setCode] = useState("");

  // Flat preview returned from validate-code
  const [flatInfo, setFlatInfo] = useState(null);

  // Step 2 personal fields
  const [form, setForm] = useState({
    residentFirstname: "",
    residentLastname: "",
    contact: "",
    email: "",
  });

  // ---- Step 1: validate the registration code ----
  const handleValidateCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter your registration code");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_URL || "http://localhost:3000"}/resident-register/validate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.message || "Invalid code");
      setFlatInfo(data.data);
      setStep(2);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2: submit personal details ----
  const handleComplete = async (e) => {
    e.preventDefault();
    const { residentFirstname, residentLastname, email } = form;
    if (!residentFirstname || !residentLastname || !email)
      return toast.error("First name, last name and email are required");

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_URL || "http://localhost:3000"}/resident-register/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, registrationCode: flatInfo.registrationCode }),
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.message || "Registration failed");
      toast.success("Registration complete! Check your email for your temporary password.");
      navigate("/SignIn");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className='SignInCon'>
      <div className="signin-container">
        {/* ---- LEFT PANEL (Brand) ---- */}
        <div className="left-panel">
          <div className="logo">
            <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
          </div>
          <p className="tagline">
            Welcome to your new home! Register with the code provided by your community manager to get started.
          </p>
        </div>

        <div className="div1"></div>

        {/* ---- RIGHT PANEL (Form) ---- */}
        <div className="right-panel">

          {/* ---- STEP 1: Enter Code ---- */}
          {step === 1 && (
            <>
              <h2>Resident Registration</h2>
              <p className="subtitle">
                Enter the registration code from your welcome letter or community manager.
              </p>
              <div className="divider">Code Verification</div>
              <form onSubmit={handleValidateCode}>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. UE-3a7f9c12"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{ textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600 }}
                />
                <button type="submit" className="continue-btn" disabled={loading}>
                  {loading ? "Checking…" : "Verify Code →"}
                </button>
              </form>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <span
                  className="login-link"
                  style={{ cursor: "pointer", fontSize: "0.9em", color: "#2c4b7c", fontWeight: 500 }}
                  onClick={() => navigate("/SignIn")}
                >
                  Already have an account? Sign in
                </span>
              </div>
            </>
          )}

          {/* ---- STEP 2: Fill Personal Details ---- */}
          {step === 2 && flatInfo && (
            <>
              <h2>Complete Registration</h2>
              <p className="subtitle">Fill in your details to finish setting up your account.</p>

              {/* Flat preview card */}
              <div style={{
                background: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "10px",
                padding: "14px 20px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                display: "flex",
                gap: "20px",
                flexWrap: "wrap"
              }}>
                <div><strong>Community:</strong> {flatInfo.communityName}</div>
                <div><strong>Block:</strong> {flatInfo.block}</div>
                <div><strong>Flat:</strong> {flatInfo.flatNumber}</div>
                <div><strong>Floor:</strong> {flatInfo.floor}</div>
              </div>

              <div className="divider">Personal Details</div>

              <form onSubmit={handleComplete}>
                <div style={{ display: "flex", gap: "15px", marginBottom: "0" }}>
                  <input
                    name="residentFirstname"
                    className="input"
                    value={form.residentFirstname}
                    onChange={handleChange}
                    placeholder="First Name *"
                    style={{ flex: 1 }}
                  />
                  <input
                    name="residentLastname"
                    className="input"
                    value={form.residentLastname}
                    onChange={handleChange}
                    placeholder="Last Name *"
                    style={{ flex: 1 }}
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address *"
                />
                <input
                  name="contact"
                  className="input"
                  value={form.contact}
                  onChange={handleChange}
                  placeholder="Phone Number (optional)"
                />
                <button type="submit" className="continue-btn" disabled={loading}>
                  {loading ? "Registering…" : "Complete Registration"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span
                  className="login-link"
                  style={{ cursor: "pointer", fontSize: "0.9em", color: "#2c4b7c", fontWeight: 500 }}
                  onClick={() => { setStep(1); setFlatInfo(null); }}
                >
                  ← Use a different code
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
