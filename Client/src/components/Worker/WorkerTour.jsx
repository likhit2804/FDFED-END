import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/ManagerTour.css";

export const WORKER_STEPS = [
  // ================= DASHBOARD =================
  {
    id: "wrk-dash-stats",
    tab: "Dashboard",
    route: "/worker/dashboard",
    badge: "Step 1 of 5 · Dashboard",
    title: "1. Work Progress & Efficiency",
    description: "Track your real-time completion pace, assigned tickets, in-progress jobs, and weekly work efficiency score in one unified dashboard.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type",
  },

  // ================= TASKS =================
  {
    id: "wrk-tasks-workbench",
    tab: "Tasks",
    route: "/worker/tasks",
    badge: "Step 2 of 5 · Tasks",
    title: "2. Task Workbench & Status Control",
    description: "View all maintenance tickets assigned to your trade. Click to start work, update repair progress, or mark jobs resolved upon completion.",
    targetSelector: ".worker-tasks-section, .ue-stat-grid, .manager-section:first-of-type",
  },
  {
    id: "wrk-tasks-filters",
    tab: "Tasks",
    route: "/worker/tasks",
    badge: "Step 3 of 5 · Tasks",
    title: "3. Search, Priority & Grid Controls",
    description: "Quickly locate urgent repairs using status and priority filters, search by flat or location, and toggle between grid and list layouts.",
    targetSelector: "div:has(> .search-bar, > .manager-toolbar, > input), .worker-tasks-section .ue-stat-grid + div, .manager-section:first-of-type",
  },

  // ================= HISTORY =================
  {
    id: "wrk-history-reviews",
    tab: "History",
    route: "/worker/history",
    badge: "Step 4 of 5 · History",
    title: "4. Work History & Resident Ratings",
    description: "Review your completed maintenance tickets, inspection notes, and star feedback ratings received from residents.",
    targetSelector: ".ue-stat-grid, .manager-section:first-of-type, .manager-ui-record-grid, main",
  },

  // ================= LEAVES =================
  {
    id: "wrk-leaves-apply",
    tab: "Leaves",
    route: "/worker/leaves",
    badge: "Step 5 of 5 · Leaves",
    title: "5. Leave Application & Approval Status",
    description: "Apply for scheduled time-off, track manager approval status in real time, and monitor your remaining leave balances.",
    targetSelector: ".manager-section__header-actions button, button:has(.lucide-plus), .ue-stat-grid, .manager-section:first-of-type",
  },
];

export const WorkerTour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isActive, setIsActive] = useState(() => {
    return sessionStorage.getItem("ue:worker-tour-active") === "1";
  });

  const [currentStepIdx, setCurrentStepIdx] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("ue:worker-tour-step") || "0", 10);
    return isNaN(saved) || saved < 0 ? 0 : Math.min(saved, WORKER_STEPS.length - 1);
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
    sessionStorage.removeItem("ue:worker-tour-active");
    sessionStorage.removeItem("ue:worker-tour-step");
    clearTargetHighlight();
    clearNavbarHighlight();
    setIsActive(false);
    setCurrentStepIdx(0);
  }, [clearTargetHighlight, clearNavbarHighlight]);

  // Navigate & Jump to Step
  const goToStep = useCallback((idx) => {
    if (idx < 0 || idx >= WORKER_STEPS.length) {
      endTour();
      return;
    }

    const step = WORKER_STEPS[idx];
    setIsActive(true);
    setCurrentStepIdx(idx);
    sessionStorage.setItem("ue:worker-tour-active", "1");
    sessionStorage.setItem("ue:worker-tour-step", String(idx));

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

    const step = WORKER_STEPS[currentStepIdx] || WORKER_STEPS[0];
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

    window.addEventListener("ue:start-worker-tour", handleStartTour);
    return () => {
      window.removeEventListener("ue:start-worker-tour", handleStartTour);
    };
  }, [goToStep]);

  if (!isActive) return null;

  const currentStep = WORKER_STEPS[currentStepIdx] || WORKER_STEPS[0];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === WORKER_STEPS.length - 1;

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
        aria-label="Worker Walkthrough"
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
            {WORKER_STEPS.map((step, idx) => (
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

export default WorkerTour;
