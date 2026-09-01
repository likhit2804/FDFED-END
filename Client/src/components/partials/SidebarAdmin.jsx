import { useEffect } from "react";
import {
  LayoutGrid,
  Users,
  FileText,
  CreditCard,
  Tag,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSidebar } from "../../context/AdminSidebarContext";
import logoWhite from "../../imgs/logo_N_white.png";
import logoWhiteCollapsed from "../../imgs/logo_white.png";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
export default function SidebarAdmin() {
  const {
    collapsed,
    toggleSidebar,
    activeTab,
    setActiveTab,
    hoveredItem,
    setHoveredItem,
  } = useSidebar();
  const { logout } = useAdminAuth();
  const navItems = [
    { icon: LayoutGrid, label: "Overview", path: "/admin/dashboard" },
    { icon: Users, label: "All Communities", path: "/admin/communities" },
    { icon: FileText, label: "Applications", path: "/admin/applications" },
    { icon: CreditCard, label: "Billing", path: "/admin/payments" },
    { icon: Tag, label: "Subscription Plans", path: "/admin/subscription-plans" },
  ];
  const bottomItems = [
    { icon: User, label: "My Profile", path: "/admin/profile" },
    { icon: LogOut, label: "Sign Out", path: "__logout__" },
  ];
  useEffect(() => {
    const currentPath = window.location.pathname;
    setActiveTab(currentPath);
  }, [setActiveTab]);
  const navigate = useNavigate();
  const handleClick = async (path) => {
    if (path === "__logout__") {
      await logout();
      // Use replace so back button doesn't return to admin
      window.location.replace("/adminLogin");
      return;
    }
    setActiveTab(path);
    navigate(path);
  };
  const renderNavItem = (item, index) => {
    const isActive =
      activeTab === item.path ||
      (item.path === "/admin/dashboard" && (activeTab === "/admin" || activeTab === "/admin/"));
    const isHovered = hoveredItem === item.path;
    const Icon = item.icon;
    return (
      <li key={index} style={{ position: "relative", margin: "4px 0" }}>
        <button
          onClick={() => handleClick(item.path)}
          onMouseEnter={() => setHoveredItem(item.path)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? "0" : "10px",
            padding: collapsed ? "9px 0" : "9px 12px",
            background: isActive
              ? "rgba(59, 130, 246, 0.15)"
              : isHovered
                ? "rgba(255,255,255,0.06)"
                : "transparent",
            color: isActive ? "#ffffff" : "#cbd5e1",
            fontWeight: isActive ? 600 : 500,
            fontSize: "0.88rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHovered && !isActive ? "translateX(3px)" : "none",
            position: "relative",
            overflow: "hidden",
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
                width: "3.5px",
                height: "60%",
                background: "#3b82f6",
                borderRadius: "0 3px 3px 0",
              }}
            />
          )}
          <Icon size={18} />
          {!collapsed && (
            <span
              style={{
                transition: "opacity 0.2s ease",
                opacity: collapsed ? 0 : 1,
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
                left: "62px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#1e293b",
                color: "#ffffff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.82rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.2s ease",
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
        top: "14px",
        left: "14px",
        width: collapsed ? "72px" : "210px",
        height: "calc(100vh - 28px)",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        transition:
          "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
        overflow: "hidden",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 1050,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with Logo + Chevron */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo wrapper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: collapsed ? "0" : "1",
          }}
        >
          <img
            src={collapsed ? logoWhiteCollapsed : logoWhite}
            alt="Urban Ease Logo"
            style={{
              height: "26px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            borderRadius: "4px",
            marginLeft: collapsed ? "0" : "6px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          padding: collapsed ? "10px 6px" : "12px 10px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </div>
      {/* Bottom Section */}
      <div
        style={{
          padding: collapsed ? "8px 6px" : "10px 10px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
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
