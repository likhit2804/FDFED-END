import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
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
import { Dropdown, SearchBar, StatCard, Tabs } from "../shared";
import { useTabFilters } from "./IssueResolving/useTabFilters";
import { IssueCard } from "./IssueResolving/IssueCard";
import { UE_CHART_COLORS, UE_CHART_PALETTE } from "../shared/chartPalette";
import { buildCategoryCountData } from "../shared/chartDataUtils";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
  ManagerToolbarGrow,
} from "./ui";

const LazyGraphBar = lazy(() => import("../shared/GraphBar"));
const LazyGraphPie = lazy(() => import("../shared/GraphPie"));
const LazyIssueDetailsModal = lazy(() =>
  import("./IssueResolving/IssueDetailsModal").then((module) => ({
    default: module.IssueDetailsModal,
  })),
);
const LazyWorkerAssignModal = lazy(() =>
  import("./IssueResolving/WorkerAssignModal").then((module) => ({
    default: module.WorkerAssignModal,
  })),
);

const ISSUE_STATUS_ORDER = [
  "Pending",
  "In Progress",
  "Awaiting Closure",
  "Closed",
  "Rejected",
];

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
    const toGroupedIssueStatus = (statusValue) => {
      const status = String(statusValue || "").trim().toLowerCase();

      if (status === "pending assignment" || status === "assigned") return "Pending";
      if (status === "in progress" || status === "reopened" || status === "on hold") return "In Progress";
      if (status === "resolved (awaiting confirmation)" || status === "payment pending") {
        return "Awaiting Closure";
      }
      if (status === "closed" || status === "auto-closed" || status === "payment completed") {
        return "Closed";
      }
      if (status === "rejected") return "Rejected";

      return "Unknown";
    };

    return buildCategoryCountData(
      issues,
      (issue) => issue?.status,
      {
        order: ISSUE_STATUS_ORDER,
        normalize: (statusLabel) => toGroupedIssueStatus(statusLabel),
      },
    );
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
          <StatCard label="Total Issues" value={stats.total} icon={<BarChart3 size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
          <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
          <StatCard label="Payment Pending" value={stats.paymentPending} icon={<CheckCircle size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
          <StatCard label="Resident" value={stats.resident} icon={<Users size={22} />} iconColor="var(--text-subtle)" iconBg="var(--surface-2)" />
          <StatCard label="Community" value={stats.community} icon={<Building2 size={22} />} iconColor="var(--brand-600)" iconBg="var(--info-soft)" />
        </div>

        <ManagerSection
          eyebrow="Insights"
          title="Issue distribution"
          description="Track issue mix by status and priority before assigning workers."
        >
          <div className="manager-ui-two-column">
            <Suspense fallback={<Loader label="Loading status chart..." size={24} />}>
              <LazyGraphPie
                title="Status split"
                subtitle="All issues in manager scope"
                data={statusChartData}
                colors={[...UE_CHART_PALETTE, UE_CHART_COLORS.danger]}
              />
            </Suspense>
            <Suspense fallback={<Loader label="Loading priority chart..." size={24} />}>
              <LazyGraphBar
                title="Priority load"
                subtitle="Count by urgency level"
                xKey="name"
                data={priorityChartData}
                bars={[{ key: "count", label: "Issues", color: UE_CHART_COLORS.slate }]}
              />
            </Suspense>
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
              className="form-control manager-ui-date-input"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilter("dateTo", event.target.value)}
              className="form-control manager-ui-date-input"
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

      {previewOpen ? (
        <Suspense fallback={<Loader label="Loading issue details..." size={24} />}>
          <LazyIssueDetailsModal
            issue={previewIssue}
            isOpen={previewOpen}
            onClose={closeDetails}
            canAssign={canAssign}
            canReassign={canReassign}
            onAssign={openAssign}
            onReassign={openReassign}
          />
        </Suspense>
      ) : null}

      {assignMode ? (
        <Suspense fallback={<Loader label="Loading assignment panel..." size={24} />}>
          <LazyWorkerAssignModal
            mode={assignMode || "assign"}
            issue={previewIssue}
            workers={workers}
            workersLoading={workersLoading}
            isOpen={!!assignMode}
            onClose={() => setAssignMode(null)}
            onSubmit={handleWorkerAction}
          />
        </Suspense>
      ) : null}
    </>
  );
};

