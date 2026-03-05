import React from "react";
import { EntityCard } from "../../shared";

/**
 * Single issue card for the resident issue list grid.
 */
export const ResidentIssueCard = ({ issue, onViewDetails }) => (
    <EntityCard
        id={`#${issue?._id?.slice(-6)}`}
        status={issue?.status}
        statusClass={`status-badge status-${issue?.status || ""}`}
        className={`ir-issue-card ${issue?.status || ""}`}
        details={[
            { label: "Title", value: issue?.title || "-" },
            { label: "Category", value: issue?.category || "-" },
            {
                label: "Priority",
                render: () => (
                    <span className={`priority-${issue?.priority?.toLowerCase()}`}>
                        {issue?.priority || "Auto-determined"}
                        {issue?.priority && <span style={{ fontSize: "11px", color: "#666", marginLeft: "4px" }}>(Auto)</span>}
                    </span>
                ),
            },
            {
                label: "Raised On",
                value: issue?.createdAt
                    ? new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "-",
            },
        ]}
        actions={[
            { label: "View Details", onClick: () => onViewDetails(issue), variant: "view", icon: <i className="bi bi-eye" /> },
        ]}
    />
);
