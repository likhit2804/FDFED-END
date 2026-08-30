import React from "react";
import { EntityCard } from "../../shared";
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Helper to get SLA and color-coded priority badge
 */
function renderPriorityWithSla(priority) {
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
                <ShieldAlert size={12} /> Urgent • 30m SLA
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
                <AlertTriangle size={12} /> High • 4h SLA
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
            <Clock size={12} /> Normal • 24h SLA
        </span>
    );
}

/**
 * Single issue card for the resident issue list grid.
 */
export const ResidentIssueCard = ({ issue, onViewDetails, index = 0 }) => (
    <EntityCard
        id={issue.issueID ? `#${issue.issueID}` : `#${issue?._id?.slice(-6).toUpperCase()}`}
        status={issue?.status}
        statusClass={`status-badge status-${(issue?.status || "").toLowerCase().replace(/[\s()]/g, "-")}`}
        title={issue?.title || issue?.category || "Untitled Issue"}
        className={`ir-issue-card ${issue?.status || ""}`}
        index={index}
        badges={renderPriorityWithSla(issue?.priority)}
        details={[
            { label: "Category", value: issue?.category || "-" },
            { label: "Location", value: issue?.location || "My Flat" },
            {
                label: "Raised On",
                value: issue?.createdAt
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
                label: "View Details",
                onClick: () => onViewDetails(issue),
                variant: "secondary",
                icon: <i className="bi bi-eye" />,
            },
        ]}
    />
);
