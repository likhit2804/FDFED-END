import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/ManagerTour.css";

export const RESIDENT_STEPS = [
  // ================= DASHBOARD =================
  {
    id: "res-dash-stats",
    tab: "Dashboard",
    route: "/resident/dashboard",
    badge: "Step 1 of 8 · Dashboard",
    title: "1. Community Activity Overview",
    description: "Welcome to your resident portal! Get instant visibility over your recent society updates, payment events, maintenance tickets, and gate pre-approvals.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type",
  },
  {
    id: "res-dash-activity",
    tab: "Dashboard",
    route: "/resident/dashboard",
    badge: "Step 2 of 8 · Dashboard",
    title: "2. Recent Activity Feed",
    description: "Track your latest transactions, issue resolution milestones, and amenity bookings in real time with interactive date-range filtering.",
    targetSelector: ".resident-ui-page .manager-section:nth-of-type(2), .manager-section:nth-of-type(2), .manager-ui-two-column",
  },

  // ================= PRE APPROVAL =================
  {
    id: "res-preapproval-btn",
    tab: "Pre Approval",
    route: "/resident/preApproval",
    badge: "Step 3 of 8 · Pre Approval",
    title: "3. Pre-Approve Gate Visitors",
    description: "Expecting guests, cabs, or Swiggy/Zomato food deliveries? Click 'Pre Approve' to schedule visitor arrivals and generate instant gate clearance passes.",
    targetSelector: ".manager-section__header-actions button, button:has(.bi-plus-lg), .manager-action-btn",
  },
  {
    id: "res-preapproval-passes",
    tab: "Pre Approval",
    route: "/resident/preApproval",
    badge: "Step 4 of 8 · Pre Approval",
    title: "4. Visitor QR Passes",
    description: "Review your scheduled visitor requests and click 'View QR' to share an instant entry pass with your guests for seamless barrier verification.",
    targetSelector: ".ue-entity-grid, .table-container, .ue-stat-grid",
  },

  // ================= ISSUE RAISING =================
  {
    id: "res-issues-hotline",
    tab: "Issue Raising",
    route: "/resident/issueRaising",
    badge: "Step 5 of 8 · Issue Raising",
    title: "5. Emergency 24/7 Hotlines",
    description: "For critical life-safety emergencies (lift entrapment, major water leaks, fire), directly dial the Estate Office or Security Gate with urgent response SLAs.",
    targetSelector: ".resident-issues-page .mb-4.p-3.rounded-3, div:has(> div > .lucide-shield-alert), .manager-section:first-of-type",
  },
  {
    id: "res-issues-raise",
    tab: "Issue Raising",
    route: "/resident/issueRaising",
    badge: "Step 6 of 8 · Issue Raising",
    title: "6. Raise a Maintenance Ticket",
    description: "Report household repairs (plumbing, electrical) or community concerns. Click 'Raise an Issue', attach photos from your phone, and track your assigned technician.",
    targetSelector: ".manager-section__header-actions button, button:has(.bi-plus-lg), .manager-action-btn",
  },

  // ================= COMMON SPACE =================
  {
    id: "res-bookings-reserve",
    tab: "Common Space",
    route: "/resident/commonSpace",
    badge: "Step 7 of 8 · Common Space",
    title: "7. Reserve Amenities & Clubhouses",
    description: "Check live slot availability and reserve community amenities like the tennis court, swimming pool, party hall, or clubhouse with zero double-booking conflicts.",
    targetSelector: ".manager-section__header-actions button, .ue-stat-grid, .manager-section:first-of-type",
  },

  // ================= PAYMENTS =================
  {
    id: "res-payments-pay",
    tab: "Payments",
    route: "/resident/payments",
    badge: "Step 8 of 8 · Payments",
    title: "8. Pay Maintenance via Razorpay",
    description: "View your monthly maintenance invoices and pay dues securely through Razorpay using UPI, debit/credit cards, or netbanking with instant digital receipts.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type, .table-container, main",
  },
];

export const ResidentTour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Load persistence state from sessionStorage
  const [isActive, setIsActive] = useState(() => {
    return sessionStorage.getItem("ue:resident-tour-active") === "1";
  });

  const [currentStepIdx, setCurrentStepIdx] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("ue:resident-tour-step") || "0", 10);
    return isNaN(saved) || saved < 0 ? 0 : Math.min(saved, RESIDENT_STEPS.length - 1);
  });

  const [popoverStyle, setPopoverStyle] = useState({
    top: 84,
    left: Math.max(16, (typeof window !== "undefined" ? window.innerWidth - 440 : 800)),
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
    sessionStorage.removeItem("ue:resident-tour-active");
    sessionStorage.removeItem("ue:resident-tour-step");
    clearTargetHighlight();
    clearNavbarHighlight();
    setIsActive(false);
    setCurrentStepIdx(0);
  }, [clearTargetHighlight, clearNavbarHighlight]);

  // Navigate & Jump to Step
  const goToStep = useCallback((idx) => {
    if (idx < 0 || idx >= RESIDENT_STEPS.length) {
      endTour();
      return;
    }

    const step = RESIDENT_STEPS[idx];
    setIsActive(true);
    setCurrentStepIdx(idx);
    sessionStorage.setItem("ue:resident-tour-active", "1");
    sessionStorage.setItem("ue:resident-tour-step", String(idx));

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

    const step = RESIDENT_STEPS[currentStepIdx] || RESIDENT_STEPS[0];
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

    window.addEventListener("ue:start-resident-tour", handleStartTour);
    return () => {
      window.removeEventListener("ue:start-resident-tour", handleStartTour);
    };
  }, [goToStep]);

  if (!isActive) return null;

  const currentStep = RESIDENT_STEPS[currentStepIdx] || RESIDENT_STEPS[0];
  const isLastStep = currentStepIdx === RESIDENT_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      endTour();
    } else {
      goToStep(currentStepIdx + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      goToStep(currentStepIdx - 1);
    }
  };

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
        aria-label="Resident Walkthrough"
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

        {/* Header with Step Badge & Progress Dots */}
        <div className="ue-tour-card__header">
          <span className="ue-tour-card__badge">{currentStep.badge}</span>
          <div className="ue-tour-card__dots" title="Step indicators">
            {RESIDENT_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ue-tour-dot ${i === currentStepIdx ? "is-active" : i < currentStepIdx ? "is-completed" : ""}`}
                onClick={() => goToStep(i)}
                aria-label={`Jump to step ${i + 1}`}
                title={`Step ${i + 1}: ${RESIDENT_STEPS[i].title}`}
              />
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="ue-tour-card__title">{currentStep.title}</h4>
        <p className="ue-tour-card__desc">{currentStep.description}</p>

        {/* Footer Navigation Buttons */}
        <div className="ue-tour-card__footer">
          <button type="button" className="ue-tour-btn-skip" onClick={endTour}>
            End Tour
          </button>
          <div className="ue-tour-card__nav-btns">
            <button
              type="button"
              className="ue-tour-btn ue-tour-btn-back"
              onClick={handleBack}
              disabled={currentStepIdx === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="ue-tour-btn ue-tour-btn-next"
              onClick={handleNext}
            >
              {isLastStep ? "Finish Tour" : "Next \u2192"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResidentTour;
