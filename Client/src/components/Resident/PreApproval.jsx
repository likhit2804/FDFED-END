import React, { useEffect, useState } from "react";

import { StatCard, Modal, Input, Select, StatusBadge, EmptyState } from "../shared";
import { Users, Clock, XCircle } from "lucide-react";

export function PreApproval() {
  const [visitors, setVisitors] = useState([]);
  const [counts, setCounts] = useState({ Approved: 0, Pending: 0, Rejected: 0 });
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ visitorName: "", contactNumber: "", purpose: "", dateOfVisit: "", timeOfVisit: "" });

  async function loadVisitors() {
    try {
      const res = await fetch("/resident/preApprovals", { method: "GET", credentials: "include" });
      const data = await res.json();
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
      const res = await fetch(`/resident/preapproval/cancel/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.ok) loadVisitors();
    } catch (err) { console.error("Cancel error:", err); }
  }

  async function viewQR(id) {
    try {
      const res = await fetch(`/resident/preapproval/qr/${id}`, { method: "GET", credentials: "include" });
      const data = await res.json();
      setQrImage(data.qrCodeBase64);
      setShowQR(true);
    } catch (err) { console.error("QR Fetch error:", err); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch("/resident/preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setShowForm(false); setForm({ visitorName: "", contactNumber: "", purpose: "", dateOfVisit: "", timeOfVisit: "" }); loadVisitors(); }
    } catch (err) { console.error("Form submit error:", err); }
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="section-title">Pre Approvals</h4>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-2"></i> Pre Approve
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4">
        <StatCard title="Approved Requests" value={counts.Approved} icon={<Users size={22} />} color="var(--success)" />
        <StatCard title="Pending Requests" value={counts.Pending} icon={<Clock size={22} />} color="var(--warning)" />
        <StatCard title="Rejected Requests" value={counts.Rejected} icon={<XCircle size={22} />} color="var(--danger)" />
      </div>

      {/* Visitor Cards */}
      <div className="table-container">
        <div className="section-header">Your Visitor Requests</div>
        <div className="requests-container">
          {loading ? (
            <div className="no-bookings">Loading...</div>
          ) : visitors.length === 0 ? (
            <EmptyState message="No visitor requests found" />
          ) : (
            visitors.map((v) => (
              <div key={v._id} className="request-card">
                <div className="request-card-header">
                  <div className="visitor-info">
                    <div className="visitor-avatar"><i className="bi bi-person-circle"></i></div>
                    <div>
                      <h5 className="visitor-name">{v.name}</h5>
                      <p className="visitor-phone"><i className="bi bi-telephone"></i> {v.contactNumber}</p>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>

                <div className="request-card-body">
                  <div className="request-detail">
                    <i className="bi bi-calendar"></i>
                    <div><span className="detail-label">Visit Date: </span><span className="detail-value">{v.scheduledAt ? new Date(v.scheduledAt).toLocaleDateString("en-IN") : "N/A"}</span></div>
                  </div>
                  <div className="request-detail">
                    <i className="bi bi-clock"></i>
                    <div><span className="detail-label">Visit Time: </span><span className="detail-value">{v.scheduledAt ? new Date(v.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span></div>
                  </div>
                  <div className="request-detail">
                    <i className="bi bi-card-text"></i>
                    <div><span className="detail-label">Purpose: </span><span className="detail-value">{v.purpose}</span></div>
                  </div>
                </div>

                {v.status === "Pending" && (
                  <div className="request-card-footer">
                    <button className="btn btn-sm btn-outline-danger cancel-btn" onClick={() => cancelRequest(v._id)}>
                      <i className="bi bi-x-circle"></i> Cancel
                    </button>
                    <button className="btn btn-sm btn-outline-primary view-qr-btn" onClick={() => viewQR(v._id)}>
                      <i className="bi bi-qr-code"></i> View QR
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pre-Approve Form Modal */}
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
        <Input type="date" label="Date of Visit" name="dateOfVisit" required value={form.dateOfVisit} onChange={handleChange} />
        <Input type="time" label="Time of Visit" name="timeOfVisit" required value={form.timeOfVisit} onChange={handleChange} />
      </Modal>

      {/* QR Code Modal */}
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
    </div>
  );
}
