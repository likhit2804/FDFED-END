import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";

import { approveLeave, fetchLeaves, rejectLeave } from "../slices/leaveSlice";
import { EmptyState, StatCard, StatusBadge, Textarea } from "./shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
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

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === "pending").length,
    approved: leaves.filter((leave) => leave.status === "approved").length,
    rejected: leaves.filter((leave) => leave.status === "rejected").length,
  }), [leaves]);

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const updateLeave = async (mode, id) => {
    const confirmMessage = mode === "approve" ? "Approve this leave?" : "Reject this leave?";
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const action = mode === "approve" ? approveLeave : rejectLeave;
      await dispatch(action({ id, notes: notes[id] || "" })).unwrap();
      await dispatch(fetchLeaves()).unwrap();
      setNotes((current) => ({ ...current, [id]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to update leave status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagerPageShell
      eyebrow="Leaves"
      title="Review and manage worker leave requests."
      description="Approve or reject requests from one desk without digging through long stacked Bootstrap cards."
      chips={[`${stats.total} requests`, `${stats.pending} pending decisions`]}
    >
      <div className="ue-stat-grid">
        <StatCard label="Total Requests" value={stats.total} icon={<FileText size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
      </div>

      <ManagerSection
        eyebrow="Requests"
        title="Leave approvals"
        description="Open each request, review the worker context, and record notes alongside the final decision."
      >
        {leaves.length === 0 ? (
          <EmptyState icon={<FileText size={48} />} title="No leave requests" sub="No leave requests are waiting right now." />
        ) : (
          <ManagerRecordGrid>
            {leaves.map((leave) => (
              <ManagerRecordCard
                key={leave._id}
                title={leave.worker?.name || leave.worker?.email || "Unknown Worker"}
                subtitle={`Work ID: ${leave.worker?._id || "N/A"}`}
                status={<StatusBadge status={leave.status} />}
                meta={[
                  { label: "Type", value: leave.type || "-" },
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


