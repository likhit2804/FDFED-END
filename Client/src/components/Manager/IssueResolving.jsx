import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BarChart3, Building2, CheckCircle, AlertCircle, Users } from "lucide-react";
import {
  fetchManagerIssues,
  fetchIssueDetails,
  assignManagerIssue,
  reassignManagerIssue,
  closeManagerIssue,
  clearIssueDetails,
  fetchWorkers,
} from "../../Slices/ManagerIssuesSlice";
import { toast, ToastContainer } from "react-toastify";
import { useSocket } from "../../hooks/useSocket";
import { StatCard, Tabs, SearchBar, Dropdown } from "../shared";
import { useTabFilters } from "./IssueResolving/useTabFilters";
import { IssueCard } from "./IssueResolving/IssueCard";
import { IssueDetailsModal } from "./IssueResolving/IssueDetailsModal";
import { WorkerAssignModal } from "./IssueResolving/WorkerAssignModal";

export const IssueResolving = () => {
  const dispatch = useDispatch();
  const socket = useSocket("");

  const managerState = useSelector((s) => s?.managerIssues) || {};
  const { issues = [], loading = false, error = null, workers = [], workersLoading = false } = managerState;

  const [activeTab, setActiveTab] = useState("Resident");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIssue, setPreviewIssue] = useState(null);
  const [assignMode, setAssignMode] = useState(null); // "assign" | "reassign" | null

  // Split issues by type
  const issuesByTab = useMemo(() => ({
    Resident: issues.filter((i) => i.categoryType === "Resident"),
    Community: issues.filter((i) => i.categoryType === "Community"),
  }), [issues]);

  // Per-tab filters via custom hook
  const { filters, setFilter, filtered: activeIssues } = useTabFilters(issuesByTab, activeTab);

  // Load data on mount + socket refresh
  useEffect(() => { dispatch(fetchManagerIssues()); dispatch(fetchWorkers()); }, [dispatch]);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => dispatch(fetchManagerIssues());
    socket.on("issue:updated", refresh);
    return () => socket.off("issue:updated", refresh);
  }, [socket, dispatch]);

  // Stats
  const stats = {
    total: issues.length,
    resident: issuesByTab.Resident.length,
    community: issuesByTab.Community.length,
    pending: issues.filter((i) => i.status === "Pending Assignment").length,
    paymentPending: issues.filter((i) => i.status === "Payment Pending").length,
  };

  // Permission checks
  const canAssign = (issue) => issue?.status === "Pending Assignment" && !issue.workerAssigned;
  const canReassign = (issue) =>
    issue?.workerAssigned &&
    (issue.status === "Reopened" || issue.status === "Assigned" || issue.status === "In Progress" ||
      (issue.status === "Pending Assignment" && issue.workerAssigned));

  // Modal openers
  const openDetails = async (issue) => { setPreviewIssue(issue); await dispatch(fetchIssueDetails(issue._id)); setPreviewOpen(true); };
  const closeDetails = () => { setPreviewOpen(false); dispatch(clearIssueDetails()); };
  const openAssign = (issue) => { setPreviewIssue(issue); setPreviewOpen(false); setAssignMode("assign"); };
  const openReassign = (issue) => { setPreviewIssue(issue); setPreviewOpen(false); setAssignMode("reassign"); };

  // Actions
  const handleWorkerAction = async ({ worker, deadline, remarks }) => {
    if (!worker.trim()) return toast.error("Select a worker");
    try {
      const action = assignMode === "assign" ? assignManagerIssue : reassignManagerIssue;
      const payload = assignMode === "assign"
        ? { id: previewIssue._id, worker, deadline: deadline || null, remarks: remarks || null }
        : { id: previewIssue._id, newWorker: worker, deadline: deadline || null, remarks: remarks || null };
      await dispatch(action(payload)).unwrap();
      toast.success(assignMode === "assign" ? "Worker assigned successfully" : "Worker reassigned successfully");
      setAssignMode(null);
      dispatch(fetchManagerIssues());
    } catch (e) { toast.error(String(e)); }
  };

  const doClose = async (issue) => {
    try { await dispatch(closeManagerIssue({ id: issue._id })).unwrap(); toast.success("Issue closed"); dispatch(fetchManagerIssues()); }
    catch (e) { toast.error(String(e)); }
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />

      <div className="management-section">
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "rgba(0,0,0,0.7)" }}>Issue Resolution Management</h3>
          <button onClick={() => dispatch(fetchManagerIssues())} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", marginTop: "8px" }}>
            🔄 Refresh
          </button>
        </div>

        {error && <div className="error-state">Error: {error}</div>}

        {/* Stats */}
        <div className="ue-stat-grid" style={{ marginBottom: 20 }}>
          <StatCard label="Total Issues" value={stats.total} icon={<BarChart3 size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
          <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
          <StatCard label="Payment Pending" value={stats.paymentPending} icon={<CheckCircle size={22} />} iconColor="#dc2626" iconBg="#fee2e2" />
          <StatCard label="Resident" value={stats.resident} icon={<Users size={22} />} iconColor="#7c3aed" iconBg="#ede9fe" />
          <StatCard label="Community" value={stats.community} icon={<Building2 size={22} />} iconColor="#0891b2" iconBg="#e0f2fe" />
        </div>

        {/* Tabs */}
        <Tabs variant="pill" tabs={[
          { label: "👤 Resident Issues", value: "Resident", count: stats.resident },
          { label: "🏢 Community Issues", value: "Community", count: stats.community },
        ]} active={activeTab} onChange={setActiveTab} />

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar placeholder="Search title, category, ID, location..." value={filters.search} onChange={(v) => setFilter("search", v)} />
          </div>
          <Dropdown options={[
            { label: "All Status", value: "All" }, { label: "Pending", value: "Pending Assignment" },
            { label: "Assigned", value: "Assigned" }, { label: "In Progress", value: "In Progress" },
            { label: "Reopened", value: "Reopened" }, { label: "Resolved", value: "Resolved (Awaiting Confirmation)" },
            { label: "Payment Pending", value: "Payment Pending" }, { label: "Closed", value: "Closed" },
          ]} selected={filters.status} onChange={(v) => setFilter("status", v)} width="180px" />
          <Dropdown options={[
            { label: "All Priority", value: "All" }, { label: "Low", value: "Low" },
            { label: "Normal", value: "Normal" }, { label: "High", value: "High" }, { label: "Urgent", value: "Urgent" },
          ]} selected={filters.priority} onChange={(v) => setFilter("priority", v)} width="160px" />
          <input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)} style={{ padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
          <input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} style={{ padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
        </div>

        {loading && <div className="loading-state">Loading issues...</div>}

        {!loading && activeIssues.length > 0 ? (
          <div className="issues-grid">
            {activeIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} onView={openDetails} onAssign={openAssign} onReassign={openReassign} onClose={doClose} canAssign={canAssign} canReassign={canReassign} />
            ))}
          </div>
        ) : !loading ? (
          <div className="empty-state"><p>No {activeTab.toLowerCase()} issues found matching your filters.</p></div>
        ) : null}
      </div>

      <IssueDetailsModal issue={previewIssue} isOpen={previewOpen} onClose={closeDetails} canAssign={canAssign} canReassign={canReassign} onAssign={openAssign} onReassign={openReassign} />

      <WorkerAssignModal mode={assignMode || "assign"} issue={previewIssue} workers={workers} workersLoading={workersLoading} isOpen={!!assignMode} onClose={() => setAssignMode(null)} onSubmit={handleWorkerAction} />
    </>
  );
};
