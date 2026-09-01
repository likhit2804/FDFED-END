import { useEffect, useMemo, useState } from "react";
import {
  PhoneCall,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Wrench,
  Search,
  CheckCircle2,
  Trash2
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

import { Loader } from "../Loader";
import {
  StatCard,
  Modal,
  Tabs,
  EmptyState,
  EntityCard,
  IssueDetailsModal,
  Input,
  Select,
  Textarea
} from "../shared";
import { ManagerPageShell, ManagerSection, ManagerRecordGrid } from "../shared/roleUI";

const R_CATEGORIES = ["Plumbing", "Electrical", "Security", "Maintenance", "Pest Control", "Waste Management", "Other"];
const C_CATEGORIES = ["Streetlight", "Elevator", "Garden", "Common Area", "Other Community"];

export const SecurityIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("GateDesk");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [flats, setFlats] = useState([]);
  const [submittingIssue, setSubmittingIssue] = useState(false);
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

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/security/issue/data");
      if (res.data?.success) {
        setIssues(res.data.issues || []);
      }
    } catch (err) {
      console.error("Failed to load security issues:", err);
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
    fetchIssues();
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
        fetchIssues();
      } else {
        toast.error(res.data?.message || "Failed to log issue");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to log issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleDeleteIssue = async (id) => {
    if (!window.confirm("Are you sure you want to mark this ticket as Deleted?")) return;
    try {
      const res = await axios.delete(`/security/issue/delete/${id}`);
      if (res.data?.success) {
        toast.success("Ticket marked as Deleted");
        fetchIssues();
      } else {
        toast.error(res.data?.message || "Failed to delete ticket");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete ticket");
    }
  };

  const isGateDeskIssue = (i) => {
    return (
      i?.title?.includes("[Intercom]") ||
      i?.title?.includes("[Phone Call]") ||
      i?.title?.includes("[Gate Walk-in]") ||
      i?.description?.includes("[Logged by Security")
    );
  };

  const gateDeskIssues = useMemo(() => issues.filter(isGateDeskIssue), [issues]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((i) => {
        if (activeTab === "GateDesk") return isGateDeskIssue(i);
        if (activeTab === "Community") return i?.categoryType === "Community";
        return isGateDeskIssue(i);
      })
      .filter((i) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          i?.title?.toLowerCase().includes(q) ||
          i?.location?.toLowerCase().includes(q) ||
          i?.category?.toLowerCase().includes(q) ||
          i?.resident?.residentFirstname?.toLowerCase().includes(q) ||
          i?.resident?.uCode?.toLowerCase().includes(q)
        );
      });
  }, [issues, activeTab, searchQuery]);

  const deskCount = gateDeskIssues.length;
  const pendingCount = gateDeskIssues.filter((i) => i?.status === "Pending Assignment" || i?.status === "Assigned").length;
  const inProgressCount = gateDeskIssues.filter((i) => i?.status === "In Progress").length;
  const resolvedCount = gateDeskIssues.filter((i) => i?.status?.includes("Resolved") || i?.status === "Closed").length;

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-danger text-white";
      case "High": return "bg-warning text-dark";
      default: return "bg-primary-subtle text-primary border";
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === "Deleted") return "bg-dark text-white";
    if (status === "In Progress") return "bg-info text-white";
    if (status?.includes("Resolved") || status === "Closed") return "bg-success text-white";
    if (status === "Pending Assignment") return "bg-secondary text-white";
    return "bg-warning text-dark";
  };

  return (
    <ManagerPageShell
      eyebrow="Gate Security Desk"
      title="Intercom Complaints & Phone Tickets"
      description="View, monitor, and log incoming intercom calls, phone complaints, and walk-in maintenance tickets."
      chips={[`${deskCount} gate call tickets`, `${pendingCount} pending dispatch`, `${inProgressCount} in progress`]}
    >
      <ToastContainer position="top-center" />

      <ManagerSection
        eyebrow="Ticket Management"
        title="Gate Call Logbook"
        description="Log phone calls on behalf of residents and monitor technician dispatch in real-time."
        actions={(
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-3.5 py-2 rounded-pill shadow-sm"
            onClick={() => {
              fetchFlats();
              setIsLogModalOpen(true);
            }}
          >
            <Plus size={16} /> Log Phone / Intercom Ticket
          </button>
        )}
      >
        {/* Stats Overview */}
        <div className="ue-stat-grid mb-4">
          <StatCard label="Gate Desk Calls" value={deskCount} icon={<PhoneCall size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
          <StatCard label="Pending Dispatch" value={pendingCount} icon={<Clock size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
          <StatCard label="In Progress" value={inProgressCount} icon={<Wrench size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
          <StatCard label="Resolved / Closed" value={resolvedCount} icon={<CheckCircle size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
        </div>

        {/* Filters & Search */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <Tabs
            tabs={[
              { label: "Logged by Gate Desk", value: "GateDesk" },
              { label: "Common Facility Hazards", value: "Community" },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className="input-group" style={{ maxWidth: "320px" }}>
            <span className="input-group-text bg-white border-end-0">
              <Search size={15} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by Flat, Title, Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "13px" }}
            />
          </div>
        </div>

        {/* Issue Cards Grid */}
        <ManagerRecordGrid>
          {loading ? (
            <div className="manager-ui-empty manager-ui-grid-span-all">
              <Loader label="Loading security tickets..." />
            </div>
          ) : null}

          {!loading && filteredIssues.length > 0 ? (
            filteredIssues.map((issue, index) => (
              <EntityCard
                key={issue._id}
                id={`#${issue.issueID || issue._id.slice(-6).toUpperCase()}`}
                status={issue.status}
                statusClass={
                  issue.status === "Deleted"
                    ? "status-badge status-closed"
                    : issue.status === "In Progress"
                    ? "status-badge status-in-progress"
                    : issue.status?.includes("Resolved")
                    ? "status-badge status-resolved"
                    : "status-badge status-pending"
                }
                title={issue.title}
                index={index}
                badges={(
                  <span
                    className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold"
                    style={{
                      fontSize: "11px",
                      backgroundColor:
                        issue.priority === "Urgent"
                          ? "rgba(239, 68, 68, 0.12)"
                          : issue.priority === "High"
                          ? "rgba(245, 158, 11, 0.12)"
                          : "rgba(59, 130, 246, 0.1)",
                      color:
                        issue.priority === "Urgent"
                          ? "#ef4444"
                          : issue.priority === "High"
                          ? "#d97706"
                          : "#3b82f6",
                      border:
                        issue.priority === "Urgent"
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : issue.priority === "High"
                          ? "1px solid rgba(245, 158, 11, 0.3)"
                          : "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    {issue.priority}
                  </span>
                )}
                details={[
                  { label: "Category", value: issue.category || "-" },
                  { label: "Location", value: issue.location || issue.resident?.uCode || "-" },
                  {
                    label: "Resident",
                    value: issue.resident
                      ? `${issue.resident.residentFirstname} ${issue.resident.residentLastname} (${issue.resident.contact || "No phone"})`
                      : "Society Common Area",
                  },
                  {
                    label: "Assigned Worker",
                    value: issue.workerAssigned
                      ? `${issue.workerAssigned.name} (${issue.workerAssigned.jobRole?.join(", ") || "Staff"})`
                      : "Pending Assignment",
                  },
                  {
                    label: "Logged On",
                    value: issue.createdAt
                      ? new Date(issue.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-",
                  },
                ]}
                actions={[
                  {
                    label: "Audit Timeline",
                    onClick: () => setSelectedIssue(issue),
                    variant: "secondary",
                    icon: <Clock size={13} />,
                  },
                  ...(issue.status !== "Deleted"
                    ? [
                        {
                          label: "Delete Ticket",
                          onClick: () => handleDeleteIssue(issue._id),
                          variant: "danger",
                          icon: <Trash2 size={13} />,
                        },
                      ]
                    : []),
                ]}
              />
            ))
          ) : !loading ? (
            <div className="manager-ui-grid-span-all">
              <EmptyState
                icon={<AlertCircle size={42} />}
                title="No logged tickets found"
                sub="Log an intercom call or phone complaint to begin tracking technician dispatch."
              />
            </div>
          ) : null}
        </ManagerRecordGrid>
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
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: "12.5px" }}>Call Source</label>
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
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: "12.5px" }}>Complaint Target</label>
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

      {/* Unified Ticket Audit Details Modal */}
      {selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          isOpen={Boolean(selectedIssue)}
          onClose={() => setSelectedIssue(null)}
          role="security"
          actions={[
            {
              label: "Delete / Cancel Ticket",
              variant: "danger",
              icon: <Trash2 size={15} />,
              show: selectedIssue.status !== "Deleted",
              onClick: () => {
                handleDeleteIssue(selectedIssue._id);
                setSelectedIssue(null);
              },
            },
          ]}
        />
      )}
    </ManagerPageShell>
  );
};
export default SecurityIssues;
