import React from "react";
import { EntityCard } from "../../shared";
import { ShieldAlert, AlertTriangle, Clock } from "lucide-react";

function renderPriorityPill(priority) {
    const p = (priority || "Normal").toLowerCase();
    if (p === "urgent") {
        return (
            <span
                className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold"
                style={{
                    fontSize: "11.5px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    color: "var(--danger-500, #ef4444)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
            >
                <ShieldAlert size={12} /> Urgent • 30m
            </span>
        );
    }
    if (p === "high") {
        return (
            <span
                className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold"
                style={{
                    fontSize: "11.5px",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    color: "var(--warning-600, #d97706)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
            >
                <AlertTriangle size={12} /> High • 4h
            </span>
        );
    }
    return (
        <span
            className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-medium"
            style={{
                fontSize: "11.5px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                color: "var(--brand-500, #3b82f6)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
            }}
        >
            <Clock size={12} /> Normal
        </span>
    );
}

const workerDisplay = (w) =>
    w ? `${w.name || w.email || w._id?.slice(-4)} (${Array.isArray(w.jobRole) ? w.jobRole.join(", ") : w.jobRole || "Staff"})` : "Unassigned";

const formatIssueDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    });
};

export const IssueCard = ({ issue, onView, onAssign, onReassign, onClose, canAssign, canReassign, index = 0 }) => (
    <EntityCard
        id={issue.issueID ? `#${issue.issueID}` : `#${issue._id?.slice(-6).toUpperCase()}`}
        status={issue.status}
        statusClass={`status-badge status-${(issue.status || "").toLowerCase().replace(/[\s()]/g, "-")}`}
        title={issue.title || issue.category || "Untitled Issue"}
        className="issue-card"
        index={index}
        onClick={() => onView(issue)}
        badges={renderPriorityPill(issue.priority)}
        details={[
            { label: "Category", value: issue.category || "-" },
            { label: "Location", value: issue.location || "-" },
            { label: "Worker", value: workerDisplay(issue.workerAssigned) },
            { label: "Assignment", value: issue.autoAssigned ? "Auto" : "Manual" },
            { label: "Date", value: formatIssueDate(issue.createdAt) },
        ]}
        actions={[
            { label: "Assign", onClick: () => onAssign(issue), variant: "primary", show: canAssign(issue) },
            { label: "Reassign", onClick: () => onReassign(issue), variant: "warning", show: canReassign(issue) },
            { label: "Close", onClick: () => onClose(issue), variant: "danger", show: issue.status !== "Closed" },
        ]}
    />
);
