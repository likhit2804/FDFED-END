import React, { useState, useEffect, useRef } from "react";
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
  Home,
  BookOpen,
  ChevronRight,
} from "lucide-react";

export const Landingpage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeRole, setActiveRole] = useState(0);
  // guideData: 0=Residents, 1=Managers, 2=Security, 3=Workers
  const [activeGuideRole, setActiveGuideRole] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    let isAnimating = false;
    let animId = null;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const scrollToTarget = (targetPos) => {
      isAnimating = true;
      const startPos = container.scrollTop;
      const distance = targetPos - startPos;
      const duration = 850; // Controlled, smooth 850ms scroll speed
      let startTime = null;

      const step = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        container.scrollTop = startPos + distance * easedProgress;

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          container.scrollTop = targetPos;
          setTimeout(() => {
            isAnimating = false;
          }, 80);
        }
      };

      animId = requestAnimationFrame(step);
    };

    const handleWheel = (e) => {
      if (mobileMenuOpen) return;

      if (isAnimating) {
        e.preventDefault();
        return;
      }

      // Filter tiny touchpad noise
      if (Math.abs(e.deltaY) < 15) return;

      const sections = Array.from(
        container.querySelectorAll(
          ".ue-hero-section, .ue-section, .ue-guide-section, .ue-final-section"
        )
      );
      if (!sections.length) return;

      const currentScroll = container.scrollTop;
      let currentIndex = 0;
      let minDiff = Infinity;

      sections.forEach((sec, idx) => {
        const diff = Math.abs(sec.offsetTop - currentScroll);
        if (diff < minDiff) {
          minDiff = diff;
          currentIndex = idx;
        }
      });

      const direction = e.deltaY > 0 ? 1 : -1;
      let targetIndex = currentIndex + direction;
      targetIndex = Math.max(0, Math.min(sections.length - 1, targetIndex));

      if (targetIndex !== currentIndex) {
        e.preventDefault();
        scrollToTarget(sections[targetIndex].offsetTop);
      }
    };

    const handleKeyDown = (e) => {
      if (["ArrowDown", "PageDown"].includes(e.code)) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
        e.preventDefault();
        triggerDirectionMove(1);
      } else if (["ArrowUp", "PageUp"].includes(e.code)) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
        e.preventDefault();
        triggerDirectionMove(-1);
      }
    };

    const triggerDirectionMove = (direction) => {
      if (isAnimating) return;
      const sections = Array.from(
        container.querySelectorAll(
          ".ue-hero-section, .ue-section, .ue-guide-section, .ue-final-section"
        )
      );
      if (!sections.length) return;

      const currentScroll = container.scrollTop;
      let currentIndex = 0;
      let minDiff = Infinity;

      sections.forEach((sec, idx) => {
        const diff = Math.abs(sec.offsetTop - currentScroll);
        if (diff < minDiff) {
          minDiff = diff;
          currentIndex = idx;
        }
      });

      let targetIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));
      if (targetIndex !== currentIndex) {
        scrollToTarget(sections[targetIndex].offsetTop);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [mobileMenuOpen]);

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
        "Search visitor history by date or flat number",
      ],
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
        "Confirmation records for booked slots",
      ],
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
        "Track resolution status from open to completed",
      ],
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
        "Access past announcements in one archive",
      ],
    },
  ];

  const rolesData = [
    {
      id: "residents",
      icon: <Home size={20} />,
      tabLabel: "Residents & Families",
      headline: "Resident Portal: Guest Passes, Facility Booking & Dues",
      summary:
        "Pre-approve expected visitors, reserve society amenities, lodge maintenance complaints with photos, and pay monthly society dues.",
      linkText: "Resident Registration",
      linkTo: "/residentRegister",
      highlights: [
        "Generate entry codes for visiting friends and delivery couriers",
        "Check facility availability and book open time slots",
        "Report plumbing or electrical issues with photo attachments",
        "View monthly maintenance invoices and payment receipts",
      ],
      preview: {
        title: "Guest Entry Pass",
        code: "ENTRY CODE: 8492",
        primaryLabel: "Guest Name",
        primaryVal: "Arjun Verma",
        secondaryLabel: "Flat Destination",
        secondaryVal: "Tower B - Flat 502",
        statusText: "Approved",
        note: "Valid for single gate entry today until 10:00 PM",
      },
    },
    {
      id: "security",
      icon: <ShieldCheck size={20} />,
      tabLabel: "Security Personnel",
      headline: "Security Gate Portal: Quick Check-In & Entry Logs",
      summary:
        "Guards at the society entrance verify visitor entry codes on their phones and record vehicle details without using paper books.",
      linkText: "Guard Station Login",
      linkTo: "/SignIn",
      highlights: [
        "Verify resident pre-approved entry codes in seconds",
        "Record visitor phone numbers, vehicle numbers, and flat visits",
        "Walk-in guest verification with direct resident phone alerts",
        "Searchable gate log accessible directly from security phones",
      ],
      preview: {
        title: "Gate Entry Log",
        code: "MAIN GATE",
        primaryLabel: "Current Gate",
        primaryVal: "Main Society Entrance",
        secondaryLabel: "Today's Verified Entries",
        secondaryVal: "142 Visitors Logged",
        statusText: "Active Log",
        note: "Digital gate log synchronized with manager dashboard",
      },
    },
    {
      id: "managers",
      icon: <Building2 size={20} />,
      tabLabel: "Community Managers",
      headline: "Management Portal: Flats, Residents, Staff & Accounts",
      summary:
        "Society committee members set up flats, approve resident registrations, assign work tickets to technicians, and publish society circulars.",
      linkText: "Onboard Your Society",
      linkTo: "/interestForm",
      highlights: [
        "Configure society towers, flats, and resident registration codes",
        "Assign incoming repair complaints directly to staff technicians",
        "Issue monthly maintenance invoices and review payment status",
        "Publish society notices and meeting details for all residents",
      ],
      preview: {
        title: "Society Administration",
        code: "RWA-PORTAL",
        primaryLabel: "Society Name",
        primaryVal: "Greenwood Heights RWA",
        secondaryLabel: "Total Flats",
        secondaryVal: "320 Flats (4 Towers)",
        statusText: "Configured",
        note: "3 Open repair tickets • Dues tracking active",
      },
    },
    {
      id: "workers",
      icon: <Wrench size={20} />,
      tabLabel: "Facility & Service Staff",
      headline: "Service Staff Portal: Assigned Jobs & Status Updates",
      summary:
        "Electricians, plumbers, and maintenance staff see assigned service requests on their phones and mark them finished when complete.",
      linkText: "Worker Portal Login",
      linkTo: "/SignIn",
      highlights: [
        "View assigned maintenance tickets with flat number and description",
        "Inspect resident photos and notes before starting work",
        "Update job status: In Progress, Awaiting Parts, or Resolved",
        "Keep a personal log of daily completed tasks",
      ],
      preview: {
        title: "Assigned Work Order",
        code: "TICKET #1082",
        primaryLabel: "Service Type",
        primaryVal: "Plumbing - Leakage Fix",
        secondaryLabel: "Location",
        secondaryVal: "Tower A - Flat 304",
        statusText: "In Progress",
        note: "Assigned technician: Ramesh (Plumber)",
      },
    },
  ];

  const guideData = [
    {
      id: "residents",
      role: "Residents & Families",
      icon: <Home size={18} />,
      badge: "Flat Registration & Living",
      tagline: "Resident Self-Registration via Flat Code",
      summary:
        "Register in under 2 minutes using your unique flat code from the management committee. Get digital gate passes, amenity bookings, and online maintenance payments.",
      ctaText: "Register Your Flat",
      ctaLink: "/residentRegister",
      steps: [
        { num: "01", title: "Get Your Flat Code", desc: "Obtain your unique 6-character Flat Registration Code (e.g. UE-A402) from your Community Manager.", tag: "Format: UE-XXXX" },
        { num: "02", title: "Submit Registration", desc: "Open the Resident Registration portal. Enter your flat code, full name, phone number, and email.", tag: "Resident Portal", linkText: "Register Flat", linkTo: "/residentRegister" },
        { num: "03", title: "Verify Email OTP", desc: "Check your inbox for an instant 6-digit security code. Submit the OTP to link your profile to your home unit.", tag: "Instant OTP" },
        { num: "04", title: "Receive Password & Login", desc: "UrbanEase sends your temporary password via email. Sign in to generate visitor passes and reserve amenities.", tag: "Instant Access", linkText: "Sign In", linkTo: "/SignIn" },
      ],
      capabilities: [
        "Pre-approve expected visitors & delivery passes",
        "Reserve clubhouse, tennis court & pool slots",
        "Lodge repairs with photo attachments",
        "Pay monthly dues via Razorpay UPI",
      ],
    },
    {
      id: "managers",
      role: "Community Managers",
      icon: <Building2 size={18} />,
      badge: "Society Onboarding & Setup",
      tagline: "Society Registration & Operations Setup",
      summary:
        "Register your gated community, configure blocks and flats, generate resident invitation codes, and dispatch incoming repair jobs to staff.",
      ctaText: "Register Your Society",
      ctaLink: "/interestForm",
      steps: [
        { num: "01", title: "Submit Society Application", desc: "Fill out the Community Application Form with your society name, address, block count, and RWA contact details.", tag: "Application Form", linkText: "Apply Online", linkTo: "/interestForm" },
        { num: "02", title: "Super-Admin Approval", desc: "The UrbanEase platform team verifies your community application and provisions your dedicated workspace.", tag: "24-Hour Review" },
        { num: "03", title: "Activate Subscription", desc: "Receive your activation link via email and complete your subscription plan securely through Razorpay.", tag: "Secure Checkout" },
        { num: "04", title: "Setup Society & Invite", desc: "Run the Setup Wizard to generate blocks and flats. Generate flat codes to invite residents and provision staff.", tag: "Setup Wizard", linkText: "Manager Login", linkTo: "/SignIn" },
      ],
      capabilities: [
        "Automated block, tower, and flat code generation",
        "Dispatch repair complaints to staff technicians",
        "Issue maintenance dues & payment ledger tracking",
        "Publish official society notices and circulars",
      ],
    },
    {
      id: "security",
      role: "Security Guards",
      icon: <ShieldCheck size={18} />,
      badge: "Gate Desk & Visitor Control",
      tagline: "Gate Operations & Visitor Verification",
      summary:
        "Security personnel are provisioned directly by the Community Manager. Guards verify visitor codes on any mobile browser without dedicated hardware.",
      ctaText: "Guard Station Login",
      ctaLink: "/SignIn",
      steps: [
        { num: "01", title: "Manager Provisions Guard", desc: "The Community Manager creates security accounts and tags their duty station (Main Gate, Service Barrier, Tower Desk).", tag: "Admin Provisioned" },
        { num: "02", title: "Receive Credentials", desc: "The guard station receives automated login credentials via email or from the estate security supervisor.", tag: "Welcome Credentials" },
        { num: "03", title: "Sign In at Gate Station", desc: "Open UrbanEase on any mobile or desktop browser, select Security role, and sign in to access the Gate Desk.", tag: "Zero Hardware", linkText: "Security Login", linkTo: "/SignIn" },
        { num: "04", title: "Verify Passes & Log Entries", desc: "Scan visitor QR passes or enter 6-digit codes to clear the boom barrier, or log walk-in delivery entries.", tag: "Live Gate Log" },
      ],
      capabilities: [
        "Built-in QR scanner for instant entry passes",
        "Visitor vehicle and phone number recording",
        "Intercom ticket logging with auto-dispatch",
        "Digital searchable gate ledger",
      ],
    },
    {
      id: "workers",
      role: "Maintenance Staff",
      icon: <Wrench size={18} />,
      badge: "Work Orders & Job Execution",
      tagline: "Technician Job Dispatch & Status Updates",
      summary:
        "Service technicians receive work orders on their phones with resident photo proofs and mark tickets resolved upon completion.",
      ctaText: "Worker Portal Login",
      ctaLink: "/SignIn",
      steps: [
        { num: "01", title: "Manager Assigns Trade", desc: "The Community Manager provisions staff accounts and tags their specialization (Plumbing, Electrical, Carpentry).", tag: "Role & Trade Tagged" },
        { num: "02", title: "Receive Login Access", desc: "Staff receive login credentials via email and estate administration to access their personal task workbench.", tag: "Direct Access" },
        { num: "03", title: "Sign In & View Worklist", desc: "Sign in to the Worker Portal on any phone to view assigned household repairs, flat numbers, and photo attachments.", tag: "Task Workbench", linkText: "Worker Login", linkTo: "/SignIn" },
        { num: "04", title: "Execute & Resolve", desc: "Update job status to 'In Progress', specify materials or service charges, and mark tasks resolved with resident sign-off.", tag: "Instant Resolution" },
      ],
      capabilities: [
        "Live repair queue with urgent priority sorting",
        "Inspect resident photo attachments & repair notes",
        "Track completion metrics & resident star ratings",
        "Submit leave applications directly to manager",
      ],
    },
  ];

  const faqs = [
    { q: "Does our society need to purchase dedicated gate hardware?", a: "No dedicated hardware is needed. UrbanEase runs in any modern web browser on Android phones, iPhones, tablets, and laptops. Security guards use standard phone browsers to verify visitor passes." },
    { q: "How long does it take to set up a residential community?", a: "Most societies set up in about 10 to 15 minutes. The committee manager registers the society, inputs the blocks and flats, and generates resident registration codes." },
    { q: "How does UrbanEase protect resident contact information?", a: "The application enforces strict role permissions. Security guards only see visitor details required for entry, resident phone numbers are protected, and visitor logs are securely stored." },
    { q: "Can the system connect with boom barriers or RFID systems?", a: "Yes. UrbanEase provides an API suite (accessible at /api/v1 and documented via Swagger) that technical teams can use to connect automatic boom barriers, RFID vehicle tags, and entry barriers." },
    { q: "What payment methods are supported for society maintenance dues?", a: "Residents can pay maintenance charges, amenity deposits, and society bills using UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, and net banking." },
  ];

  const selectedGuide = guideData[activeGuideRole];

  return (
    <div className="ue-root" ref={rootRef}>
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
              <li><a href="#guide" className="ue-menu-link">User Guide</a></li>
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
              <a href="#guide" className="ue-menu-link" onClick={() => setMobileMenuOpen(false)}>User Guide</a>
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
          HERO
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-hero-section" id="home">
        <div className="ue-hero-overlay"></div>
        <div className="ue-hero-container">
          <span className="ue-hero-tag">Residential Community Management</span>
          <h1 className="ue-hero-heading">
            Manage Gate Security, Amenities, and{" "}
            <span className="ue-hero-highlight">Society Operations</span>
          </h1>
          <p className="ue-hero-subheading">
            A web application for apartment societies and gated communities. Security guards verify
            visitors, residents book amenities and report repairs, and committee managers oversee
            flats and maintenance dues.
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
          KEY FEATURES
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
                <div className="ue-feature-icon-box">{item.icon}</div>
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
          WHO USES THE PLATFORM
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section ue-roles-section" id="roles" style={{ paddingTop: 0 }}>
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">User Portals</span>
          <h2 className="ue-section-heading">Four Roles, Dedicated Portals</h2>
          <p className="ue-section-paragraph">
            Each user logs into a customized dashboard with tools specific to their daily responsibilities.
          </p>
        </div>

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

        <div className="ue-role-spotlight-card">
          <div className="ue-role-spotlight-left">
            <div className="ue-role-pill-badge">
              {rolesData[activeRole].icon}
              <span>{rolesData[activeRole].tabLabel}</span>
            </div>
            <h3 className="ue-role-spotlight-headline">{rolesData[activeRole].headline}</h3>
            <p className="ue-role-spotlight-summary">{rolesData[activeRole].summary}</p>
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
                <span className="ue-workflow-status-pill">{rolesData[activeRole].preview.statusText}</span>
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
                <span className="ue-workflow-note">{rolesData[activeRole].preview.note}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          HOW IT WORKS
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
          USER GUIDE — Hub (Left 1fr, triangular) + Detail (Right 2fr)
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-guide-section" id="guide">
        <div className="ue-section-title-wrap">
          <span className="ue-section-kicker">Role-by-Role Roadmap</span>
          <h2 className="ue-section-heading">User Guide</h2>
          <p className="ue-section-paragraph">
            Select a role node in the hub diagram to view its onboarding roadmap and capabilities.
          </p>
        </div>

        <div className="ue-guide-grid">
          {/* ── LEFT (1fr): Triangular Hub Diagram ── */}
          <div className="ue-guide-hub-col">
            <div className="ue-hub-wrapper">
              <div className="ue-hub-tri">
                {/* Connector lines — coordinate space is 0-100 on both
                    axes (preserveAspectRatio="none") so these always
                    line up with the node positions below, whatever the
                    box's actual pixel aspect ratio is. */}
                <svg className="ue-hub-tri-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line
                    x1="50" y1="50" x2="50" y2="14"
                    className={`ue-hub-line ${activeGuideRole === 0 || activeGuideRole === 1 ? "ue-hub-line-active" : ""}`}
                  />
                  <line
                    x1="50" y1="50" x2="15" y2="88"
                    className={`ue-hub-line ${activeGuideRole === 2 || activeGuideRole === 1 ? "ue-hub-line-active" : ""}`}
                  />
                  <line
                    x1="50" y1="50" x2="85" y2="88"
                    className={`ue-hub-line ${activeGuideRole === 3 || activeGuideRole === 1 ? "ue-hub-line-active" : ""}`}
                  />
                </svg>

                {/* Top corner: Residents */}
                <button
                  className={`ue-hub-tri-node ue-hub-tri-top${activeGuideRole === 0 ? " active" : ""}`}
                  onClick={() => setActiveGuideRole(0)}
                  type="button"
                >
                  <div className="ue-hub-tri-node-icon"><Home size={22} /></div>
                  <div className="ue-hub-tri-node-name">Residents</div>
                </button>

                {/* Centre: Manager */}
                <button
                  className={`ue-hub-tri-node ue-hub-tri-center${activeGuideRole === 1 ? " active" : ""}`}
                  onClick={() => setActiveGuideRole(1)}
                  type="button"
                >
                  <div className="ue-hub-tri-node-icon"><Building2 size={26} /></div>
                  <div className="ue-hub-tri-node-name">Manager</div>
                </button>

                {/* Bottom-left corner: Security */}
                <button
                  className={`ue-hub-tri-node ue-hub-tri-left${activeGuideRole === 2 ? " active" : ""}`}
                  onClick={() => setActiveGuideRole(2)}
                  type="button"
                >
                  <div className="ue-hub-tri-node-icon"><ShieldCheck size={20} /></div>
                  <div className="ue-hub-tri-node-name">Security</div>
                </button>

                {/* Bottom-right corner: Workers */}
                <button
                  className={`ue-hub-tri-node ue-hub-tri-right${activeGuideRole === 3 ? " active" : ""}`}
                  onClick={() => setActiveGuideRole(3)}
                  type="button"
                >
                  <div className="ue-hub-tri-node-icon"><Wrench size={20} /></div>
                  <div className="ue-hub-tri-node-name">Workers</div>
                </button>
              </div>

              <p className="ue-hub-hint">
                <BookOpen size={13} /> Click a role to switch details
              </p>
            </div>
          </div>

          {/* ── RIGHT (2fr): Role Detail Information Panel ── */}
          <div className="ue-guide-detail-col">
            <div className="ue-guide-detail-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeGuideRole}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Role header with top-right CTA button */}
                  <div className="ue-guide-detail-header">
                    <div className="ue-guide-detail-top-row">
                      <div className="ue-guide-role-badge-pill">
                        {selectedGuide.icon}
                        {selectedGuide.badge}
                      </div>
                      <NavLink to={selectedGuide.ctaLink} className="ue-button ue-button-primary ue-guide-top-cta">
                        {selectedGuide.ctaText} <ArrowRight size={14} />
                      </NavLink>
                    </div>
                    <h3 className="ue-guide-role-tagline">{selectedGuide.tagline}</h3>
                    <p className="ue-guide-role-summary">{selectedGuide.summary}</p>
                  </div>

                  {/* Steps */}
                  <div className="ue-guide-steps-grid" style={{ marginTop: "1.25rem" }}>
                    {selectedGuide.steps.map((step) => (
                      <div key={step.num} className="ue-guide-step-card">
                        <div className="ue-guide-step-top">
                          <div className="ue-guide-step-num">{step.num}</div>
                          <span className="ue-guide-step-tag">{step.tag}</span>
                        </div>
                        <h4 className="ue-guide-step-title">{step.title}</h4>
                        <p className="ue-guide-step-desc">{step.desc}</p>
                        {step.linkText && (
                          <div className="ue-guide-step-action">
                            <NavLink to={step.linkTo} className="ue-guide-step-link">
                              {step.linkText} <ArrowRight size={13} />
                            </NavLink>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          FAQ SECTION
          ──────────────────────────────────────────────────────────── */}
      <section className="ue-section" id="faq">
        <div className="ue-section-header">
          <span className="ue-pill">Frequently Asked Questions</span>
          <h2 className="ue-section-title">Common Questions About UrbanEase</h2>
          <p className="ue-section-desc">
            Find answers to common questions about onboarding, gate security, resident access, and platform integration.
          </p>
        </div>

        <div className="ue-faq-grid">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`ue-faq-card${openFaq === idx ? " active" : ""}`}
            >
              <button
                className="ue-faq-header"
                onClick={() => toggleFaq(idx)}
                type="button"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openFaq === idx && (
                <div className="ue-faq-content">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          CTA BANNER + FOOTER — combined final snap section
          ──────────────────────────────────────────────────────────── */}
      <div className="ue-final-section">
        {/* CTA */}
        <div className="ue-page-container">
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

        {/* Footer */}
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
                  <li><NavLink to="/SignIn">Resident &amp; Staff Login</NavLink></li>
                  <li><NavLink to="/residentRegister">Resident Code Registration</NavLink></li>
                  <li><NavLink to="/interestForm">Society Onboarding</NavLink></li>
                  <li><NavLink to="/adminLogin">Platform Admin</NavLink></li>
                </ul>
              </div>
              <div>
                <div className="ue-footer-column-heading">Platform</div>
                <ul className="ue-footer-column-links">
                  <li><a href="#features">Visitor Management</a></li>
                  <li><a href="#features">Common Space Booking</a></li>
                  <li><a href="#features">Issue Tracking</a></li>
                  <li><a href="#features">Announcements</a></li>
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
    </div>
  );
};