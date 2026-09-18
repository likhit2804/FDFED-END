import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/ManagerTour.css";

export const SECURITY_STEPS = [
  // ================= DASHBOARD =================
  {
    id: "sec-dash-metrics",
    tab: "Dashboard",
    route: "/security/dashboard",
    badge: "Step 1 of 5 · Dashboard",
    title: "1. Gate Operations & Visitor Metrics",
    description: "Monitor live community gate volume, active visitors currently inside the premises, and pending resident approvals at a glance.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type",
  },
  {
    id: "sec-dash-quick-log",
    tab: "Dashboard",
    route: "/security/dashboard",
    badge: "Step 2 of 5 · Dashboard",
    title: "2. Log Phone & Intercom Calls",
    description: "Received an urgent call from a resident or guard tower? Click 'Quick Log Ticket' to log incidents with automated technician dispatch.",
    targetSelector: ".mb-4.p-3.rounded-3, .d-flex.align-items-center.gap-2 button:last-of-type, button.btn-primary, .manager-section:first-of-type",
  },

  // ================= VISITORS =================
  {
    id: "sec-visitors-desk",
    tab: "Visitors",
    route: "/security/visitorManagement",
    badge: "Step 3 of 5 · Visitors",
    title: "3. Visitor Entry & Exit Management",
    description: "Register walk-in guests, delivery personnel, and contractors with contact details, vehicle numbers, and instant check-in/out timestamps.",
    targetSelector: ".manager-section__header-actions button, button:has(.lucide-plus), .ue-stat-grid, .manager-section:first-of-type",
  },

  // ================= PREAPPROVAL =================
  {
    id: "sec-preapproval-scanner",
    tab: "Preapproval",
    route: "/security/preapproval",
    badge: "Step 4 of 5 · Preapproval",
    title: "4. Gate QR Scanner & Pre-Approvals",
    description: "Use the built-in camera scanner to instantly verify resident QR passes at the boom barrier, or approve visitor clearance requests.",
    targetSelector: "button:has(.bi-qr-code-scan), .manager-section__header-actions button, .tabs-container, .manager-section:first-of-type",
  },

  // ================= ISSUES DESK =================
  {
    id: "sec-issues-hotline",
    tab: "Issues Desk",
    route: "/security/issues",
    badge: "Step 5 of 5 · Issues Desk",
    title: "5. Security & Emergency Incident Desk",
    description: "Track and follow up on critical society emergencies, streetlight or elevator outages, and resident maintenance escalations.",
    targetSelector: ".ue-stat-grid, .tabs-container, .manager-section:first-of-type, main",
  },
];

