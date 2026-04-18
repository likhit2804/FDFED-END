import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, BarChart3, Building2, CheckCircle, RefreshCw, Users } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

import {
  assignManagerIssue,
  clearIssueDetails,
  closeManagerIssue,
  fetchIssueDetails,
  fetchManagerIssues,
  fetchWorkers,
  reassignManagerIssue,
} from "../../slices/ManagerIssuesSlice";
import { useSocket } from "../../hooks/useSocket";
import { Loader } from "../Loader";
import { Dropdown, GraphBar, GraphPie, SearchBar, StatCard, Tabs } from "../shared";
import { useTabFilters } from "./IssueResolving/useTabFilters";
import { IssueCard } from "./IssueResolving/IssueCard";
import { IssueDetailsModal } from "./IssueResolving/IssueDetailsModal";
import { WorkerAssignModal } from "./IssueResolving/WorkerAssignModal";
import { UE_CHART_COLORS, UE_CHART_PALETTE } from "../shared/chartPalette";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
  ManagerToolbarGrow,
} from "./ui";

export const IssueResolving = () => {
  const dispatch = useDispatch();
  const socket = useSocket("");

  const managerState = useSelector((state) => state?.managerIssues) || {};
  const {
    issues = [],
    loading = false,
    error = null,
    workers = [],
    workersLoading = false,
  } = managerState;

  const [activeTab, setActiveTab] = useState("Resident");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIssue, setPreviewIssue] = useState(null);
  const [assignMode, setAssignMode] = useState(null);

  const issuesByTab = useMemo(
    () => ({
      Resident: issues.filter((issue) => issue.categoryType === "Resident"),
      Community: issues.filter((issue) => issue.categoryType === "Community"),
    }),
    [issues]
  );

  const { filters, setFilter, filtered: activeIssues } = useTabFilters(issuesByTab, activeTab);

  const statusChartData = useMemo(() => {
    const statusCounts = issues.reduce((accumulator, issue) => {
      const status = issue?.status || "Unknown";
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const priorityChartData = useMemo(() => {
    const levels = ["Low", "Normal", "High", "Urgent"];
    const counts = levels.reduce((accumulator, level) => ({ ...accumulator, [level]: 0 }), {});

    issues.forEach((issue) => {
      const priority = issue?.priority || "Normal";
      if (Object.prototype.hasOwnProperty.call(counts, priority)) {
        counts[priority] += 1;
      }
    });

    return levels.map((level) => ({ name: level, count: counts[level] }));
  }, [issues]);


  useEffect(() => {
    dispatch(fetchManagerIssues());
    dispatch(fetchWorkers());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => dispatch(fetchManagerIssues());
    socket.on("issue:updated", refresh);

    return () => socket.off("issue:updated", refresh);
  }, [dispatch, socket]);

  const stats = {
    total: issues.length,
    resident: issuesByTab.Resident.length,
    community: issuesByTab.Community.length,
    pending: issues.filter((issue) => issue.status === "Pending Assignment").length,
    paymentPending: issues.filter((issue) => issue.status === "Payment Pending").length,
  };

  const canAssign = (issue) => issue?.status === "Pending Assignment" && !issue.workerAssigned;
  const canReassign = (issue) =>
    issue?.workerAssigned &&
    (issue.status === "Reopened" ||
      issue.status === "Assigned" ||
      issue.status === "In Progress" ||
      (issue.status === "Pending Assignment" && issue.workerAssigned));

  const openDetails = async (issue) => {
    setPreviewIssue(issue);
    await dispatch(fetchIssueDetails(issue._id));
    setPreviewOpen(true);
  };

  const closeDetails = () => {
    setPreviewOpen(false);
    dispatch(clearIssueDetails());
  };

  const openAssign = (issue) => {
    setPreviewIssue(issue);
    setPreviewOpen(false);
    setAssignMode("assign");
  };

  const openReassign = (issue) => {
    setPreviewIssue(issue);
    setPreviewOpen(false);
    setAssignMode("reassign");
  };

  const handleWorkerAction = async ({ worker, deadline, remarks }) => {
    if (!worker.trim()) {
      toast.error("Select a worker");
      return;
    }

    try {
      const action = assignMode === "assign" ? assignManagerIssue : reassignManagerIssue;
      const payload =
        assignMode === "assign"
          ? { id: previewIssue._id, worker, deadline: deadline || null, remarks: remarks || null }
          : { id: previewIssue._id, newWorker: worker, deadline: deadline || null, remarks: remarks || null };

      await dispatch(action(payload)).unwrap();
      toast.success(assignMode === "assign" ? "Worker assigned successfully" : "Worker reassigned successfully");
      setAssignMode(null);
      dispatch(fetchManagerIssues());
    } catch (requestError) {
      toast.error(String(requestError));
    }
  };

  const doClose = async (issue) => {
    try {
      await dispatch(closeManagerIssue({ id: issue._id })).unwrap();
      toast.success("Issue closed");
      dispatch(fetchManagerIssues());
    } catch (requestError) {
      toast.error(String(requestError));
    }
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />

      <ManagerPageShell
        eyebrow="Issue Resolution"
        title="Run the service desk with the same manager operations language."
        description="Review resident and community issues, assign workers, and keep escalations visible without falling back to old isolated card styles."
        chips={[`${stats.total} issues tracked`, `${stats.pending} waiting for assignment`]}
        actions={
          <ManagerActionButton variant="secondary" onClick={() => dispatch(fetchManagerIssues())}>
            <RefreshCw size={16} />
            Refresh queue
          </ManagerActionButton>
        }
      >
        <div className="ue-stat-grid">
          <StatCard label="Total Issues" value={stats.total} icon={<BarChart3 size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
          <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={22} />} iconColor="#d95d4f" iconBg="#feefed" />
          <StatCard label="Payment Pending" value={stats.paymentPending} icon={<CheckCircle size={22} />} iconColor="#8b5cf6" iconBg="#f5f3ff" />
          <StatCard label="Resident" value={stats.resident} icon={<Users size={22} />} iconColor="#5b6472" iconBg="#f2f4f8" />
          <StatCard label="Community" value={stats.community} icon={<Building2 size={22} />} iconColor="#a78bfa" iconBg="#f3edff" />
        </div>

        <ManagerSection
          eyebrow="Insights"
          title="Issue distribution"
          description="Track issue mix by status and priority before assigning workers."
        >
          <div className="manager-ui-two-column">
            <GraphPie
              title="Status split"
              subtitle="All issues in manager scope"
              data={statusChartData}
              colors={[...UE_CHART_PALETTE, UE_CHART_COLORS.danger]}
            />
            <GraphBar
              title="Priority load"
              subtitle="Count by urgency level"
              xKey="name"
              data={priorityChartData}
              bars={[{ key: "count", label: "Issues", color: UE_CHART_COLORS.slate }]}
            />
          </div>
        </ManagerSection>

        <ManagerSection
          eyebrow="Queue"
          title="Issue workbench"
          description="Filter by role, status, priority, and date range before opening an issue card."
        >
          <ManagerToolbar>
            <Tabs
              variant="pill"
              tabs={[
                { label: "Resident Issues", value: "Resident", count: stats.resident },
                { label: "Community Issues", value: "Community", count: stats.community },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
          </ManagerToolbar>

          <ManagerToolbar>
            <ManagerToolbarGrow>
              <SearchBar
                placeholder="Search title, category, ID, or location..."
                value={filters.search}
                onChange={(value) => setFilter("search", value)}
              />
            </ManagerToolbarGrow>
            <Dropdown
              options={[
                { label: "All Status", value: "All" },
                { label: "Pending", value: "Pending Assignment" },
                { label: "Assigned", value: "Assigned" },
                { label: "In Progress", value: "In Progress" },
                { label: "Reopened", value: "Reopened" },
                { label: "Resolved", value: "Resolved (Awaiting Confirmation)" },
                { label: "Payment Pending", value: "Payment Pending" },
                { label: "Closed", value: "Closed" },
              ]}
              selected={filters.status}
              onChange={(value) => setFilter("status", value)}
              width="180px"
            />
            <Dropdown
              options={[
                { label: "All Priority", value: "All" },
                { label: "Low", value: "Low" },
                { label: "Normal", value: "Normal" },
                { label: "High", value: "High" },
                { label: "Urgent", value: "Urgent" },
              ]}
              selected={filters.priority}
              onChange={(value) => setFilter("priority", value)}
              width="160px"
            />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilter("dateFrom", event.target.value)}
              className="form-control"
              style={{ maxWidth: 170, borderRadius: 12, borderColor: "#d6c6f4" }}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilter("dateTo", event.target.value)}
              className="form-control"
              style={{ maxWidth: 170, borderRadius: 12, borderColor: "#d6c6f4" }}
            />
          </ManagerToolbar>

          {error ? <div className="manager-ui-empty text-danger">Error: {error}</div> : null}

          {loading ? (
            <div className="manager-ui-empty"><Loader label="Loading issues..." /></div>
          ) : activeIssues.length > 0 ? (
            <ManagerRecordGrid>
              {activeIssues.map((issue, index) => (
                <IssueCard
                  key={issue._id}
                  issue={issue}
                  index={index}
                  onView={openDetails}
                  onAssign={openAssign}
                  onReassign={openReassign}
                  onClose={doClose}
                  canAssign={canAssign}
                  canReassign={canReassign}
                />
              ))}
            </ManagerRecordGrid>
          ) : (
            <div className="manager-ui-empty">
              No {activeTab.toLowerCase()} issues match the current filters.
            </div>
          )}
        </ManagerSection>
      </ManagerPageShell>

      <IssueDetailsModal
        issue={previewIssue}
        isOpen={previewOpen}
        onClose={closeDetails}
        canAssign={canAssign}
        canReassign={canReassign}
        onAssign={openAssign}
        onReassign={openReassign}
      />

      <WorkerAssignModal
        mode={assignMode || "assign"}
        issue={previewIssue}
        workers={workers}
        workersLoading={workersLoading}
        isOpen={!!assignMode}
        onClose={() => setAssignMode(null)}
        onSubmit={handleWorkerAction}
      />
    </>
  );
};
