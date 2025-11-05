import React, { useState } from "react";
import {
  LayoutGrid,
  Users,
  UserCog,
  FileText,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
} from "lucide-react";

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);

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

  const handleClick = (path) => {
    // Simple redirect — you can replace with useNavigate later if needed
    window.location.href = path;
  };

  return (
    <aside
      className="position-fixed d-flex flex-column"
      style={{
        top: "20px",
        left: "20px",
        width: collapsed ? "80px" : "260px",
        height: "calc(100vh - 40px)",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "20px",
        boxShadow: "6px 4px 20px rgba(0,0,0,0.15)",
        transition: "width 0.3s ease-in-out, left 0.3s ease-in-out",
        overflow: "hidden",
        zIndex: 1050,
        fontSize: "1rem",
      }}
    >
      {/* ===== Header (Logo + Toggle) ===== */}
      <div
        className="d-flex align-items-center justify-content-between"
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div>
            <h5 className="fw-bold m-0 text-white" style={{ fontSize: "1.2rem" }}>
              URBAN EASE
            </h5>
            <p style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: "white",
            border: "none",
          }}
        >
          <ChevronLeft
            size={18}
            style={{
              transition: "transform 0.3s ease",
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {/* ===== Navigation ===== */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: collapsed ? "12px 0" : "16px 12px",
          overflowY: "auto",
        }}
      >
        <ul className="nav flex-column gap-1 m-0">
          {navItems.map((item, index) => (
            <li key={index} className="nav-item">
              <button
                onClick={() => handleClick(item.path)}
                className="nav-link d-flex align-items-center rounded-3 w-100 text-start"
                style={{
                  background: "transparent",
                  color: "#f8fafc",
                  fontWeight: 500,
                  fontSize: "1rem",
                  letterSpacing: "0.3px",
                  transition: "background 0.2s, color 0.2s",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? "0" : "12px",
                  padding: collapsed ? "10px 0" : "10px 14px",
                  textAlign: collapsed ? "center" : "left",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1e293b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ===== Bottom Links ===== */}
      <div
        className="border-top"
        style={{
          padding: collapsed ? "10px 0" : "12px 14px",
          borderColor: "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        <ul className="nav flex-column gap-2 m-0">
          {bottomItems.map((item, index) => (
            <li key={index} className="nav-item">
              <button
                onClick={() => handleClick(item.path)}
                className="nav-link d-flex align-items-center rounded-3 w-100 text-start"
                style={{
                  background: "transparent",
                  color: "#f1f5f9",
                  fontWeight: 500,
                  fontSize: "1rem",
                  letterSpacing: "0.3px",
                  border: "none",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? "0" : "12px",
                  padding: collapsed ? "10px 0" : "10px 14px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1e293b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
