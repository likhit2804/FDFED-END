import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle, Clock, FileText, Plus, XCircle } from "lucide-react";
import LeaveApplyForm from "../LeaveApplyForm";
import { fetchLeaves } from "../../slices/leaveSlice";
import { useSocket } from "../../hooks/useSocket";
import { EmptyState, StatCard, StatusBadge, Tabs } from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
} from "../shared/roleUI";
import "../../assets/css/Leave.css";

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function WorkerLeaveList() {
  const dispatch = useDispatch();
  const leaves = useSelector((state) => state.leave?.leaves || []);
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  // Real-time synchronization for leave updates
  useSocket("leave:updated", (payload) => {
    console.log("⚡ [WorkerLeaveList] Received leave:updated event:", payload);
    dispatch(fetchLeaves());
  });

  const leaveSummary = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === "pending").length,
    approved: leaves.filter((leave) => leave.status === "approved").length,
    rejected: leaves.filter((leave) => leave.status === "rejected").length,
  }), [leaves]);

  const filteredLeaves = useMemo(() => {
    if (filter === "all") return leaves;
    return leaves.filter((leave) => String(leave.status).toLowerCase() === filter);
  }, [leaves, filter]);

  const tabs = [
    { label: "All", value: "all", count: leaveSummary.total },
    { label: "Pending", value: "pending", count: leaveSummary.pending },
    { label: "Approved", value: "approved", count: leaveSummary.approved },
    { label: "Rejected", value: "rejected", count: leaveSummary.rejected },
  ];

  return (
    <ManagerPageShell
      eyebrow="Worker Desk"
      title="My Leave Requests"
      description="Track and manage your scheduled time-off requests with real-time approval status."
      chips={[`${leaveSummary.total} requests submitted`, `${leaveSummary.pending} pending approval`]}
      actions={
        <ManagerActionButton variant="primary" onClick={() => setApplyOpen(true)}>
          <Plus size={16} />
          Apply for Leave
        </ManagerActionButton>
      }
    >
      <div className="ue-stat-grid">
        <StatCard
          label="Total Requests"
          value={leaveSummary.total}
          icon={<FileText size={22} />}
          iconColor="var(--info-600)"
          iconBg="var(--info-soft)"
        />
        <StatCard
          label="Pending"
          value={leaveSummary.pending}
          icon={<Clock size={22} />}
          iconColor="var(--warning-700)"
          iconBg="var(--warning-soft)"
        />
        <StatCard
          label="Approved"
          value={leaveSummary.approved}
          icon={<CheckCircle size={22} />}
          iconColor="var(--success-500)"
          iconBg="var(--success-soft)"
        />
        <StatCard
          label="Rejected"
          value={leaveSummary.rejected}
          icon={<XCircle size={22} />}
          iconColor="var(--danger-500)"
          iconBg="var(--danger-soft)"
        />
      </div>

      <ManagerSection
        eyebrow="Time Off"
        title="Submitted Applications"
        description="Review all your past and pending leave requests, duration, and manager feedback."
      >
        <ManagerToolbar>
          <Tabs tabs={tabs} active={filter} onChange={setFilter} variant="pill" />
        </ManagerToolbar>

        {filteredLeaves.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No Leave Requests Found"
            sub={
              filter === "all"
                ? "You haven't submitted any leave requests yet. Apply using the button above."
                : `No ${filter} leave requests found.`
            }
          />
        ) : (
          <ManagerRecordGrid>
            {filteredLeaves.map((leave) => {
              const days = calculateDays(leave.startDate, leave.endDate);
              const typeLabel = leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : "General";
              return (
                <ManagerRecordCard
                  key={leave._id}
                  title={`${typeLabel} Leave`}
                  subtitle={`Duration: ${days} day${days > 1 ? "s" : ""}`}
                  status={<StatusBadge status={leave.status} />}
                  meta={[
                    { label: "Leave Type", value: typeLabel },
                    { label: "Duration", value: `${days} day${days > 1 ? "s" : ""}` },
                    { label: "Period", value: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}` },
                    { label: "Applied On", value: formatDateTime(leave.appliedAt) },
                    { label: "Decision On", value: leave.decisionAt ? formatDateTime(leave.decisionAt) : "Pending" },
                    { label: "Reason", value: leave.reason || "No reason provided" },
                  ]}
                  footer={
                    leave.notes ? (
                      <div className="manager-ui-stack">
                        <p className="manager-ui-note">
                          <strong>Manager Notes:</strong> {leave.notes}
                        </p>
                      </div>
                    ) : null
                  }
                />
              );
            })}
          </ManagerRecordGrid>
        )}
      </ManagerSection>

      <LeaveApplyForm
        isOpen={applyOpen}
        onClose={() => {
          setApplyOpen(false);
          dispatch(fetchLeaves());
        }}
      />
    </ManagerPageShell>
  );
}
