import React, { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from "./Card";
import Tabs from "./Tabs";
import Status from "./Status"; // ✅ centralized badge

export default function ManagerApplications() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  // ===== Sample Data =====
  const applications = [
    {
      id: 1,
      name: "Srushanth Sadhu",
      email: "srushanthreddy.s23@iiits.in",
      phone: "1234567890",
      community: "AAA Residency",
      location: "Hyderabad",
      message: "Looking forward to managing the AAA community efficiently.",
      appliedOn: "October 17, 2025",
      status: "APPROVED", // ✅ normalized to uppercase for StatusBadge
      photos: [
        "https://picsum.photos/id/1011/400/300",
        "https://picsum.photos/id/1015/400/300",
        "https://picsum.photos/id/1016/400/300",
      ],
    },
    {
      id: 2,
      name: "Likhit Grandhe",
      email: "likhit.2804@gmail.com",
      phone: "9606590179",
      community: "SV Complex",
      location: "Tirupati",
      message: "I have 2 years of community management experience.",
      appliedOn: "October 17, 2025",
      status: "PENDING", // ✅ normalized
      photos: [
        "https://picsum.photos/id/1024/400/300",
        "https://picsum.photos/id/1025/400/300",
      ],
    },
  ];

  // ===== Derived Stats =====
  const total = applications.length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const pending = applications.filter((a) => a.status === "PENDING").length;

  // ===== Tab Filtering =====
  const filteredApps =
    activeTab === "All"
      ? applications
      : applications.filter((a) => a.status.toUpperCase() === activeTab.toUpperCase());

  // ===== Inline Styles =====
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #f8fafc, #eef2f7)",
      fontFamily: "Poppins, sans-serif",
      padding: "24px",
      gap: "24px",
    },
    listPane: {
      flex: "1 1 100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    previewPane: {
      flex: "1 1 40%",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "24px",
      overflowY: "auto",
      transition: "all 0.3s ease",
    },
    hiddenPreview: {
      flex: "1 1 0%",
      opacity: 0,
      pointerEvents: "none",
      transform: "translateX(50px)",
    },
    cardItem: {
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "20px",
      cursor: "pointer",
      borderLeft: "6px solid transparent",
      transition: "transform 0.2s ease, border 0.2s ease",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    name: { fontWeight: 600, fontSize: "18px", color: "#0f172a" },
  };

  return (
    <div style={styles.container}>
      {/* ===== Left Pane ===== */}
      <div style={styles.listPane}>
        <h2 style={{ fontWeight: 700, color: "#0f172a" }}>
          Community Manager Applications
        </h2>

        {/* === Summary Cards === */}
        <div
          className="d-flex flex-wrap"
          style={{ gap: "16px", marginBottom: "16px" }}
        >
          <Card
            icon={<Users />}
            value={total}
            label="Total Applications"
            borderColor="#3b82f6"
          />
          <Card
            icon={<ClipboardCheck />}
            value={approved}
            label="Approved"
            borderColor="#22c55e"
          />
          <Card
            icon={<Clock />}
            value={pending}
            label="Pending"
            borderColor="#fbbf24"
          />
        </div>

        {/* === Tabs === */}
        <Tabs
          options={["All", "Approved", "Pending"]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* === Applications List === */}
        {filteredApps.map((app) => (
          <div
            key={app.id}
            style={{
              ...styles.cardItem,
              borderLeftColor:
                app.status === "APPROVED"
                  ? "#22c55e"
                  : app.status === "PENDING"
                  ? "#fbbf24"
                  : "#ef4444",
            }}
            onClick={() => {
              setSelectedApp(app);
              setActivePhoto(app.photos[0]);
            }}
          >
            <div style={styles.headerRow}>
              <div style={styles.name}>{app.name}</div>
              <Status status={app.status} /> {/* ✅ uses shared badge */}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              {app.email} · {app.phone}
            </div>
            <div style={{ fontSize: "14px", color: "#475569" }}>
              {app.community} — {app.location}
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                Applied on {app.appliedOn}
              </div>
              <Eye size={18} color="#3b82f6" />
            </div>
          </div>
        ))}
      </div>

      {/* ===== Right Pane (Preview) ===== */}
      {selectedApp && (
        <div style={styles.previewPane}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {selectedApp.name}
            </h4>
            <X
              size={22}
              style={{ cursor: "pointer", color: "#64748b" }}
              onClick={() => setSelectedApp(null)}
            />
          </div>

          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Email:</strong> {selectedApp.email}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Phone:</strong> {selectedApp.phone}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Community:</strong> {selectedApp.community}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Location:</strong> {selectedApp.location}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Status:</strong> <Status status={selectedApp.status} />
          </div>
        </div>
      )}
    </div>
  );
}
