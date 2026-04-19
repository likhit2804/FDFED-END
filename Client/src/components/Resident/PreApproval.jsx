import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "react-day-picker/dist/style.css";

import { EntityCard, StatCard, Modal, Input, Select, EmptyState } from "../shared";
import { Loader } from "../Loader";
import { Calendar, Clock, QrCode, Users, XCircle } from "lucide-react";
import { ManagerActionButton, ManagerPageShell, ManagerSection } from "../shared/roleUI";

const LazyDayPicker = lazy(() =>
  import("react-day-picker").then((module) => ({ default: module.DayPicker })),
);

export function PreApproval() {
  const [visitors, setVisitors] = useState([]);
  const [counts, setCounts] = useState({ Approved: 0, Pending: 0, Rejected: 0 });
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ visitorName: "", contactNumber: "", purpose: "", dateOfVisit: "", timeOfVisit: "" });
  const [selectedVisitDate, setSelectedVisitDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const todayDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayIso = useMemo(() => todayDate.toISOString().split("T")[0], [todayDate]);
  const nowTimeForInput = useMemo(
    () => new Date().toTimeString().slice(0, 5),
    [form.dateOfVisit],
  );

  const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  async function loadVisitors() {
    try {
      const res = await axios.get("/resident/preApprovals");
      const data = res.data;
      if (!data.success) return;
      setVisitors(data.visitors || []);
      setCounts(data.counts || { Approved: 0, Pending: 0, Rejected: 0 });
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadVisitors(); }, []);

  async function cancelRequest(id) {
    if (!window.confirm("Cancel this visitor request?")) return;
    try {
      const res = await axios.delete(`/resident/preapproval/cancel/${id}`);
      const data = res.data;
      if (data.ok) loadVisitors();
    } catch (err) { console.error("Cancel error:", err); }
  }

  async function viewQR(id) {
    try {
      const res = await axios.get(`/resident/preapproval/qr/${id}`);
      const data = res.data;
      setQrImage(data.qrCodeBase64);
      setShowQR(true);
    } catch (err) { console.error("QR Fetch error:", err); }
  }

  function openPreApprovalForm() {
    setSelectedVisitDate(todayDate);
    setForm({
      visitorName: "",
      contactNumber: "",
      purpose: "",
      dateOfVisit: todayIso,
      timeOfVisit: "",
    });
    setShowForm(true);
  }

  function handleVisitDateSelect(day) {
    if (!day) return;
    const picked = new Date(day);
    picked.setHours(0, 0, 0, 0);
    setSelectedVisitDate(picked);
    setForm((previous) => ({ ...previous, dateOfVisit: toIsoDate(picked) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.dateOfVisit && form.dateOfVisit < todayIso) {
      alert("Date of visit cannot be in the past.");
      return;
    }
    try {
      const res = await axios.post("/resident/preapproval", form);
      const data = res.data;
      if (data.success) {
        setShowForm(false);
        setForm({ visitorName: "", contactNumber: "", purpose: "", dateOfVisit: "", timeOfVisit: "" });
        loadVisitors();
      }
    } catch (err) { console.error("Form submit error:", err); }
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
  const formatTime = (value) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A";

  return (
    <ManagerPageShell
      eyebrow="Pre Approval"
      title="Pre-approve visitors from one unified entry desk."
      description="Use the same shell, buttons, and cards as manager pages for cleaner cross-role consistency."
      chips={[`${visitors.length} requests`, `${counts.Pending} pending`]}
      className="resident-ui-page"
    >
      {/* Header */}
      <ManagerSection
        eyebrow="Requests"
        title="Pre approvals"
        description="Create visitor approvals and manage active QR passes."
        actions={
          <ManagerActionButton variant="primary" onClick={openPreApprovalForm}>
            <i className="bi bi-plus-lg me-1" />
            Pre Approve
          </ManagerActionButton>
        }
      >

      {/* Stats */}
      <div className="ue-stat-grid mb-4">
        <StatCard label="Approved Requests" value={counts.Approved} icon={<Users size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
        <StatCard label="Pending Requests" value={counts.Pending} icon={<Clock size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
        <StatCard label="Rejected Requests" value={counts.Rejected} icon={<XCircle size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
      </div>

      {/* Visitor Cards */}
      <div className="table-container manager-ui-section--muted" style={{ borderRadius: 18, padding: 16, border: "1px solid var(--manager-border)" }}>
        <div className="section-header">Your visitor requests</div>
        <div className="ue-entity-grid requests-container">
          {loading ? (
            <div className="no-bookings"><Loader label="Loading requests..." /></div>
          ) : visitors.length === 0 ? (
            <EmptyState icon={<Calendar size={48} />} title="No visitor requests found" sub="Pre-approve a visitor to generate a QR entry pass." />
          ) : (
            visitors.map((v) => (
              <EntityCard
                key={v._id}
                id={`#${String(v._id).slice(-6)}`}
                status={v.status}
                statusClass={`status-badge status-${v.status || ""}`}
                title={v.name || "Visitor"}
                details={[
                  { label: "Phone", value: v.contactNumber || "-" },
                  { label: "Date", value: formatDate(v.scheduledAt) },
                  { label: "Time", value: formatTime(v.scheduledAt) },
                  { label: "Purpose", value: v.purpose || "-" },
                ]}
                actions={[
                  {
                    label: "Cancel",
                    onClick: () => cancelRequest(v._id),
                    variant: "cancel",
                    icon: <i className="bi bi-x-circle" />,
                    show: v.status === "Pending",
                  },
                  {
                    label: "View QR",
                    onClick: () => viewQR(v._id),
                    variant: "view",
                    icon: <QrCode size={16} />,
                    show: v.status === "Pending",
                  },
                ]}
              />
            ))
          )}
        </div>
      </div>
      </ManagerSection>

      {/* Pre-Approve Form Modal */}
      {showForm ? (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Pre Approve Visitor"
          size="sm"
          footer={
            <>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                <i className="bi bi-check-circle me-1"></i> Submit Request
              </button>
            </>
          }
        >
          <Input label="Visitor Name" name="visitorName" required value={form.visitorName} onChange={handleChange} />
          <Input label="Phone Number" name="contactNumber" required maxLength={10} value={form.contactNumber} onChange={handleChange} />
          <Select
            label="Visitor Type"
            name="purpose"
            required
            value={form.purpose}
            onChange={handleChange}
            options={[
              { label: 'Guest', value: 'guest' },
              { label: 'Delivery', value: 'delivery' },
              { label: 'Service', value: 'service' },
              { label: 'Maintenance', value: 'maintenance' },
            ]}
            placeholder="Select type"
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Date of Visit<span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>
            </label>
            <Suspense fallback={<Loader label="Loading calendar..." size={22} />}>
              <LazyDayPicker
                className="ue-calendar ue-calendar--inline"
                mode="single"
                selected={selectedVisitDate}
                onSelect={handleVisitDateSelect}
                disabled={{ before: todayDate }}
                startMonth={todayDate}
                showOutsideDays
                captionLayout="dropdown"
              />
            </Suspense>
            <small style={{ color: "#6b7280" }}>
              Selected date: {selectedVisitDate.toLocaleDateString("en-IN")}
            </small>
          </div>
          <Input
            type="time"
            label="Time of Visit"
            name="timeOfVisit"
            required
            value={form.timeOfVisit}
            min={form.dateOfVisit === todayIso ? nowTimeForInput : undefined}
            onChange={handleChange}
          />
        </Modal>
      ) : null}

      {/* QR Code Modal */}
      {showQR ? (
        <Modal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          title="Pre-Approval QR Code"
          size="sm"
          footer={
            <button
              onClick={() => { const a = document.createElement("a"); a.href = qrImage; a.download = "QR-Code.png"; a.click(); }}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              <i className="bi bi-download me-1"></i> Download QR
            </button>
          }
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <img src={qrImage} alt="QR Code" style={{ width: "200px" }} />
          </div>
        </Modal>
      ) : null}
    </ManagerPageShell>
  );
}


