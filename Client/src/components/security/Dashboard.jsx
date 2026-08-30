import React, { useEffect, useMemo, useState } from "react";
import { Clock, UserCheck, Users, PhoneCall, ShieldAlert, AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

import { useNavigate } from "react-router-dom";

import { Loader } from "../Loader";
import { DateRangeFilter, GraphBar, GraphPie, StatCard, Modal, Input, Select, Textarea } from "../shared";
import { ManagerPageShell, ManagerSection, ManagerActionButton } from "../shared/roleUI";
import { UE_CHART_COLORS } from "../shared/chartPalette";

const R_CATEGORIES = ["Plumbing", "Electrical", "Security", "Maintenance", "Pest Control", "Waste Management", "Other"];
const C_CATEGORIES = ["Streetlight", "Elevator", "Garden", "Common Area", "Other Community"];

export const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ Visitor: 0, Pending: 0, Active: 0 });
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Log Phone / Intercom Issue Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [flats, setFlats] = useState([]);
  const [issueForm, setIssueForm] = useState({
    callSource: "Intercom",
    categoryType: "Resident",
    uCode: "",
    location: "",
    category: "",
    title: "",
    description: "",
  });

  const autoDetectCategory = (text, currentCategory) => {
    const t = text.toLowerCase();
    if (/(electric|spark|switch|wire|fuse|power|mcb|short circuit|shock)/.test(t)) return "Electrical";
    if (/(leak|pipe|tap|drain|flush|sink|sewage|plumb|water burst)/.test(t)) return "Plumbing";
    if (/(lift|elevator)/.test(t)) return "Elevator";
    if (/(pest|termite|cockroach|rat|bug|insect)/.test(t)) return "Pest Control";
    if (/(garbage|trash|waste|dustbin)/.test(t)) return "Waste Management";
    if (/(lock|intruder|cctv|security|theft)/.test(t)) return "Security";
    if (/(streetlight|light pole|compound light)/.test(t)) return "Streetlight";
    return currentCategory || "";
  };

  const handleTitleChange = (val) => {
    setIssueForm((prev) => {
      const detected = autoDetectCategory(val, prev.category);
      let catType = prev.categoryType;
      if (["Streetlight", "Elevator", "Garden", "Common Area", "Other Community"].includes(detected)) {
        catType = "Community";
      } else if (["Plumbing", "Electrical", "Pest Control", "Waste Management"].includes(detected) && catType === "Community" && !prev.location) {
        catType = "Resident";
      }
      return {
        ...prev,
        title: val,
        category: detected || prev.category,
        categoryType: catType,
      };
    });
  };

  const fetchData = async (from = "", to = "") => {
    try {
      setLoading(true);
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await axios.get("/security/dashboard/api", { params });
      const data = response.data;
      if (!data.success) return;
      setStats(data.stats || { Visitor: 0, Pending: 0, Active: 0 });
    } catch (error) {
      console.error("Security dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const res = await axios.get("/security/issue/flats");
      if (res.data?.success && res.data.residents) {
        setFlats(res.data.residents);
      }
    } catch (err) {
      console.error("Failed to load flats:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFlats();
  }, []);

  const handleLogIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.title || !issueForm.description || !issueForm.category) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (issueForm.categoryType === "Resident" && !issueForm.uCode) {
      toast.error("Please select a Resident Flat.");
      return;
    }
    if (issueForm.categoryType === "Community" && !issueForm.location) {
      toast.error("Please specify the Common Area Location.");
      return;
    }

    try {
      setSubmittingIssue(true);
      const res = await axios.post("/security/issue/log", issueForm);
      if (res.data?.success) {
        toast.success(`Ticket logged successfully via ${issueForm.callSource}! Technician auto-dispatched.`);
        setIsLogModalOpen(false);
        setIssueForm({
          callSource: "Intercom",
          categoryType: "Resident",
          uCode: "",
          location: "",
          category: "Plumbing",
          title: "",
          description: "",
        });
      } else {
        toast.error(res.data?.message || "Failed to log issue");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to log issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const checkedOutCount = useMemo(
    () => Math.max((stats?.Visitor || 0) - (stats?.Pending || 0) - (stats?.Active || 0), 0),
    [stats]
  );

  const visitorSplitData = useMemo(
    () => [
      { name: "Active", value: stats?.Active || 0 },
      { name: "Pending", value: stats?.Pending || 0 },
      { name: "Checked Out", value: checkedOutCount },
    ],
    [stats, checkedOutCount]
  );

  const visitorLoadData = useMemo(
    () => [
      { name: "Total", count: stats?.Visitor || 0 },
      { name: "Active", count: stats?.Active || 0 },
      { name: "Pending", count: stats?.Pending || 0 },
    ],
    [stats]
  );

  return (
    <ManagerPageShell
      eyebrow="Security Desk"
      title="Monitor gate activity & log resident emergency calls in real-time."
      description="Track visitor flow, manage gate entries, and log incoming phone/intercom complaints for immediate technician dispatch."
      chips={[`${stats?.Visitor || 0} visitors tracked`, `${stats?.Pending || 0} pending approvals`]}
    >
      <ToastContainer position="top-center" />

      {/* Quick Action Banner for Phone / Intercom Logging */}
      <div
        className="mb-4 p-3 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: "42px", height: "42px", background: "rgba(59, 130, 246, 0.15)", color: "var(--brand-600, #2563eb)" }}
          >
            <PhoneCall size={22} />
          </div>
          <div>
            <div className="fw-semibold text-primary d-flex align-items-center gap-2" style={{ fontSize: "14px" }}>
              <span>Incoming Resident Call / Intercom Complaint?</span>
              <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>Gate Desk Feature</span>
            </div>
            <p className="mb-0 text-muted" style={{ fontSize: "12.5px" }}>
              Log incoming intercom calls, phone complaints, or walk-in hazards directly into UrbanEase for automatic technician dispatch.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate("/security/issues")}
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow-sm"
            style={{ fontSize: "12.5px", fontWeight: 600 }}
          >
            View All Issues
          </button>
          <button
            type="button"
            onClick={() => {
              fetchFlats();
              setIsLogModalOpen(true);
            }}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3.5 py-2 rounded-pill shadow-sm"
            style={{ fontSize: "12.5px", fontWeight: 600 }}
          >
            <Plus size={16} /> Quick Log Ticket
          </button>
        </div>
      </div>

      <ManagerSection
        eyebrow="Snapshot"
        title="Visitor dashboard"
        description="Current status of visitors at the community gate."
      >
        <div className="ue-stat-grid">
          <StatCard label="Total Visitors" value={stats?.Visitor || 0} icon={<Users size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
          <StatCard label="Pending Approvals" value={stats?.Pending || 0} icon={<Clock size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
          <StatCard label="Active Visitors" value={stats?.Active || 0} icon={<UserCheck size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
        </div>
      </ManagerSection>

      <ManagerSection
        eyebrow="Insights"
        title="Visitor analytics"
        description="Live distribution and load trends for gate operations."
        actions={(
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onApply={() => fetchData(fromDate, toDate)}
            onReset={() => {
              setFromDate("");
              setToDate("");
              fetchData("", "");
            }}
            loading={loading}
          />
        )}
      >
        {loading ? (
          <div className="manager-ui-empty">
            <Loader label="Preparing visitor charts..." />
          </div>
        ) : (
          <div className="manager-ui-two-column">
            <GraphPie
              title="Visitor state split"
              subtitle="Active, pending, and checked-out records"
              data={visitorSplitData}
              colors={[UE_CHART_COLORS.emerald, UE_CHART_COLORS.plum, UE_CHART_COLORS.slate]}
            />
            <GraphBar
              title="Visitor load"
              subtitle="Current gate volume"
              xKey="name"
              data={visitorLoadData}
              bars={[{ key: "count", label: "Visitors", color: UE_CHART_COLORS.slate }]}
            />
          </div>
        )}
      </ManagerSection>

      {/* Log Phone/Intercom Ticket Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => !submittingIssue && setIsLogModalOpen(false)}
        title="Log Incoming Phone / Intercom Ticket"
        size="md"
        footer={(
          <>
            <button
              type="button"
              className="manager-ui-button manager-ui-button--secondary"
              onClick={() => setIsLogModalOpen(false)}
              disabled={submittingIssue}
            >
              Cancel
            </button>
            <button
              type="button"
              className="manager-ui-button manager-ui-button--primary"
              onClick={handleLogIssueSubmit}
              disabled={submittingIssue}
            >
              {submittingIssue ? "Dispatching..." : "Log & Dispatch Worker"}
            </button>
          </>
        )}
      >
        <form onSubmit={handleLogIssueSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Call Source</label>
            <div className="d-flex gap-2">
              {["Intercom", "Phone Call", "Gate Walk-in"].map((src) => (
                <button
                  type="button"
                  key={src}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 ${issueForm.callSource === src ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setIssueForm((prev) => ({ ...prev, callSource: src }))}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Complaint Target</label>
            <div className="d-flex gap-2">
              {[
                { label: "Resident Flat", value: "Resident" },
                { label: "Common Area / Facility", value: "Community" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.value}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 ${issueForm.categoryType === t.value ? "btn-dark" : "btn-outline-secondary"}`}
                  onClick={() => setIssueForm((prev) => ({
                    ...prev,
                    categoryType: t.value,
                    category: t.value === "Resident" ? "Plumbing" : "Elevator",
                  }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {issueForm.categoryType === "Resident" ? (
            <Select
              label="Resident Flat / Unit *"
              value={issueForm.uCode}
              onChange={(e) => setIssueForm((prev) => ({ ...prev, uCode: e.target.value }))}
              placeholder="-- Select Flat --"
              options={flats.map((f) => ({
                label: `${f.uCode} (${f.residentFirstname} ${f.residentLastname} - ${f.contact || "No phone"})`,
                value: f.uCode,
              }))}
            />
          ) : (
            <Input
              label="Common Area Location *"
              placeholder="e.g. Block A Lift 2, Clubhouse Gym, East Gate"
              value={issueForm.location}
              onChange={(e) => setIssueForm((prev) => ({ ...prev, location: e.target.value }))}
              required
            />
          )}

          <Select
            label={issueForm.categoryType === "Resident" ? "Flat Issue Category *" : "Community Facility Category *"}
            value={issueForm.category}
            onChange={(e) => setIssueForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="-- Select Category --"
            options={(issueForm.categoryType === "Resident" ? R_CATEGORIES : C_CATEGORIES).map((c) => ({
              label: c,
              value: c,
            }))}
          />

          <Input
            label="Issue Title *"
            placeholder="e.g. Bathroom sink burst / Electric sparks / Lift 2 stuck"
            value={issueForm.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />

          <Textarea
            label="Complaint Details *"
            rows={4}
            placeholder="Details as reported by the resident over the phone or intercom..."
            value={issueForm.description}
            onChange={(e) => setIssueForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />

          <div
            className="p-2.5 rounded-3 d-flex align-items-center gap-2 mt-3"
            style={{ background: "var(--surface-2)", fontSize: "12px", color: "var(--brand-700)" }}
          >
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            <span>UrbanEase will auto-detect priority and instantly dispatch the nearest on-duty technician.</span>
          </div>
        </form>
      </Modal>
    </ManagerPageShell>
  );
};
