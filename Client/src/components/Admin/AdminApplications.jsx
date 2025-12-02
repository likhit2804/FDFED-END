import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Eye,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from "./Card";
import Tabs from "./Tabs";
import Status from "./Status";

export default function ManagerApplications() {
  // ===== State Management =====
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : "http://localhost:3000/admin/api";

  // ===== Fetch Applications =====
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/interests`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          window.location.href = "/adminLogin";
          return;
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const formatted = json.data.map((app) => ({
            id: app._id,
            name: app.name,
            email: app.email,
            phone: app.phone,
            community: app.community?.name || "N/A",
            location: app.community?.location || "Unknown",
            message: app.message || "",
            appliedOn: new Date(app.createdAt).toLocaleDateString("en-IN"),
            status: app.status?.toUpperCase() || "PENDING",
            photos: app.photos || [],
          }));
          setApplications(formatted);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        console.error("Error fetching manager applications:", err);
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // ===== Derived Stats =====
  const total = applications.length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const pending = applications.filter((a) => a.status === "PENDING").length;

  // ===== Tab Filtering =====
  const filteredApps = useMemo(() => {
    return activeTab === "All"
      ? applications
      : applications.filter(
          (a) => a.status.toUpperCase() === activeTab.toUpperCase()
        );
  }, [activeTab, applications]);

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
        {loading ? (
          <div className="text-center py-5 text-muted fw-semibold">
            Loading applications...
          </div>
        ) : error ? (
          <div className="text-center text-danger py-5">{error}</div>
        ) : (
          filteredApps.map((app) => (
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
                <Status status={app.status} />
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
          ))
        )}
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