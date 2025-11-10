import React, { useEffect } from "react";
import {
  LayoutGrid,
  Users,
  UserCog,
  FileText,
  CreditCard,
  User,
  LogOut,
} from "lucide-react";
import { useSidebar } from "../../context/AdminSidebarContext";
import logoWhite from "../../imgs/logo_N_white.png";
import logoWhiteCollapsed from "../../imgs/logo_white.png";

export default function SidebarAdmin() {
  const {
    collapsed,
    toggleSidebar,
    activeTab,
    setActiveTab,
    hoveredItem,
    setHoveredItem,
  } = useSidebar();

  const navItems = [
    { icon: LayoutGrid, label: "Overview", path: "/admin/dashboard" },
    { icon: Users, label: "All Communities", path: "/admin/communities" },
    { icon: UserCog, label: "Managers", path: "/admin/managers" },
    { icon: FileText, label: "Applications", path: "/admin/applications" },
    { icon: CreditCard, label: "Billing", path: "/admin/payments" },
  ];

  const bottomItems = [
    { icon: User, label: "My Profile", path: "/admin/profile" },
    { icon: LogOut, label: "Sign Out", path: "/adminLogin" },
  ];

  // ✅ Fix active tab detection on reload
  useEffect(() => {
    const currentPath = window.location.pathname;
    setActiveTab(currentPath);
  }, [setActiveTab]);

  const handleClick = (path) => {
    setActiveTab(path);
    window.location.href = path; // ✅ redirect navigation
  };

  const renderNavItem = (item, index) => {
    const isActive = activeTab === item.path;
    const isHovered = hoveredItem === item.path;
    const Icon = item.icon;

    return (
      <li key={index} style={{ position: "relative", margin: "6px 0" }}>
        <button
          onClick={() => handleClick(item.path)}
          onMouseEnter={() => setHoveredItem(item.path)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? "0" : "12px",
            padding: collapsed ? "12px 0" : "12px 16px",
            background: isActive
              ? "rgba(59, 130, 246, 0.15)"
              : isHovered
              ? "rgba(255,255,255,0.05)"
              : "transparent",
            color: isActive ? "#ffffff" : "#cbd5e1",
            fontWeight: isActive ? 600 : 500,
            fontSize: "0.95rem",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
           
            transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHovered && !isActive ? "translateX(4px)" : "none",
            position: "relative",
            overflow: "hidden", // prevent internal text causing horizontal scroll
          }}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "60%",
                background: "#3b82f6",
                borderRadius: "0 4px 4px 0",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}
          <Icon size={20} />
          {!collapsed && (
            <span
              style={{
                            transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "translateX(-10px)" : "translateX(0)",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          )}

          {/* Tooltip for collapsed sidebar */}
          {collapsed && isHovered && (
            <div
              style={{
                position: "absolute",
                left: "70px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#1e293b",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                opacity: isHovered ? 1 : 0,
               transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              {item.label}
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        width: collapsed ? "80px" : "220px",
        height: "calc(100vh - 40px)",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        overflowY: "auto", // keep vertical scroll
        overflowX: "hidden", // ✅ hide horizontal scroll always
        zIndex: 1050,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "16px" : "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={collapsed ? logoWhiteCollapsed : logoWhite}
            alt="Urban Ease Logo"
            style={{
              height: "36px",
              width: "auto",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              objectFit: "contain",
              transform: collapsed ? "scale(0.9)" : "scale(1)",
            }}
          />
        </button>
      </div>

      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          padding: collapsed ? "12px 8px" : "16px 12px",
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          overflowX: "hidden", // ✅ hide horizontal scroll inside content too
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          padding: collapsed ? "10px 8px" : "12px 12px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {bottomItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </div>
    </aside>
  );
}