export const SecurityTour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isActive, setIsActive] = useState(() => {
    return sessionStorage.getItem("ue:security-tour-active") === "1";
  });

  const [currentStepIdx, setCurrentStepIdx] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("ue:security-tour-step") || "0", 10);
    return isNaN(saved) || saved < 0 ? 0 : Math.min(saved, SECURITY_STEPS.length - 1);
  });

  const [popoverStyle, setPopoverStyle] = useState({
    top: 80,
    left: Math.max(16, (typeof window !== "undefined" ? window.innerWidth - 420 : 800)),
    placement: "docked",
    arrowLeft: 0,
  });

  const activeTargetRef = useRef(null);
  const pollerRef = useRef(null);

  // Clean up highlighted target element
  const clearTargetHighlight = useCallback(() => {
    if (activeTargetRef.current) {
      activeTargetRef.current.classList.remove("ue-tour-highlight-target");
      activeTargetRef.current = null;
    }
  }, []);

  // Highlight corresponding navbar tab (clean solid teal, NO green dot)
  const highlightNavbarTab = useCallback((route, tabName) => {
    const navLinks = document.querySelectorAll(".app-navbar__link");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const text = link.textContent?.trim().toLowerCase() || "";
      const isRouteMatch = route && (href === route || href.startsWith(route));
      const isTabMatch = tabName && text.includes(tabName.toLowerCase());

      if (isRouteMatch || isTabMatch) {
        link.classList.add("ue-tour-nav-active");
      } else {
        link.classList.remove("ue-tour-nav-active");
      }
    });
  }, []);

  // Clear navbar tab highlight
  const clearNavbarHighlight = useCallback(() => {
    document.querySelectorAll(".app-navbar__link.ue-tour-nav-active").forEach((link) => {
      link.classList.remove("ue-tour-nav-active");
    });
  }, []);

  // Calculate position relative to spotlighted element
  const updatePosition = useCallback((targetEl) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = Math.min(390, viewportWidth - 32);
    const popoverHeight = 185; // compact card height
    const safeMaxTop = Math.max(74, viewportHeight - popoverHeight - 16);

    if (!targetEl || targetEl === document.body || targetEl === document.documentElement) {
      setPopoverStyle({
        top: 80,
        left: Math.max(16, viewportWidth - popoverWidth - 24),
        placement: "docked",
        arrowLeft: 0,
      });
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;

    let left = targetCenterX - popoverWidth / 2;
    left = Math.max(16, Math.min(viewportWidth - popoverWidth - 16, left));

    let top = 80;
    let placement = "bottom";

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top - 74;

    // If target is very tall (>55% of viewport), dock on top-right so target is visible
    if (rect.height > viewportHeight * 0.55) {
      top = 80;
      left = Math.max(16, viewportWidth - popoverWidth - 24);
      placement = "docked";
    }
    // If target is in the lower half of screen (rect.top > 40% viewport) or spaceBelow < 220px:
    // Place ABOVE the target if there is space above!
    else if ((rect.top > viewportHeight * 0.4 || spaceBelow < 220) && spaceAbove >= 180) {
      top = Math.max(74, rect.top - popoverHeight - 12);
      placement = "top";
    }
    // If enough space below, place BELOW
    else if (spaceBelow >= 220) {
      top = rect.bottom + 12;
      placement = "bottom";
    }
    // Fallback above
    else if (spaceAbove >= 180) {
      top = Math.max(74, rect.top - popoverHeight - 12);
      placement = "top";
    }
    // Otherwise dock safely at top-right
    else {
      top = 80;
      left = Math.max(16, viewportWidth - popoverWidth - 24);
      placement = "docked";
    }

    // STRICT CLAMP to ensure card is 100% visible inside the viewport without cut-off
    top = Math.max(74, Math.min(safeMaxTop, top));

    const arrowLeft = Math.max(24, Math.min(popoverWidth - 34, targetCenterX - left - 7));

    setPopoverStyle({
      top,
      left,
      placement,
      arrowLeft,
    });
  }, []);

  // End tour
  const endTour = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
    sessionStorage.removeItem("ue:security-tour-active");
    sessionStorage.removeItem("ue:security-tour-step");
    clearTargetHighlight();
    clearNavbarHighlight();
    setIsActive(false);
    setCurrentStepIdx(0);
  }, [clearTargetHighlight, clearNavbarHighlight]);

  // Navigate & Jump to Step
  const goToStep = useCallback((idx) => {
    if (idx < 0 || idx >= SECURITY_STEPS.length) {
      endTour();
      return;
    }

    const step = SECURITY_STEPS[idx];
    setIsActive(true);
    setCurrentStepIdx(idx);
    sessionStorage.setItem("ue:security-tour-active", "1");
    sessionStorage.setItem("ue:security-tour-step", String(idx));

    // Immediately highlight navbar tab
    highlightNavbarTab(step.route, step.tab);

    // Navigate if route differs
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [endTour, highlightNavbarTab, location.pathname, navigate]);

  // Reactive step observer: fires on step change, route change, or active status
  useEffect(() => {
    if (!isActive) return;

    const step = SECURITY_STEPS[currentStepIdx] || SECURITY_STEPS[0];
    highlightNavbarTab(step.route, step.tab);

    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }

    clearTargetHighlight();

    // If on correct route, search for target element and position popover
    if (location.pathname === step.route) {
      let attempts = 0;
      const maxAttempts = 25; // 25 * 80ms = 2s

      const findAndHighlight = () => {
        attempts++;
        let el = null;
        if (step.targetSelector) {
          try {
            el = document.querySelector(step.targetSelector);
          } catch {
            // ignore selector syntax errors
          }
        }

        const isVisible = el && (el.offsetWidth > 0 || el.offsetHeight > 0);
        if (isVisible && el !== document.body && el !== document.documentElement) {
          if (pollerRef.current) {
            clearInterval(pollerRef.current);
            pollerRef.current = null;
          }
          el.classList.add("ue-tour-highlight-target");
          activeTargetRef.current = el;

          try {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch {
            // ignore scroll error
          }

          updatePosition(el);

          // Re-update after scroll finishes to guarantee pixel perfection
          setTimeout(() => {
            if (activeTargetRef.current === el) {
              updatePosition(el);
            }
          }, 220);
          setTimeout(() => {
            if (activeTargetRef.current === el) {
              updatePosition(el);
            }
          }, 450);
        } else if (attempts >= maxAttempts) {
          if (pollerRef.current) {
            clearInterval(pollerRef.current);
            pollerRef.current = null;
          }
          // Fallback dock position
          updatePosition(null);
        }
      };

      findAndHighlight();
      if (!activeTargetRef.current) {
        pollerRef.current = setInterval(findAndHighlight, 80);
      }
    } else {
      // While transitioning route, dock safely
      updatePosition(null);
    }

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [isActive, currentStepIdx, location.pathname, highlightNavbarTab, clearTargetHighlight, updatePosition]);

  // Handle window scroll & resize
  useEffect(() => {
    if (!isActive) return;
    const handleReposition = () => {
      if (activeTargetRef.current) {
        updatePosition(activeTargetRef.current);
      }
    };
    window.addEventListener("scroll", handleReposition, { passive: true });
    window.addEventListener("resize", handleReposition, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleReposition);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isActive, updatePosition]);

  // Listen for external trigger from Navbar
  useEffect(() => {
    const handleStartTour = () => {
      setIsActive(true);
      goToStep(0);
    };

    window.addEventListener("ue:start-security-tour", handleStartTour);
    return () => {
      window.removeEventListener("ue:start-security-tour", handleStartTour);
    };
  }, [goToStep]);

  if (!isActive) return null;

  const currentStep = SECURITY_STEPS[currentStepIdx] || SECURITY_STEPS[0];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === SECURITY_STEPS.length - 1;

  return (
    <>
      {/* Dim Scrim below Navbar */}
      <div className="ue-tour-scrim" />

      {/* Target-Anchored Tour Card */}
      <div
        className="ue-tour-card"
        style={{
          top: `${popoverStyle.top}px`,
          left: `${popoverStyle.left}px`,
        }}
        role="dialog"
        aria-modal="false"
        aria-label="Security Walkthrough"
      >
        {/* Pointer Arrow */}
        {popoverStyle.placement === "bottom" && (
          <div
            className="ue-tour-card__arrow ue-tour-card__arrow--top"
            style={{ left: `${popoverStyle.arrowLeft}px` }}
          />
        )}
        {popoverStyle.placement === "top" && (
          <div
            className="ue-tour-card__arrow ue-tour-card__arrow--bottom"
            style={{ left: `${popoverStyle.arrowLeft}px` }}
          />
        )}

        {/* Card Header: Step Badge & Step Dots */}
        <div className="ue-tour-card__header">
          <span className="ue-tour-card__badge">{currentStep.badge}</span>
          <div className="ue-tour-card__dots" title="Step Progress">
            {SECURITY_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                className={`ue-tour-dot ${idx === currentStepIdx ? "is-active" : idx < currentStepIdx ? "is-completed" : ""}`}
                onClick={() => goToStep(idx)}
                aria-label={`Jump to ${step.title}`}
              />
            ))}
          </div>
        </div>

        {/* Step Title */}
        <h2 id="ue-tour-title" className="ue-tour-card__title">
          {currentStep.title}
        </h2>

        {/* Step Description */}
        <p className="ue-tour-card__desc">{currentStep.description}</p>

        {/* Card Footer Actions */}
        <div className="ue-tour-card__footer">
          <button
            type="button"
            className="ue-tour-btn ue-tour-btn--skip"
            onClick={endTour}
          >
            End Tour
          </button>
          <div className="ue-tour-card__nav-group">
            {!isFirst && (
              <button
                type="button"
                className="ue-tour-btn ue-tour-btn--back"
                onClick={() => goToStep(currentStepIdx - 1)}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="ue-tour-btn ue-tour-btn--next"
              onClick={() => {
                if (isLast) {
                  endTour();
                } else {
                  goToStep(currentStepIdx + 1);
                }
              }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityTour;
