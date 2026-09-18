import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/ManagerTour.css";

export const MANAGER_STEPS = [
  // ================= DASHBOARD =================
  {
    id: "dash-actions",
    tab: "Dashboard",
    route: "/manager/dashboard",
    badge: "Step 1 of 10 · Dashboard",
    targetLabel: "Quick-Action Controls",
    title: "1. Quick-Action Controls",
    description: "Launch frequent operational tasks instantly: click 'Add Resident' to onboard occupants, 'Create Due' to bill flats, or 'Approve Booking' to process reservations without digging into sub-menus.",
    targetSelector: ".manager-hero__actions, .manager-hero button",
  },
  {
    id: "dash-stats",
    tab: "Dashboard",
    route: "/manager/dashboard",
    badge: "Step 2 of 10 · Dashboard",
    targetLabel: "Live Operational Vitals",
    title: "2. Real-Time Operations Metrics",
    description: "Monitor community vitals live: resident population, on-duty technicians, open maintenance tickets, today's visitor entries, and overdue maintenance dues.",
    targetSelector: ".manager-ops-strip, .ue-stat-grid",
  },
  {
    id: "dash-analytics",
    tab: "Dashboard",
    route: "/manager/dashboard",
    badge: "Step 3 of 10 · Dashboard",
    targetLabel: "Operations Analytics",
    title: "3. Operations Analytics & Trends",
    description: "Review financial collections vs overdue amounts, monitor resolution trends, and apply date-range filters to inspect historical community performance.",
    targetSelector: ".manager-dashboard-shell section:has(.dateRangeFilter), .dateRangeFilter, .manager-dashboard-charts, .manager-dashboard-grid",
  },

  // ================= USERS & DIRECTORY =================
  {
    id: "users-tabs",
    tab: "Users",
    route: "/manager/userManagement",
    badge: "Step 4 of 10 · Users",
    targetLabel: "Directory Role Switcher",
    title: "4. Directory Role Switcher",
    description: "Filter and manage all community accounts. Switch seamlessly between Residents, Flat Registration Codes, Security Staff, and Technicians.",
    targetSelector: ".manager-toolbar .ue-tabs, .ue-tabs",
  },
  {
    id: "users-codes",
    tab: "Users",
    route: "/manager/userManagement",
    badge: "Step 5 of 10 · Users",
    targetLabel: "Registration Codes",
    title: "5. Flat Registration Codes (UE-XXXX)",
    description: "Click 'View Codes' to review and copy 6-character registration codes for every flat. Provide these codes to residents for secure self-registration into their assigned units.",
    targetSelector: "button:has(.lucide-key), .manager-section__header-actions, .manager-action-btn",
  },

  // ================= ISSUES DESK =================
  {
    id: "issues-analytics",
    tab: "Issues",
    route: "/manager/issueResolving",
    badge: "Step 6 of 10 · Issues",
    targetLabel: "Issue Analytics & Mix",
    title: "6. Urgency & Status Analytics",
    description: "Analyze workload trends before assigning jobs: inspect status distributions (Pending, Assigned, In Progress, Resolved) and urgency breakdowns (Urgent, High, Normal, Low).",
    targetSelector: ".manager-ui-two-column, .manager-section:first-of-type, .manager-ui-stat-grid",
  },

  // ================= BOOKINGS =================
  {
    id: "bookings-facilities",
    tab: "Bookings",
    route: "/manager/commonSpace",
    badge: "Step 7 of 10 · Bookings",
    targetLabel: "Facility Inventory",
    title: "7. Facility Inventory & Setup",
    description: "Manage your community's bookable amenities (Clubhouse, Tennis Court, Swimming Pool, Party Hall). Define opening hours, capacity, and slot pricing rules.",
    targetSelector: ".manager-section__header-actions, .ue-stat-grid, .manager-section:first-of-type",
  },
  {
    id: "bookings-approvals",
    tab: "Bookings",
    route: "/manager/commonSpace",
    badge: "Step 8 of 10 · Bookings",
    targetLabel: "Reservation Requests",
    title: "8. Conflict-Free Booking Approvals",
    description: "Review incoming resident reservation requests. Click 'Approve' or 'Cancel / Refund' with automated slot conflict prevention.",
    targetSelector: ".manager-toolbar, .manager-record-grid, .manager-section:nth-of-type(2), main",
  },

  // ================= PAYMENTS =================
  {
    id: "payments-metrics",
    tab: "Payments",
    route: "/manager/payments",
    badge: "Step 9 of 10 · Payments",
    targetLabel: "Collections & Dues",
    title: "9. Maintenance Collections & Dues",
    description: "Monitor financial totals at a glance: total transaction volume, pending maintenance dues, and recovered payments across your community.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type",
  },

  // ================= SETUP =================
  {
    id: "setup-builder",
    tab: "Setup",
    route: "/manager/setup",
    badge: "Step 10 of 10 · Setup",
    targetLabel: "Society Structure Builder",
    title: "10. Society Structure Builder",
    description: "Define building blocks (e.g. Block A, Tower 1), number of floors, and flats per floor. This structure automatically maps resident registrations to physical units.",
    targetSelector: ".manager-page-shell, .manager-section, .manager-record-grid, main",
  },
];

export const ManagerTour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Load persistence state from sessionStorage
  const [isActive, setIsActive] = useState(() => {
    return sessionStorage.getItem("ue:manager-tour-active") === "1";
  });

  const [currentStepIdx, setCurrentStepIdx] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("ue:manager-tour-step") || "0", 10);
    return isNaN(saved) || saved < 0 ? 0 : Math.min(saved, MANAGER_STEPS.length - 1);
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
    sessionStorage.removeItem("ue:manager-tour-active");
    sessionStorage.removeItem("ue:manager-tour-step");
    clearTargetHighlight();
    clearNavbarHighlight();
    setIsActive(false);
    setCurrentStepIdx(0);
  }, [clearTargetHighlight, clearNavbarHighlight]);

  // Navigate & Jump to Step
  const goToStep = useCallback((idx) => {
    if (idx < 0 || idx >= MANAGER_STEPS.length) {
      endTour();
      return;
    }

    const step = MANAGER_STEPS[idx];
    setIsActive(true);
    setCurrentStepIdx(idx);
    sessionStorage.setItem("ue:manager-tour-active", "1");
    sessionStorage.setItem("ue:manager-tour-step", String(idx));

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

    const step = MANAGER_STEPS[currentStepIdx] || MANAGER_STEPS[0];
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

    window.addEventListener("ue:start-manager-tour", handleStartTour);
    return () => {
      window.removeEventListener("ue:start-manager-tour", handleStartTour);
    };
  }, [goToStep]);

  if (!isActive) return null;

  const currentStep = MANAGER_STEPS[currentStepIdx] || MANAGER_STEPS[0];
  const isLastStep = currentStepIdx === MANAGER_STEPS.length - 1;

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
        aria-label="Feature Walkthrough"
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
            {MANAGER_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ue-tour-dot ${i === currentStepIdx ? "is-active" : i < currentStepIdx ? "is-completed" : ""}`}
                onClick={() => goToStep(i)}
                aria-label={`Jump to step ${i + 1}`}
                title={`Step ${i + 1}: ${MANAGER_STEPS[i].title}`}
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

export default ManagerTour;
