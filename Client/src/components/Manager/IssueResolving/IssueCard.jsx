import React from "react";
import { EntityCard } from "../../shared";

const DETAIL_ROWS = [
    { label: "Category", key: "category", fallback: "-" },
    { label: "Priority", key: "priority", fallback: "Normal" },
    { label: "Location", key: "location", fallback: "-" },
];

const workerDisplay = (w) =>
    w ? w.name || w.email || w._id?.slice(-4) : "Unassigned";

const formatIssueDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

export const IssueCard = ({ issue, onView, onAssign, onReassign, onClose, canAssign, canReassign, index = 0 }) => (
    <EntityCard
        id={issue.issueID || issue._id.slice(-6)}
        status={issue.status}
        title={issue.title || issue.category || "Untitled Issue"}
        className="issue-card"
        index={index}
        onClick={() => onView(issue)}
        details={[
            ...DETAIL_ROWS.map(({ label, key, fallback }) => ({ label, value: issue[key] || fallback })),
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
