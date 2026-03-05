import React from "react";

// Status flow definitions
const STATUS_FLOW_RESIDENT = [
    { key: "Pending Assignment", label: "Pending", icon: "bi-hourglass-split" },
    { key: "Assigned", label: "Assigned", icon: "bi-person-check" },
    { key: "In Progress", label: "In Progress", icon: "bi-gear" },
    { key: "Resolved (Awaiting Confirmation)", label: "Awaiting Confirmation", icon: "bi-check-circle" },
    { key: "Payment Pending", label: "Payment Pending", icon: "bi-cash-coin" },
    { key: "Closed", label: "Closed", icon: "bi-check-circle-fill" },
    { key: "Payment Completed", label: "Payment Completed", icon: "bi-cash-stack" },
];

const STATUS_FLOW_COMMUNITY = [
    { key: "Pending Assignment", label: "Pending", icon: "bi-hourglass-split" },
    { key: "Assigned", label: "Assigned", icon: "bi-person-check" },
    { key: "In Progress", label: "In Progress", icon: "bi-gear" },
    { key: "Resolved", label: "Resolved", icon: "bi-check-circle" },
    { key: "Closed", label: "Closed", icon: "bi-check-circle-fill" },
];

const SPECIAL_STATUSES = ["On Hold", "Reopened", "Rejected", "Auto-Closed"];

const getStatusIndex = (status, categoryType) => {
    const flow = categoryType === "Community" ? STATUS_FLOW_COMMUNITY : STATUS_FLOW_RESIDENT;
    const index = flow.findIndex((s) => s.key === status);
    return index !== -1 ? index : 0;
};

/**
 * Visual progress tracker for issue status.
 */
export const StatusTracker = ({ issue }) => {
    const flow = issue.categoryType === "Community" ? STATUS_FLOW_COMMUNITY : STATUS_FLOW_RESIDENT;
    const currentIndex = getStatusIndex(issue.status, issue.categoryType);
    const progressPercent = (currentIndex / (flow.length - 1)) * 100;

    return (
        <div className="status-tracker">
            <div className="tracker-container">
                <div className="tracker-line">
                    <div className="tracker-progress" style={{ width: `${progressPercent}%` }} />
                </div>
                {flow.map((step, index) => {
                    const stepState = index < currentIndex ? "completed" : index === currentIndex ? "active" : "pending";
                    return (
                        <div key={step.key} className={`tracker-step ${stepState}`}>
                            <div className="tracker-icon-wrapper">
                                <i className={`bi ${step.icon} tracker-icon`} />
                            </div>
                            <span className="tracker-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>
            {SPECIAL_STATUSES.includes(issue.status) && (
                <div className="text-center">
                    <span className={`special-status-badge ${issue.status.toLowerCase().replace(" ", "-")}`}>
                        <i className="bi bi-exclamation-circle" />
                        {issue.status}
                    </span>
                </div>
            )}
        </div>
    );
};
