import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import logo from "../imgs/Logo.png";
import "../assets/css/Navbar.css";
import { logout } from "../slices/authSlice";

const NAV_ITEMS = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
  ],
  Resident: [
    { to: "/resident/dashboard", label: "Dashboard" },
    { to: "/resident/preApproval", label: "Pre Approval" },
    { to: "/resident/issueRaising", label: "Issue Raising" },
    { to: "/resident/commonSpace", label: "Common Space" },
    { to: "/resident/payments", label: "Payments" },
  ],
  Worker: [
    { to: "/worker/dashboard", label: "Dashboard" },
    { to: "/worker/history", label: "History" },
    { to: "/worker/tasks", label: "Tasks" },
  ],
  manager: [
    { to: "/manager/dashboard", label: "Dashboard" },
    { to: "/manager/userManagement", label: "Users" },
    { to: "/manager/issueResolving", label: "Issues" },
    { to: "/manager/commonSpace", label: "Bookings" },
    { to: "/manager/payments", label: "Payments" },
    { to: "/manager/advertisement", label: "Ads" },
    { to: "/manager/leaves", label: "Leaves" },
    { to: "/manager/setup", label: "Setup" },
  ],
  security: [
    { to: "/security/dashboard", label: "Dashboard" },
    { to: "/security/visitorManagement", label: "Visitors" },
    { to: "/security/preapproval", label: "Preapproval" },
  ],
};

export const Navbar = ({ userType }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const links = useMemo(() => NAV_ITEMS[userType] || [], [userType]);
  const profileRoute = useMemo(() => {
    if (userType === "manager") return "/manager/profile";
    if (userType === "Resident") return "/resident/profile";
    if (userType === "Worker") return "/worker/profile";
    if (userType === "security") return "/security/profile";
    if (userType === "admin") return "/admin/profile";
    return "/";
  }, [userType]);

  const displayName = useMemo(() => {
    if (!user) return "Profile";
    return (
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      [user.residentFirstname, user.residentLastname].filter(Boolean).join(" ") ||
      [user.managerFirstname, user.managerLastname].filter(Boolean).join(" ") ||
      user.email ||
      "Profile"
    );
  }, [user]);

  const avatarSrc = user?.image || user?.profilePic || user?.avatar || user?.photo || "";
  const avatarFallback = (displayName || "P").trim().charAt(0).toUpperCase();

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/SignIn");
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <div className="app-navbar__brand-row">
          <NavLink to={links[0]?.to || "/"} className="app-navbar__brand" aria-label="UrbanEase home">
            <img src={logo} alt="UrbanEase" />
          </NavLink>

          <div className="app-navbar__controls">
            <button
              type="button"
              className="app-navbar__menu-toggle"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className={`app-navbar__panel${menuOpen ? " is-open" : ""}`}>
          <nav className="app-navbar__nav" aria-label={`${userType || "App"} navigation`}>
            {links.length > 0 ? (
              links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-navbar__link${isActive ? " is-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))
            ) : (
              <span className="app-navbar__empty">No links available</span>
            )}
          </nav>

          <div className="app-navbar__profile" ref={profileRef}>
            <button
              type="button"
              className="app-navbar__profile-toggle"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="app-navbar__avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} className="app-navbar__avatar-img" />
                ) : (
                  <span className="app-navbar__avatar-fallback">{avatarFallback}</span>
                )}
              </span>
              <span className="app-navbar__profile-copy">
                <strong>{displayName}</strong>
                <small>{user?.email || "Account"}</small>
              </span>
              <ChevronDown size={16} className={`app-navbar__profile-chevron${profileOpen ? " is-open" : ""}`} />
            </button>

            <div className={`app-navbar__profile-menu${profileOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="app-navbar__profile-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate(profileRoute);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                className="app-navbar__profile-item app-navbar__profile-item--danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
