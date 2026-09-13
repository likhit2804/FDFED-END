import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../imgs/URBAN_EASE.png";
import "../assets/css/LandingPage.css";
import { withApiBase } from "../utils/apiBaseUrl";
import {
  ShieldCheck,
  CalendarCheck,
  Wrench,
  Bell,
  ArrowRight,
  CheckCircle2,
  Building2,
  Key,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Home
} from "lucide-react";

export const Landingpage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeRole, setActiveRole] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: <ShieldCheck size={26} />,
      tag: "Gate Security",
      badge: "Visitor Records",
      title: "Visitor Gate Clearance",
      desc: "Guards verify visitor codes and log entries at the main gate, replacing physical paper registers with searchable digital records.",
      points: [
        "Log visitor entry and exit times",
        "Residents pre-approve guest and delivery entries",
        "Search visitor history by date or flat number"
      ]
    },
    {
      icon: <CalendarCheck size={26} />,
      tag: "Shared Amenities",
      badge: "Slot Reservations",
      title: "Facility & Clubhouse Booking",
      desc: "Residents view calendar time slots and book shared spaces like the clubhouse, tennis court, or party hall.",
      points: [
        "Real-time calendar slot availability",
        "Configurable booking time limits per flat",
        "Confirmation records for booked slots"
      ]
    },
    {
      icon: <Wrench size={26} />,
      tag: "Maintenance Desk",
      badge: "Repair Tickets",
      title: "Complaint & Repair Tracking",
      desc: "Residents log household and common area repair requests with photos; managers assign jobs directly to electricians and plumbers.",
      points: [
        "Submit repair tickets with photo attachments",
        "Assign tickets directly to service technicians",
        "Track resolution status from open to completed"
      ]
    },
    {
      icon: <Bell size={26} />,
      tag: "Notice Board",
      badge: "Society Notices",
      title: "Circulars & Maintenance Notices",
      desc: "Managers publish official circulars, water maintenance schedules, power outage alerts, and society meeting details.",
      points: [
        "Post water supply and maintenance timings",
        "Share general meeting notices and agendas",
        "Access past announcements in one archive"
      ]
    }
  ];

  const rolesData = [
    {
      id: "residents",
      icon: <Home size={20} />,
      tabLabel: "Residents & Families",
      headline: "Resident Portal: Guest Passes, Facility Booking & Dues",
      summary: "Pre-approve expected visitors, reserve society amenities, lodge maintenance complaints with photos, and pay monthly society dues.",
      linkText: "Resident Registration",
      linkTo: "/residentRegister",
      highlights: [
        "Generate entry codes for visiting friends and delivery couriers",
        "Check facility availability and book open time slots",
        "Report plumbing or electrical issues with photo attachments",
        "View monthly maintenance invoices and payment receipts"
      ],
      preview: {
        title: "Guest Entry Pass",
        code: "ENTRY CODE: 8492",
        primaryLabel: "Guest Name",
        primaryVal: "Arjun Verma",
        secondaryLabel: "Flat Destination",
        secondaryVal: "Tower B - Flat 502",
        statusText: "Approved",
        note: "Valid for single gate entry today until 10:00 PM"
      }
    },
    {
      id: "security",
      icon: <ShieldCheck size={20} />,
      tabLabel: "Security Personnel",
      headline: "Security Gate Portal: Quick Check-In & Entry Logs",
      summary: "Guards at the society entrance verify visitor entry codes on their phones and record vehicle details without using paper books.",
      linkText: "Guard Station Login",
      linkTo: "/SignIn",
      highlights: [
        "Verify resident pre-approved entry codes in seconds",
        "Record visitor phone numbers, vehicle numbers, and flat visits",
        "Walk-in guest verification with direct resident phone alerts",
        "Searchable gate log accessible directly from security phones"
      ],
      preview: {
        title: "Gate Entry Log",
        code: "MAIN GATE",
        primaryLabel: "Current Gate",
        primaryVal: "Main Society Entrance",
        secondaryLabel: "Today's Verified Entries",
        secondaryVal: "142 Visitors Logged",
        statusText: "Active Log",
        note: "Digital gate log synchronized with manager dashboard"
      }
    },
    {
      id: "managers",
      icon: <Building2 size={20} />,
      tabLabel: "Community Managers",
      headline: "Management Portal: Flats, Residents, Staff & Accounts",
      summary: "Society committee members set up flats, approve resident registrations, assign work tickets to technicians, and publish society circulars.",
      linkText: "Onboard Your Society",
      linkTo: "/interestForm",
      highlights: [
        "Configure society towers, flats, and resident registration codes",
        "Assign incoming repair complaints directly to staff technicians",
        "Issue monthly maintenance invoices and review payment status",
        "Publish society notices and meeting details for all residents"
      ],
      preview: {
        title: "Society Administration",
        code: "RWA-PORTAL",
        primaryLabel: "Society Name",
        primaryVal: "Greenwood Heights RWA",
        secondaryLabel: "Total Flats",
        secondaryVal: "320 Flats (4 Towers)",
        statusText: "Configured",
        note: "3 Open repair tickets • Dues tracking active"
      }
    },
    {
      id: "workers",
      icon: <Wrench size={20} />,
      tabLabel: "Facility & Service Staff",
      headline: "Service Staff Portal: Assigned Jobs & Status Updates",
      summary: "Electricians, plumbers, and maintenance staff see assigned service requests on their phones and mark them finished when complete.",
      linkText: "Worker Portal Login",
      linkTo: "/SignIn",
      highlights: [
        "View assigned maintenance tickets with flat number and description",
        "Inspect resident photos and notes before starting work",
        "Update job status: In Progress, Awaiting Parts, or Resolved",
        "Keep a personal log of daily completed tasks"
      ],
      preview: {
        title: "Assigned Work Order",
        code: "TICKET #1082",
        primaryLabel: "Service Type",
        primaryVal: "Plumbing - Leakage Fix",
        secondaryLabel: "Location",
        secondaryVal: "Tower A - Flat 304",
        statusText: "In Progress",
        note: "Assigned technician: Ramesh (Plumber)"
      }
    }
  ];

  const faqs = [
    {
      q: "Does our society need to purchase dedicated gate hardware?",
      a: "No dedicated hardware is needed. UrbanEase runs in any modern web browser on Android phones, iPhones, tablets, and laptops. Security guards use standard phone browsers to verify visitor passes."
    },
    {
      q: "How long does it take to set up a residential community?",
      a: "Most societies set up in about 10 to 15 minutes. The committee manager registers the society, inputs the blocks and flats, and generates resident registration codes."
    },
    {
      q: "How does UrbanEase protect resident contact information?",
      a: "The application enforces strict role permissions. Security guards only see visitor details required for entry, resident phone numbers are protected, and visitor logs are securely stored."
    },
    {
      q: "Can the system connect with boom barriers or RFID systems?",
      a: "Yes. UrbanEase provides an API suite (accessible at /api/v1 and documented via Swagger) that technical teams can use to connect automatic boom barriers, RFID vehicle tags, and entry barriers."
    },
    {
      q: "What payment methods are supported for society maintenance dues?",
      a: "Residents can pay maintenance charges, amenity deposits, and society bills using UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, and net banking."
    }
  ];

  return (
    <div className="ue-root">
      {/* ────────────────────────────────────────────────────────────
          NAVBAR
          ──────────────────────────────────────────────────────────── */}
      <header className="ue-header">
        <div className="ue-nav-inner">
          <NavLink to="/" className="ue-logo-wrap">
            <img src={logo} alt="UrbanEase" className="ue-logo-img" />
          </NavLink>

          <nav>
            <ul className="ue-menu-links">
              <li><a href="#features" className="ue-menu-link">Features</a></li>
              <li><a href="#roles" className="ue-menu-link">Who It's For</a></li>
              <li><a href="#how-it-works" className="ue-menu-link">How It Works</a></li>
              <li><a href="#faq" className="ue-menu-link">FAQ</a></li>
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
            <button
              className="ue-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ue-mobile-dropdown"
            >
              <a href="#features" className="ue-menu-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#roles" className="ue-menu-link" onClick={() => setMobileMenuOpen(false)}>Who It's For</a>
              <a href="#how-it-works" className="ue-menu-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#faq" className="ue-menu-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25">
                <NavLink to="/residentRegister" className="ue-button ue-button-outline">
                  <Key size={15} /> Resident Registration
                </NavLink>
                <NavLink to="/SignIn" className="ue-button ue-button-secondary">
                  Login to Account
                </NavLink>
                <NavLink to="/interestForm" className="ue-button ue-button-primary">
                  Register Your Society
                </NavLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ────────────────────────────────────────────────────────────
          HERO SECTION
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-hero-section" id="home">
        <div className="ue-hero-overlay"></div>
        <div className="ue-hero-container">
          <span className="ue-hero-tag">Residential Community Management</span>
          <h1 className="ue-hero-heading">
            Manage Gate Security, Amenities, and <span className="ue-hero-highlight">Society Operations</span>
          </h1>
          <p className="ue-hero-subheading">
            A web application for apartment societies and gated communities. Security guards verify visitors, 
            residents book amenities and report repairs, and committee managers oversee flats and maintenance dues.
          </p>

          <div className="ue-hero-actions">
            <NavLink to="/interestForm" className="ue-button ue-button-primary" style={{ padding: "0.85rem 2rem", fontSize: "1.05rem" }}>
              Register Your Society <ArrowRight size={18} />
            </NavLink>
            <NavLink to="/SignIn" className="ue-button ue-button-secondary" style={{ padding: "0.85rem 1.8rem", fontSize: "1.05rem" }}>
              Login to Portal
            </NavLink>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          KEY FEATURES (2x2 Bento Capability Grid)
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section" id="features">
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">What The App Does</span>
          <h2 className="ue-section-heading">Daily Society Tools</h2>
          <p className="ue-section-paragraph">
            Everything residents, security guards, and management committees need for day-to-day operations.
          </p>
        </div>

        <div className="ue-features-bento">
          {features.map((item, idx) => (
            <div className="ue-feature-card" key={idx}>
              <div className="ue-feature-card-top">
                <div className="ue-feature-icon-box">
                  {item.icon}
                </div>
                <span className="ue-feature-badge">{item.badge}</span>
              </div>
              <span className="ue-feature-category">{item.tag}</span>
              <h3 className="ue-feature-card-title">{item.title}</h3>
              <p className="ue-feature-card-desc">{item.desc}</p>
              <ul className="ue-feature-points">
                {item.points.map((pt, pIdx) => (
                  <li key={pIdx}>
                    <CheckCircle2 size={15} className="ue-point-check" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          WHO USES THE PLATFORM (Interactive Role Switcher)
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section ue-roles-section" id="roles">
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">User Portals</span>
          <h2 className="ue-section-heading">Four Roles, Dedicated Portals</h2>
          <p className="ue-section-paragraph">
            Each user logs into a customized dashboard with tools specific to their daily responsibilities.
          </p>
        </div>

        {/* Role Segmented Tabs */}
        <div className="ue-role-tabs-bar">
          {rolesData.map((r, idx) => (
            <button
              key={r.id}
              className={`ue-role-tab-btn ${activeRole === idx ? "active" : ""}`}
              onClick={() => setActiveRole(idx)}
              type="button"
            >
              <span className="ue-role-tab-icon">{r.icon}</span>
              <span className="ue-role-tab-text">{r.tabLabel}</span>
            </button>
          ))}
        </div>

        {/* Active Role Showcase Spotlight Card */}
        <div className="ue-role-spotlight-card">
          <div className="ue-role-spotlight-left">
            <div className="ue-role-pill-badge">
              {rolesData[activeRole].icon}
              <span>{rolesData[activeRole].tabLabel}</span>
            </div>
            <h3 className="ue-role-spotlight-headline">
              {rolesData[activeRole].headline}
            </h3>
            <p className="ue-role-spotlight-summary">
              {rolesData[activeRole].summary}
            </p>

            <div className="ue-role-highlights-list">
              {rolesData[activeRole].highlights.map((item, hIdx) => (
                <div className="ue-role-highlight-row" key={hIdx}>
                  <CheckCircle2 size={16} className="ue-highlight-check" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="ue-role-spotlight-cta">
              <NavLink to={rolesData[activeRole].linkTo} className="ue-button ue-button-primary">
                {rolesData[activeRole].linkText} <ArrowRight size={16} />
              </NavLink>
            </div>
          </div>

          <div className="ue-role-spotlight-right">
            <div className="ue-workflow-preview-card">
              <div className="ue-workflow-header">
                <div className="ue-workflow-title-group">
                  <span className="ue-workflow-code">{rolesData[activeRole].preview.code}</span>
                  <h4 className="ue-workflow-title">{rolesData[activeRole].preview.title}</h4>
                </div>
                <span className="ue-workflow-status-pill">
                  {rolesData[activeRole].preview.statusText}
                </span>
              </div>

              <div className="ue-workflow-body">
                <div className="ue-workflow-data-row">
                  <span className="ue-data-label">{rolesData[activeRole].preview.primaryLabel}</span>
                  <span className="ue-data-val">{rolesData[activeRole].preview.primaryVal}</span>
                </div>
                <div className="ue-workflow-data-row">
                  <span className="ue-data-label">{rolesData[activeRole].preview.secondaryLabel}</span>
                  <span className="ue-data-val">{rolesData[activeRole].preview.secondaryVal}</span>
                </div>
              </div>

              <div className="ue-workflow-footer">
                <span className="ue-workflow-note">
                  {rolesData[activeRole].preview.note}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          HOW IT WORKS (3 SIMPLE STEPS)
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">Getting Started</span>
          <h2 className="ue-section-heading">How Gated Societies Use UrbanEase</h2>
          <p className="ue-section-paragraph">
            Three straightforward steps to set up and run society operations.
          </p>
        </div>

        <div className="ue-steps-container">
          <div className="ue-step-box">
            <div className="ue-step-number">01</div>
            <h3 className="ue-step-box-title">Register Society & Configure Flats</h3>
            <p className="ue-step-box-desc">
              The management committee registers the society and adds towers, blocks, and flat numbers through the setup wizard.
            </p>
          </div>

          <div className="ue-step-box">
            <div className="ue-step-number">02</div>
            <h3 className="ue-step-box-title">Distribute Resident & Guard Logins</h3>
            <p className="ue-step-box-desc">
              Managers share registration codes with flat owners and set up login accounts for security guards at the gate.
            </p>
          </div>

          <div className="ue-step-box">
            <div className="ue-step-number">03</div>
            <h3 className="ue-step-box-title">Manage Daily Gate & Society Operations</h3>
            <p className="ue-step-box-desc">
              Guards verify visitor codes at the gate, residents book facilities and submit repair tickets, and managers monitor accounts.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          FAQ SECTION
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section" id="faq" style={{ paddingTop: 0 }}>
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">Got Questions?</span>
          <h2 className="ue-section-heading">Frequently Asked Questions</h2>
          <p className="ue-section-paragraph">
            Common questions about deploying UrbanEase for your residential community.
          </p>
        </div>

        <div className="ue-faq-wrapper">
          {faqs.map((faq, index) => (
            <div key={index} className={`ue-faq-card ${openFaq === index ? "is-open" : ""}`}>
              <button className="ue-faq-header" onClick={() => toggleFaq(index)}>
                <span>{faq.q}</span>
                {openFaq === index ? <ChevronUp size={20} color="#3358ff" /> : <ChevronDown size={20} color="#64748b" />}
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ue-faq-content"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          CALL TO ACTION BANNER
          ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div className="ue-cta-banner-box">
          <h2 className="ue-cta-heading">Ready to Organize Your Society Operations?</h2>
          <p className="ue-cta-text">
            Set up your society blocks, flats, and gate accounts. Start managing visitor check-ins, 
            maintenance tickets, and facility bookings online.
          </p>
          <div className="ue-cta-button-row">
            <NavLink to="/interestForm" className="ue-button ue-button-primary" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem" }}>
              Register Your Society <ArrowRight size={18} />
            </NavLink>
            <NavLink to="/SignIn" className="ue-button ue-button-secondary" style={{ padding: "0.9rem 2rem", fontSize: "1.05rem" }}>
              Login to Account
            </NavLink>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          FOOTER
          ──────────────────────────────────────────────────────────── */}
      <footer className="ue-site-footer">
        <div className="ue-footer-inner">
          <div className="ue-footer-columns">
            {/* Brand */}
            <div>
              <div className="ue-footer-brand-title">URBAN EASE</div>
              <p className="ue-footer-brand-text">
                Web application for gated societies, apartment complexes, and residential layouts.
              </p>
            </div>

            {/* Portals */}
            <div>
              <div className="ue-footer-column-heading">Portals</div>
              <ul className="ue-footer-column-links">
                <li><NavLink to="/SignIn">Resident & Staff Login</NavLink></li>
                <li><NavLink to="/residentRegister">Resident Code Registration</NavLink></li>
                <li><NavLink to="/interestForm">Society Onboarding</NavLink></li>
                <li><NavLink to="/adminLogin">Platform Admin</NavLink></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <div className="ue-footer-column-heading">Platform</div>
              <ul className="ue-footer-column-links">
                <li><a href="#features">Visitor Management</a></li>
                <li><a href="#features">Common Space Booking</a></li>
                <li><a href="#features">Issue Tracking</a></li>
                <li><a href="#features">Announcements</a></li>
              </ul>
            </div>

            {/* Developers */}
            <div>
              <div className="ue-footer-column-heading">Developers</div>
              <ul className="ue-footer-column-links">
                <li>
                  <a href={withApiBase("/api-docs")} target="_blank" rel="noreferrer">
                    Swagger API Docs
                  </a>
                </li>
                <li><a href="#how-it-works">Onboarding Guide</a></li>
                <li><a href="#faq">System FAQ</a></li>
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
