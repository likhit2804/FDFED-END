import { EntityCard, renderPriorityPill } from "../../shared";

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
