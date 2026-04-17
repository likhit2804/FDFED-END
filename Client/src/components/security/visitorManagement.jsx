import { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, UserX, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { StatCard, SearchBar, Tabs, EmptyState, Modal, Input, Select } from '../shared';

const VisitorManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, checkedOut: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    visitorType: "", fullName: "", contact: "", email: "", vehicleNo: ""
  });

  // ── Fetch visitors ──────────────────────────────────────────
  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch("/security/visitorManagement/api/visitors", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setVisitors(data.visitors || []);
        setStats(data.stats || { total: 0, active: 0, checkedOut: 0, pending: 0 });
      }
    } catch (err) {
      console.error("Visitor fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  // ── Handle Check-in / Check-out ─────────────────────────────
  const handleStatusChange = async (id, action) => {
    try {
      const res = await fetch(`/security/visitorManagement/${action}/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Visitor ${action === "checked-in" ? "checked in" : "checked out"}`);
        fetchVisitors();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  // ── Add Visitor ─────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.contact || !formData.visitorType) {
      toast.error("Name, contact and type are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/security/addVisitor", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Visitor added successfully");
        setShowModal(false);
        setFormData({ visitorType: "", fullName: "", contact: "", email: "", vehicleNo: "" });
        fetchVisitors();
      } else {
        toast.error(data.message || "Failed to add visitor");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────
  const filtered = visitors.filter((v) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "active" && v.status === "Active") ||
      (activeTab === "checked_out" && v.status === "CheckedOut") ||
      (activeTab === "pending" && v.status === "Pending");
    const matchSearch =
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.ID?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const statusBadge = (status) => {
    const map = {
      Active: { bg: "#dcfce7", color: "#16a34a" },
      CheckedOut: { bg: "#fee2e2", color: "#dc2626" },
      Pending: { bg: "#fef3c7", color: "#d97706" },
    };
    const style = map[status] || { bg: "#f3f4f6", color: "#6b7280" };
    return (
      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container py-4" style={{ fontFamily: "Inter, Montserrat, sans-serif" }}>
      {/* Header */}
      <h4 className="fw-semibold mb-4">Visitor Management</h4>

      {/* Stats */}
      <div className="ue-stat-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Total Visitors" value={stats.total} icon={<Users size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
        <StatCard label="Checked Out" value={stats.checkedOut} icon={<UserX size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
        <StatCard label="Active Visitors" value={stats.active} icon={<UserCheck size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
      </div>

      {/* Add Visitor Button */}
      <button
        className="btn btn-outline-warning w-100 mb-4 d-flex align-items-center gap-2 justify-content-center"
        style={{ borderRadius: "10px" }}
        onClick={() => setShowModal(true)}
      >
        <Plus size={18} /> Add New Visitor
      </button>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <SearchBar placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(typeof e === "string" ? e : e.target?.value || "")} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: "All Visitors", value: "all", count: visitors.length },
          { label: "Active", value: "active", count: stats.active },
          { label: "Checked Out", value: "checked_out", count: stats.checkedOut },
          { label: "Pending", value: "pending", count: stats.pending },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Visitor List */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-warning" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No visitors found" sub={activeTab === "all" ? "Add new visitors to see them here" : `No ${activeTab.replace("_", " ")} visitors`} />
      ) : (
        <div className="row g-3 mt-1">
          {filtered.map((v) => (
            <div key={v._id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-semibold">{v.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{v.ID}</div>
                  </div>
                  {statusBadge(v.status)}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }} className="mb-3">
                  <div><strong>Purpose:</strong> {v.purpose}</div>
                  <div><strong>Contact:</strong> {v.contactNumber}</div>
                  {v.vehicleNumber && <div><strong>Vehicle:</strong> {v.vehicleNumber}</div>}
                  {v.checkInAt && <div><strong>Checked In:</strong> {new Date(v.checkInAt).toLocaleTimeString()}</div>}
                  {v.checkOutAt && <div><strong>Checked Out:</strong> {new Date(v.checkOutAt).toLocaleTimeString()}</div>}
                </div>
                <div className="d-flex gap-2 mt-auto">
                  {v.status !== "Active" && (
                    <button className="btn btn-sm btn-success flex-fill" onClick={() => handleStatusChange(v._id, "checked-in")}>
                      <i className="bi bi-box-arrow-in-right me-1" /> Check In
                    </button>
                  )}
                  {v.status === "Active" && (
                    <button className="btn btn-sm btn-danger flex-fill" onClick={() => handleStatusChange(v._id, "checked-out")}>
                      <i className="bi bi-box-arrow-right me-1" /> Check Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Visitor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add a Visitor"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} disabled={submitting} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#d97706", color: "#fff", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Select
            label="Type of visitor"
            name="visitorType"
            value={formData.visitorType}
            onChange={handleChange}
            options={[
              { label: "Guest", value: "Guest" },
              { label: "Delivery", value: "Delivery" },
              { label: "Service", value: "Service" },
            ]}
            placeholder="Select visitor type"
          />
          <Input label="Contact number" placeholder="10 digit mobile number" name="contact" value={formData.contact} onChange={handleChange} />
          <Input label="Full name" placeholder="Enter visitor's full name" name="fullName" value={formData.fullName} onChange={handleChange} />
          <Input label="Email address" type="email" placeholder="visitor@example.com" name="email" value={formData.email} onChange={handleChange} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Vehicle number (optional)" placeholder="e.g. MH12AB1234" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { VisitorManagement };
