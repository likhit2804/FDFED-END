import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../imgs/URBAN_EASE.png";
import "../assets/css/LandingPage.css";
import "../assets/css/RegistrationGuide.css";
import { Key } from "lucide-react";
import { withApiBase } from "../utils/apiBaseUrl";

export const RegistrationGuide = () => {
  const [activeRole, setActiveRole] = useState("resident");

  const guideData = {
    resident: {
      tagline: "Resident Self-Registration via Flat Code",
      description: "Residents register directly using their unique flat registration code provided by the society management.",
      steps: [
        {
          num: 1,
          title: "Get Your Flat Code",
          desc: "Obtain your unique 6-character Flat Registration Code (for example: UE-A402) from your Community Manager or handover letter.",
          badge: "Example Code: UE-A402",
        },
        {
          num: 2,
          title: "Enter Your Details",
          desc: "Open the Resident Registration page. Enter your flat registration code, full name, phone number, and personal email address.",
          badge: "Resident Registration Portal",
          linkText: "Register Your Flat",
          linkTo: "/residentRegister",
        },
        {
          num: 3,
          title: "Verify Email OTP",
          desc: "Check your inbox for a 6-digit verification code. Enter the code to confirm your email and link your account to your home unit.",
          badge: "6-Digit Security Code",
        },
        {
          num: 4,
          title: "Receive Password & Login",
          desc: "UrbanEase sends your temporary password to your email. Navigate to Sign In, enter your credentials, and start exploring your portal.",
          badge: "Temporary Password",
          linkText: "Sign In to Portal",
          linkTo: "/SignIn",
        },
      ],
      features: [
        { title: "Digital Visitor Passes", desc: "Generate 6-digit gate passes for guests, food deliveries, and cabs with instant sharing." },
        { title: "Issue Desk with Photos", desc: "Report electrical, plumbing, or common area issues and track worker progress in real time." },
        { title: "Amenity Bookings", desc: "Reserve the tennis court, swimming pool, or clubhouse hall with real-time slot conflict prevention." },
        { title: "Maintenance Payments", desc: "Pay monthly society maintenance bills directly online through Razorpay and download instant PDF receipts." },
      ],
    },

    manager: {
      tagline: "Community Society Onboarding & Setup",
      description: "Community managers apply to register their residential society, configure blocks and flats, and manage operations.",
      steps: [
        {
          num: 1,
          title: "Submit Society Application",
          desc: "Fill out the Community Application Form with your society name, address, block count, and management contact details.",
          badge: "Society Application Form",
          linkText: "Register Your Society",
          linkTo: "/interestForm",
        },
        {
          num: 2,
          title: "Super-Admin Approval",
          desc: "The UrbanEase administration team reviews and verifies your society application details (typically within 24 hours).",
          badge: "Verification Review",
        },
        {
          num: 3,
          title: "Complete Subscription",
          desc: "Receive an approval email with your onboarding activation link and complete your community subscription plan via Razorpay.",
          badge: "Subscription Activation",
        },
        {
          num: 4,
          title: "Setup Society & Invite",
          desc: "Sign in to your Manager Dashboard, run the Setup Wizard to configure blocks and flats, and generate flat codes to invite residents.",
          badge: "Society Setup Wizard",
          linkText: "Sign In as Manager",
          linkTo: "/SignIn",
        },
      ],
      features: [
        { title: "Society Structure Wizard", desc: "Easily configure blocks, towers, floors, and flat inventory with automatic flat code generation." },
        { title: "Resident & Staff Management", desc: "Manage resident registrations and provision maintenance workers and security guards in one click." },
        { title: "Complaint Dispatch Desk", desc: "Review incoming resident repair requests and dispatch them directly to on-duty plumbers and electricians." },
        { title: "Financial Ledger & Billings", desc: "Generate monthly maintenance invoices and monitor dues collected effortlessly." },
      ],
    },

    staff: {
      tagline: "Maintenance Worker & Security Guard Provisioning",
      description: "Staff members do not need to register on their own. Accounts are created and provisioned directly by the Community Manager.",
      steps: [
        {
          num: 1,
          title: "Manager Provisions Account",
          desc: "Your Community Manager adds your details (name, phone number, and duty role) inside the manager's User Management portal.",
          badge: "Manager Provisioned",
        },
        {
          num: 2,
          title: "Receive Login Credentials",
          desc: "UrbanEase sends an official welcome email containing your registered email address and temporary login password.",
          badge: "Welcome Email",
        },
        {
          num: 3,
          title: "Sign In to Staff Desk",
          desc: "Navigate to the Sign In page, select your role (Worker or Security), and log in using your assigned email and password.",
          badge: "Staff Sign In",
          linkText: "Go to Sign In",
          linkTo: "/SignIn",
        },
        {
          num: 4,
          title: "Start Shift & Manage Duties",
          desc: "Workers view assigned repair jobs and upload completion photos; security officers validate resident gate passes and log visitors.",
          badge: "Active Duty Desk",
        },
      ],
      features: [
        { title: "Duty Task Feed (Workers)", desc: "Receive immediate notifications for assigned repairs, update progress, and upload photo proof." },
        { title: "Leave Requests (Workers)", desc: "Submit leave applications directly to your manager and track approval status." },
        { title: "Gate Code Verification (Security)", desc: "Enter 6-digit visitor passcodes provided by residents to clear gate barriers instantly." },
        { title: "Visitor Check-In Log (Security)", desc: "Quickly record manual entries for unannounced guests, delivery executives, and service cabs." },
      ],
    },
  };

  const current = guideData[activeRole];

  return (
    <div className="ue-root ue-guide-page">
      {/* ── Main Authentic UrbanEase Navbar ── */}
      <header className="ue-header">
        <div className="ue-nav-inner">
          <NavLink to="/" className="ue-logo-wrap">
            <img src={logo} alt="UrbanEase" className="ue-logo-img" />
          </NavLink>

          <nav>
            <ul className="ue-menu-links">
              <li><NavLink to="/" className="ue-menu-link">Home</NavLink></li>
              <li><NavLink to="/guide" className="ue-menu-link" style={{ color: "#38bdf8" }}>User Guide</NavLink></li>
            </ul>
          </nav>

          <div className="ue-nav-buttons">
            <NavLink to="/residentRegister" className="ue-button ue-button-outline">
              <Key size={15} /> Resident Code
            </NavLink>
            <NavLink to="/SignIn" className="ue-button ue-button-secondary">
              Login
            </NavLink>
            <NavLink to="/interestForm" className="ue-button ue-button-primary">
              Register Society
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="ue-guide-hero">
        <span className="ue-guide-pill">Onboarding & Process Guide</span>
        <h1>How Registration & Portals Work</h1>
        <p>
          Everything you need to know about getting your account, completing registration, and accessing your features.
        </p>
      </section>

      {/* ── Role Switcher Tabs ── */}
      <div className="ue-guide-tabs">
        <button
          className={`ue-guide-tab ${activeRole === "resident" ? "active" : ""}`}
          onClick={() => setActiveRole("resident")}
        >
          I am a Resident
        </button>
        <button
          className={`ue-guide-tab ${activeRole === "manager" ? "active" : ""}`}
          onClick={() => setActiveRole("manager")}
        >
          I am a Community Manager
        </button>
        <button
          className={`ue-guide-tab ${activeRole === "staff" ? "active" : ""}`}
          onClick={() => setActiveRole("staff")}
        >
          I am Staff / Security
        </button>
      </div>

      {/* ── Roadmap Content Container ── */}
      <main className="ue-guide-container">
        <div className="ue-guide-role-intro">
          <h2>{current.tagline}</h2>
          <p>{current.description}</p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="ue-roadmap-grid">
          {current.steps.map((step) => (
            <div key={step.num} className="ue-step-card">
              <div className="ue-step-num">{step.num}</div>
              <h3 className="ue-step-title">{step.title}</h3>
              <p className="ue-step-body">{step.desc}</p>
              <div className="ue-step-badge">{step.badge}</div>
              {step.linkTo && (
                <NavLink to={step.linkTo} className="ue-step-action">
                  {step.linkText} &rarr;
                </NavLink>
              )}
            </div>
          ))}
        </div>

        {/* Features Preview Panel */}
        <div className="ue-features-panel">
          <h3>Features Available Once Signed In</h3>
          <p className="sub">Explore what you can accomplish directly inside your dedicated portal:</p>
          <div className="ue-features-grid">
            {current.features.map((feat, idx) => (
              <div key={idx} className="ue-feature-item">
                <h4>{feat.title}</h4>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Panel */}
        <div className="ue-faq-panel">
          <h3>Frequently Asked Questions</h3>
          <div className="ue-faq-card">
            <h4>Where do I get my Flat Registration Code (UE-XXXX)?</h4>
            <p>Your Flat Registration Code is generated by your Community Manager during society setup. If you haven't received it yet, reach out to your building management or society office.</p>
          </div>
          <div className="ue-faq-card">
            <h4>What should I do if I didn't receive my verification code?</h4>
            <p>Check your email spam or junk folder. Verification codes are valid for 10 minutes. You can also request a new code directly on the verification screen after 60 seconds.</p>
          </div>
          <div className="ue-faq-card">
            <h4>Can tenants register for their flat?</h4>
            <p>Yes. Both flat owners and registered tenants can create their accounts using the Flat Registration Code assigned to their specific flat unit.</p>
          </div>
          <div className="ue-faq-card">
            <h4>Can I see a walkthrough of the features inside the portal?</h4>
            <p>Yes! Once logged in, simply click the "Tour" button in the top navigation bar or select "Feature Walkthrough" from your profile menu to launch an interactive, step-by-step tour anytime.</p>
          </div>
        </div>
      </main>

      {/* ── Main Authentic UrbanEase Footer ── */}
      <footer className="ue-site-footer">
        <div className="ue-footer-inner">
          <div className="ue-footer-columns">
            <div>
              <div className="ue-footer-brand-title">URBAN EASE</div>
              <p className="ue-footer-brand-text">
                Web application for gated societies, apartment complexes, and residential layouts.
              </p>
            </div>

            <div>
              <div className="ue-footer-column-heading">Portals</div>
              <ul className="ue-footer-column-links">
                <li><NavLink to="/SignIn">Resident & Staff Login</NavLink></li>
                <li><NavLink to="/residentRegister">Resident Code Registration</NavLink></li>
                <li><NavLink to="/guide">Registration Guide</NavLink></li>
                <li><NavLink to="/interestForm">Society Onboarding</NavLink></li>
                <li><NavLink to="/adminLogin">Platform Admin</NavLink></li>
              </ul>
            </div>

            <div>
              <div className="ue-footer-column-heading">Platform</div>
              <ul className="ue-footer-column-links">
                <li><NavLink to="/#features">Visitor Management</NavLink></li>
                <li><NavLink to="/#features">Common Space Booking</NavLink></li>
                <li><NavLink to="/#features">Issue Tracking</NavLink></li>
                <li><NavLink to="/#features">Announcements</NavLink></li>
              </ul>
            </div>

            <div>
              <div className="ue-footer-column-heading">Developers</div>
              <ul className="ue-footer-column-links">
                <li>
                  <a href={withApiBase("/api-docs")} target="_blank" rel="noreferrer">
                    Swagger API Docs
                  </a>
                </li>
                <li><NavLink to="/guide">Onboarding Guide</NavLink></li>
              </ul>
            </div>
          </div>

          <div className="ue-footer-copyright">
            <div>© {new Date().getFullYear()} UrbanEase. All rights reserved.</div>
            <div className="d-flex gap-4">
              <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Privacy Policy</a>
              <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationGuide;
