import "../assets/css/Leave.css";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { approveLeave, fetchLeaves, rejectLeave } from "../slices/leaveSlice";
import { useSocket } from "../hooks/useSocket";
import { EmptyState, StatCard, StatusBadge, Tabs, Textarea } from "./shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar
} from "./shared/roleUI";

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

export default function ManagerLeaveList() {
  const dispatch = useDispatch();
  const leaves = useSelector((state) => state.leave?.leaves || []);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  // Real-time synchronization when a worker applies for leave
  useSocket("leave:applied", (payload) => {
    console.log("⚡ [ManagerLeaveList] Received leave:applied event:", payload);
    dispatch(fetchLeaves());
    toast.info("A worker has submitted a new leave application.");
  });

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === "pending").length,
    approved: leaves.filter((leave) => leave.status === "approved").length,
    rejected: leaves.filter((leave) => leave.status === "rejected").length,
  }), [leaves]);

  const filteredLeaves = useMemo(() => {
    if (filter === "all") return leaves;
    return leaves.filter((leave) => String(leave.status).toLowerCase() === filter);
  }, [leaves, filter]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
  };

  const updateLeave = async (mode, id) => {
    setLoading(true);
    try {
      const action = mode === "approve" ? approveLeave : rejectLeave;
      await dispatch(action({ id, notes: notes[id] || "" })).unwrap();
      await dispatch(fetchLeaves()).unwrap();
      setNotes((current) => ({ ...current, [id]: "" }));
      toast.success(
        mode === "approve" ? "Leave approved successfully!" : "Leave rejected."
      );
    } catch (err) {
      console.error(err);
      toast.error(err?.message || err?.error || "Failed to update leave status.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Pending", value: "pending", count: stats.pending },
    { label: "Approved", value: "approved", count: stats.approved },
    { label: "Rejected", value: "rejected", count: stats.rejected },
  ];

  return (
    <ManagerPageShell
      eyebrow="Leaves"
      title="Review and manage worker leave requests."
      description="Approve or reject requests from one desk with clear worker context and decision notes."
      chips={[`${stats.total} requests`, `${stats.pending} pending decisions`]}
    >
      <div className="ue-stat-grid">
        <StatCard label="Total Requests" value={stats.total} icon={<FileText size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
      </div>

      <ManagerSection
        eyebrow="Requests"
        title="Leave approvals"
        description="Open each request, review the worker context, and record notes alongside the final decision."
      >
        <ManagerToolbar>
          <Tabs tabs={tabs} active={filter} onChange={setFilter} variant="pill" />
        </ManagerToolbar>

        {filteredLeaves.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No leave requests"
            sub={
              filter === "all"
                ? "No leave requests are waiting right now."
                : `No ${filter} leave requests found.`
            }
          />
        ) : (
          <ManagerRecordGrid>
            {filteredLeaves.map((leave) => (
              <ManagerRecordCard
                key={leave._id}
                title={leave.worker?.name || leave.worker?.email || "Unknown Worker"}
                subtitle={`Work ID: ${leave.worker?._id || "N/A"}`}
                status={<StatusBadge status={leave.status} />}
                meta={[
                  { label: "Type", value: leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : "-" },
                  { label: "Days", value: `${calculateDays(leave.startDate, leave.endDate)} days` },
                  { label: "Period", value: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}` },
                  { label: "Applied", value: formatDateTime(leave.appliedAt) },
                  { label: "Decision", value: leave.decisionAt ? formatDateTime(leave.decisionAt) : "Pending" },
                  { label: "Reason", value: leave.reason || "No reason provided" },
                ]}
                footer={
                  <div className="manager-ui-stack">
                    {leave.notes ? <p className="manager-ui-note">Notes: {leave.notes}</p> : null}
                    {leave.status === "pending" ? (
                      <Textarea
                        label="Manager notes"
                        placeholder="Add notes for this decision (optional)"
                        rows={2}
                        value={notes[leave._id] || ""}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [leave._id]: event.target.value }))
                        }
                      />
                    ) : null}
                  </div>
                }
                actions={
                  leave.status === "pending" ? (
                    <>
                      <ManagerActionButton variant="primary" onClick={() => updateLeave("approve", leave._id)} disabled={loading}>
                        <CheckCircle size={16} />
                        Approve
                      </ManagerActionButton>
                      <ManagerActionButton variant="danger" onClick={() => updateLeave("reject", leave._id)} disabled={loading}>
                        <XCircle size={16} />
                        Reject
                      </ManagerActionButton>
                    </>
                  ) : null
                }
              />
            ))}
          </ManagerRecordGrid>
        )}
      </ManagerSection>
    </ManagerPageShell>
  );
}
