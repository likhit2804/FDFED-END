import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  X,
  Eye,
  Users,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  Send,
  Check
} from "lucide-react";
// Spinner component
const Spinner = ({ size = 16 }) => (
  <div
    style={{
      width: size,
      height: size,
      border: "2px solid #ffffff30",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block",
    }}
  />
);
// Add CSS animation
const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes slideInDown {
  0% {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
`;
// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinAnimation;
  document.head.appendChild(style);
}
import Header from "./Header";
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
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', or 'resend'
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ===== Fetch Applications =====
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/admin/api/interests");
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/adminLogin";
          return;
        }
        const json = res.data;
        if (json.success && Array.isArray(json.data)) {
          const formatted = json.data.map((app) => ({
            id: app._id,
            name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || "Unknown",
            email: app.email,
            phone: app.phone,
            communityName: app.communityName || "N/A",
            location: app.location || "Unknown",
            description: app.description || "",
            appliedOn: new Date(app.createdAt).toLocaleDateString("en-IN"),
            status: app.status?.toUpperCase() || "PENDING",
            photos: app.photos || [],
            approvedBy: app.approvedBy?.name || null,
            rejectedBy: app.rejectedBy?.name || null,
            rejectionReason: app.rejectionReason || null,
            approvedAt: app.approvedAt ? new Date(app.approvedAt).toLocaleDateString("en-IN") : null,
            rejectedAt: app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString("en-IN") : null,
            paymentStatus: app.paymentStatus || 'pending',
            // Computed status for UI
            uiStatus: (app.status?.toUpperCase() === 'APPROVED' && (!app.paymentStatus || app.paymentStatus === 'pending'))
              ? 'AWAITING PAYMENT'
              : ((app.paymentStatus === 'completed') ? 'COMPLETED' : (app.status?.toUpperCase() || "PENDING"))
          }));
          setApplications(formatted);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/adminLogin";
          return;
        }
        console.error("Error fetching manager applications:", err);
        setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // ===== Approval Function =====
  const handleApprove = async (appId) => {
    try {
      setActionLoading(appId);
      setActionType('approve');
      const res = await axios.post(`/admin/api/interests/${appId}/approve`);
      if (res.data?.success) {
        const paymentLink = res.data?.data?.paymentLink;
        setApplications(prev =>
          prev.map(app =>
            app.id === appId
              ? { ...app, status: "APPROVED", uiStatus: "AWAITING PAYMENT", paymentStatus: "pending", paymentLink }
              : app
          )
        );
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(prev => ({
            ...prev,
            status: "APPROVED",
            uiStatus: "AWAITING PAYMENT",
            paymentStatus: "pending",
            paymentLink
          }));
        }
        setError("");
        setSuccessMessage("Application approved! Onboarding payment link generated and sent to applicant.");
        setTimeout(() => setSuccessMessage(""), 6000);
      } else {
        setError(res.data?.message || "Failed to approve application");
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.response?.data?.message || err.message || "Error approving application");
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  // ===== Rejection Function =====
  const handleReject = async (appId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    try {
      setActionLoading(appId);
      setActionType('reject');
      const res = await axios.post(`/admin/api/interests/${appId}/reject`, { reason: rejectionReason.trim() });
      if (res.data?.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === appId
              ? { ...app, status: "REJECTED", uiStatus: "REJECTED", rejectionReason: rejectionReason.trim() }
              : app
          )
        );
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(prev => ({
            ...prev,
            status: "REJECTED",
            uiStatus: "REJECTED",
            rejectionReason: rejectionReason.trim()
          }));
        }
        setShowRejectModal(false);
        setRejectionReason("");
        setError("");
        setSuccessMessage("Application rejected successfully! Rejection notice sent to applicant.");
        setTimeout(() => setSuccessMessage(""), 6000);
      } else {
        setError(res.data?.message || "Failed to reject application");
      }
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.response?.data?.message || err.message || "Error rejecting application");
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };
  // ===== Derived Stats =====
  const total = applications.length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const pending = applications.filter((a) => a.status === "PENDING").length;
  // ===== Tab Filtering =====
  const filteredApps = useMemo(() => {
    if (activeTab === "All") return applications;
    return applications.filter((a) => {
      // Map tab names to status checks
      if (activeTab === "Approved") return a.status === "APPROVED" && a.paymentStatus !== "pending"; // Legacy
      if (activeTab === "Completed") return a.paymentStatus === "completed";
      if (activeTab === "Awaiting Payment") return a.uiStatus === "AWAITING PAYMENT";
      return a.uiStatus === activeTab.toUpperCase() || a.status === activeTab.toUpperCase();
    });
  }, [activeTab, applications]);
  // ===== Inline Styles =====
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      width: "100%",
    },
    listPane: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    },
    cardItem: {
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
      padding: "14px 18px",
      cursor: "pointer",
      borderLeft: "4px solid transparent",
      transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "6px",
    },
    name: { fontWeight: 600, fontSize: "15px", color: "#0f172a" },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <Header title="Community Manager Applications" />

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: "10px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#065f46",
            fontSize: "14px",
            fontWeight: "500",
            animation: "slideInDown 0.3s ease",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={20} color="#10b981" />
            <span>{successMessage}</span>
          </div>
          <X
            size={18}
            style={{ cursor: "pointer", opacity: 0.7 }}
            onClick={() => setSuccessMessage("")}
          />
        </div>
      )}

      {/* Error Notification Banner */}
      {error && !loading && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#991b1b",
            fontSize: "14px",
            fontWeight: "500",
            animation: "slideInDown 0.3s ease",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={20} color="#ef4444" />
            <span>{error}</span>
          </div>
          <X
            size={18}
            style={{ cursor: "pointer", opacity: 0.7 }}
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* ===== Applications List Section ===== */}
      <div style={styles.listPane}>
        {/* === Summary Cards (Occupy full horizontal width) === */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            width: "100%",
            marginBottom: "6px",
          }}
        >
          <Card
            icon={<Users size={20} />}
            value={total}
            label="Total Applications"
            borderColor="#3b82f6"
          />
          <Card
            icon={<ClipboardCheck size={20} />}
            value={approved}
            label="Approved"
            borderColor="#22c55e"
          />
          <Card
            icon={<Clock size={20} />}
            value={pending}
            label="Pending"
            borderColor="#fbbf24"
          />
        </div>

        {/* === Tabs === */}
        <Tabs
          options={["All", "Pending", "Awaiting Payment", "Completed", "Rejected"]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* === Applications List === */}
        {loading ? (
          <div className="text-center py-5 text-muted fw-semibold">
            <Spinner size={24} />
            <div style={{ marginTop: "12px" }}>Loading applications...</div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "48px 24px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              color: "#64748b",
            }}
          >
            <ClipboardCheck size={40} style={{ opacity: 0.4, marginBottom: "12px" }} />
            <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", margin: 0 }}>
              No applications found
            </h4>
            <p style={{ fontSize: "14px", margin: "6px 0 0 0" }}>
              There are no applications matching the "{activeTab}" filter.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              style={{
                ...styles.cardItem,
                borderLeftColor:
                  app.uiStatus === "COMPLETED" || app.status === "ONBOARDED"
                    ? "#22c55e" // Green
                    : app.uiStatus === "AWAITING PAYMENT"
                      ? "#3b82f6" // Blue
                      : app.status === "PENDING"
                        ? "#fbbf24" // Yellow
                        : "#ef4444", // Red
              }}
              onClick={() => {
                setSelectedApp(app);
                setActivePhoto(app.photos?.[0] || null);
              }}
            >
              <div style={styles.headerRow}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.name}>{app.name}</div>
                </div>
                <Status status={app.uiStatus || app.status} />
              </div>

              <div style={{ fontSize: "14px", color: "#64748b", margin: "4px 0" }}>
                {app.email} · {app.phone}
              </div>
              <div style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>
                {app.communityName} — <span style={{ color: "#64748b", fontWeight: "400" }}>{app.location}</span>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f8fafc",
                  paddingTop: "8px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  Applied on {app.appliedOn}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
                  {app.status === "PENDING" && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={actionLoading === app.id}
                      style={{
                        backgroundColor: "#22c55e",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: actionLoading === app.id ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {actionLoading === app.id && actionType === 'approve' ? (
                        <>
                          <Spinner size={12} />
                          Approving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setActivePhoto(app.photos?.[0] || null);
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#1e293b",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <Eye size={14} color="#2563eb" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Application Details Modal ===== */}
      {selectedApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "16px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setSelectedApp(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "18px",
                  }}
                >
                  {selectedApp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                    {selectedApp.name}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                    Applied on {selectedApp.appliedOn}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Status status={selectedApp.uiStatus || selectedApp.status} />
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "6px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {/* Information Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                    <Mail size={14} color="#3b82f6" /> Email Address
                  </div>
                  <a
                    href={`mailto:${selectedApp.email}`}
                    style={{ color: "#0f172a", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}
                  >
                    {selectedApp.email}
                  </a>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                    <Phone size={14} color="#3b82f6" /> Phone Number
                  </div>
                  <a
                    href={`tel:${selectedApp.phone}`}
                    style={{ color: "#0f172a", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}
                  >
                    {selectedApp.phone}
                  </a>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                    <Building2 size={14} color="#3b82f6" /> Proposed Community
                  </div>
                  <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: "600" }}>
                    {selectedApp.communityName}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                    <MapPin size={14} color="#3b82f6" /> Location
                  </div>
                  <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: "500" }}>
                    {selectedApp.location}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {selectedApp.description && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                    Community Overview & Requirements
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#334155",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedApp.description}
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {selectedApp.photos && selectedApp.photos.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                    Community Photos ({selectedApp.photos.length})
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "12px",
                    }}
                  >
                    {selectedApp.photos.map((photoUrl, index) => (
                      <div
                        key={index}
                        onClick={() => setActivePhoto(photoUrl)}
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: activePhoto === photoUrl ? "3px solid #3b82f6" : "2px solid #e2e8f0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <img
                          src={photoUrl}
                          alt={`Community Photo ${index + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Active Photo Preview */}
                  {activePhoto && (
                    <div
                      style={{
                        width: "100%",
                        maxHeight: "320px",
                        overflow: "hidden",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={activePhoto}
                        alt="Enlarged preview"
                        style={{ maxWidth: "100%", maxHeight: "320px", objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Approval/Payment Details */}
              {selectedApp.status === "APPROVED" && (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ color: "#166534", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <CheckCircle2 size={16} /> Application Approved
                    {selectedApp.approvedBy ? ` by ${selectedApp.approvedBy}` : ""}
                    {selectedApp.approvedAt ? ` on ${selectedApp.approvedAt}` : ""}
                  </div>
                  <div style={{ color: "#15803d", fontSize: "13px" }}>
                    Status: <strong>{selectedApp.uiStatus}</strong> (Payment: {selectedApp.paymentStatus})
                  </div>
                </div>
              )}

              {/* Rejection Details */}
              {selectedApp.status === "REJECTED" && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ color: "#991b1b", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <XCircle size={16} /> Application Rejected
                    {selectedApp.rejectedBy ? ` by ${selectedApp.rejectedBy}` : ""}
                    {selectedApp.rejectedAt ? ` on ${selectedApp.rejectedAt}` : ""}
                  </div>
                  {selectedApp.rejectionReason && (
                    <div style={{ color: "#7f1d1d", fontSize: "13px", marginTop: "6px" }}>
                      <strong>Reason:</strong> {selectedApp.rejectionReason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #f1f5f9",
                backgroundColor: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Close
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                {selectedApp.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading === selectedApp.id}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "9px 18px",
                        borderRadius: "8px",
                        cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={actionLoading === selectedApp.id}
                      style={{
                        backgroundColor: "#22c55e",
                        color: "white",
                        border: "none",
                        padding: "9px 22px",
                        borderRadius: "8px",
                        cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {actionLoading === selectedApp.id && actionType === 'approve' ? (
                        <>
                          <Spinner size={16} />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Approve Application
                        </>
                      )}
                    </button>
                  </>
                )}

                {selectedApp.uiStatus === "AWAITING PAYMENT" && (
                  <button
                    onClick={async () => {
                      try {
                        setActionLoading(selectedApp.id);
                        setActionType('resend');
                        const res = await axios.post(`/admin/api/interests/${selectedApp.id}/resend-link`);
                        if (res.data?.success) {
                          setSuccessMessage("Onboarding payment link resent successfully!");
                          setTimeout(() => setSuccessMessage(""), 6000);
                        } else {
                          setError(res.data?.message || "Failed to resend link");
                        }
                      } catch (err) {
                        setError(err.response?.data?.message || err.message || "Error resending link");
                      } finally {
                        setActionLoading(null);
                        setActionType(null);
                      }
                    }}
                    disabled={actionLoading === selectedApp.id}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "9px 18px",
                      borderRadius: "8px",
                      cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {actionLoading === selectedApp.id && actionType === 'resend' ? (
                      <>
                        <Spinner size={16} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Resend Payment Link
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Rejection Modal ===== */}
      {showRejectModal && selectedApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => {
            setShowRejectModal(false);
            setRejectionReason("");
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "14px",
              width: "500px",
              maxWidth: "92vw",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: "17px", fontWeight: "700" }}>
                  Reject Application
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              You are about to reject the application for <strong>{selectedApp.name}</strong> ({selectedApp.communityName}).
              Please provide a clear reason for the applicant.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "13px", color: "#334155" }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this community application cannot be approved at this time..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedApp.id)}
                disabled={actionLoading === selectedApp.id || !rejectionReason.trim()}
                style={{
                  backgroundColor: actionLoading === selectedApp.id || !rejectionReason.trim() ? "#9ca3af" : "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedApp.id || !rejectionReason.trim() ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {actionLoading === selectedApp.id && actionType === 'reject' ? (
                  <>
                    <Spinner size={14} />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
