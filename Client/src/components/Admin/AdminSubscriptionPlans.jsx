import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Edit2, Plus, Save, Tag, Trash2, Users, X } from "lucide-react";
import Header from "./Header";
import Card from "./Card";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    planKey: "",
    name: "",
    price: "",
    duration: "monthly",
    maxResidents: "",
    features: "",
    description: "",
    displayOrder: "",
  });

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin`
      : "http://localhost:3000/admin";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/subscription-plans?includeInactive=true`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      toast.error("Failed to load plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        maxResidents: formData.maxResidents
          ? parseInt(formData.maxResidents)
          : null,
        features: formData.features.split("\n").filter((f) => f.trim()),
        displayOrder:
          formData.displayOrder !== ""
            ? parseInt(formData.displayOrder)
            : plans.length + 1,
      };

      const res = await fetch(`${API_BASE_URL}/api/subscription-plans`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Plan created successfully");
        fetchPlans();
        setShowAddForm(false);
        resetForm();
      } else {
        toast.error(data.message || "Failed to create plan");
      }
    } catch (err) {
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async (planId) => {
    try {
      const plan = plans.find((p) => p._id === planId);
      const payload = {
        name: plan.name,
        price: parseFloat(plan.price),
        duration: plan.duration,
        maxResidents: plan.maxResidents ? parseInt(plan.maxResidents) : null,
        features: Array.isArray(plan.features) ? plan.features : [],
        description: plan.description || "",
        displayOrder: parseInt(plan.displayOrder) || 0,
        isActive: plan.isActive,
      };

      const res = await fetch(`${API_BASE_URL}/api/subscription-plans/${planId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Plan updated successfully");
        fetchPlans();
        setEditingPlan(null);
      } else {
        toast.error(data.message || "Failed to update plan");
      }
    } catch (err) {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to deactivate this plan?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Plan deactivated successfully");
        fetchPlans();
      } else {
        toast.error(data.message || "Failed to deactivate plan");
      }
    } catch (err) {
      toast.error("Failed to deactivate plan");
    }
  };

  const handleEditChange = (planId, field, value) => {
    setPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan._id === planId ? { ...plan, [field]: value } : plan
      )
    );
  };

  const resetForm = () => {
    setFormData({
      planKey: "",
      name: "",
      price: "",
      duration: "monthly",
      maxResidents: "",
      features: "",
      description: "",
      displayOrder: "",
    });
  };

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter((p) => p.isActive).length,
    totalRevenue: plans
      .filter((p) => p.isActive)
      .reduce((sum, p) => sum + p.price, 0),
  };

  const orderOptions = Array.from({ length: plans.length + 1 }, (_, i) => i + 1);

  const orderedPlans = [...plans].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  const styles = {
    page: {
      fontFamily: "Poppins, sans-serif",
      color: "#0f172a",
    },
    cardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "20px",
    },
    sectionCard: {
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "1.5rem",
      marginBottom: "20px",
      fontFamily: "Poppins, sans-serif",
    },
    planGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    planCard: {
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      overflow: "hidden",
      background: "#ffffff",
      fontFamily: "Poppins, sans-serif",
    },
    planHeader: {
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderBottom: "1px solid #0f172a",
      color: "#ffffff",
    },
    planHeaderInactive: {
      background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
      borderBottom: "1px solid #111827",
      color: "#ffffff",
    },
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Subscription Plans" />
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.35)",
          }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} />
          Add New Plan
        </button>
      </div>

      <div style={styles.cardsRow}>
        <Card
          icon={<Tag size={22} />}
          value={stats.totalPlans}
          label="Total Plans"
          borderColor="#0f172a"
        />
        <Card
          icon={<Users size={22} />}
          value={stats.activePlans}
          label="Active Plans"
          borderColor="#1e293b"
        />
        <Card
          icon={<Tag size={22} />}
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          label="Combined Price"
          borderColor="#334155"
        />
      </div>

      {showAddForm && (
        <div style={styles.sectionCard}>
          <h5 className="mb-3" style={{ fontWeight: 600, color: "#1e293b" }}>
            Create New Plan
          </h5>
          <form onSubmit={handleCreatePlan}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Plan Key *</label>
                <input
                  type="text"
                  className="form-control"
                  name="planKey"
                  value={formData.planKey}
                  onChange={handleInputChange}
                  placeholder="e.g., starter-100"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plan Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Up to 100 Residents"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="1999"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Duration *</label>
                <select
                  className="form-select"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Max Residents</label>
                <input
                  type="number"
                  className="form-control"
                  name="maxResidents"
                  value={formData.maxResidents}
                  onChange={handleInputChange}
                  placeholder="Leave blank for unlimited"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Features (one per line) *</label>
                <textarea
                  className="form-control"
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Resident Management&#10;Basic Reports&#10;Email Support"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Optional description"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Display Order (1 = first)</label>
                <select
                  className="form-select"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                >
                  <option value="">Auto</option>
                  {orderOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <small className="text-muted">Choose where this plan appears in the list.</small>
              </div>
            </div>
            <div className="d-flex gap-2 mt-4">
              <button
                type="submit"
                className="btn d-flex align-items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              >
                <Save size={16} />
                Create Plan
              </button>
              <button
                type="button"
                className="btn btn-light d-flex align-items-center gap-2"
                style={{
                  border: "1px solid #e2e8f0",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.planGrid}>
        {orderedPlans.map((plan) => (
          <div key={plan._id} style={styles.planCard}>
            <div
              className="d-flex justify-content-between align-items-center p-3"
              style={{ ...(plan.isActive ? styles.planHeader : styles.planHeaderInactive) }}
            >
              <span
                className="badge"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#ffffff",
                }}
              >
                {plan.planKey}
              </span>
              {!plan.isActive && (
                <span
                  className="badge bg-danger"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Inactive
                </span>
              )}
            </div>
            <div className="p-4">
              {editingPlan === plan._id ? (
                <div>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={plan.name}
                    onChange={(e) => handleEditChange(plan._id, "name", e.target.value)}
                  />
                  <div className="input-group mb-2">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={plan.price}
                      onChange={(e) => handleEditChange(plan._id, "price", e.target.value)}
                    />
                  </div>
                  <select
                    className="form-select mb-2"
                    value={plan.duration}
                    onChange={(e) => handleEditChange(plan._id, "duration", e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Max Residents (blank = unlimited)"
                    value={plan.maxResidents || ""}
                    onChange={(e) => handleEditChange(plan._id, "maxResidents", e.target.value)}
                  />
                  <textarea
                    className="form-control mb-2"
                    rows="3"
                    value={Array.isArray(plan.features) ? plan.features.join("\n") : ""}
                    onChange={(e) =>
                      handleEditChange(plan._id, "features", e.target.value.split("\n"))
                    }
                  />
                </div>
              ) : (
                <div>
                  <h5 className="mb-2" style={{ fontWeight: 600, color: "#1e293b" }}>
                    {plan.name}
                  </h5>
                  <div className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                    Order: {plan.displayOrder ?? "—"}
                  </div>
                  <h3 className="mb-3" style={{ color: "#3b82f6", fontWeight: 700 }}>
                    ₹{plan.price.toLocaleString()}
                    <small className="text-muted" style={{ fontSize: "1rem", fontWeight: 500 }}>
                      /{plan.duration}
                    </small>
                  </h3>
                  {plan.maxResidents && (
                    <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                      <strong style={{ color: "#64748b" }}>Max Residents:</strong> {plan.maxResidents}
                    </p>
                  )}
                  <ul className="list-unstyled" style={{ fontSize: "0.9rem" }}>
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="mb-2" style={{ color: "#64748b" }}>
                        <span style={{ color: "#10b981", marginRight: "8px" }}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div
              className="d-flex gap-2 p-3"
              style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}
            >
              {editingPlan === plan._id ? (
                <>
                  <button
                    className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 500,
                    }}
                    onClick={() => handleUpdatePlan(plan._id)}
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    className="btn btn-sm btn-light"
                    style={{ border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px" }}
                    onClick={() => {
                      setEditingPlan(null);
                      fetchPlans();
                    }}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    style={{
                      background: "white",
                      color: "#0f172a",
                      border: "1px solid #0f172a",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 500,
                    }}
                    onClick={() => setEditingPlan(plan._id)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  {plan.isActive && (
                    <button
                      className="btn btn-sm"
                      style={{
                        background: "white",
                        color: "#ef4444",
                        border: "1px solid #ef4444",
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                      onClick={() => handleDeletePlan(plan._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div
          className="bg-white rounded-4 shadow-sm text-center py-5"
          style={{ border: "1px solid #e2e8f0", fontFamily: "Poppins, sans-serif" }}
        >
          <Tag size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
          <p className="text-muted" style={{ fontSize: "1.1rem" }}>
            No subscription plans found. Create your first plan!
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlans;
