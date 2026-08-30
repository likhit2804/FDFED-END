import React from "react";
import { EntityCard } from "../../shared";
import { formatDate, STATUS_ASSIGNED, STATUS_IN_PROGRESS } from "./taskUtils";
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

/**
 * Unified task card that renders in either "grid" or "list" mode.
 */
export const TaskCard = ({ task, index, viewMode, onOpenModal, onUpdateStatus }) => {
    if (viewMode === "list") {
        return (
            <EntityCard
                id=""
                status={task.status}
                statusClass={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, "-")}`}
                className="task-list-item"
                compact
                animateFrom="x"
                index={index}
                onClick={() => onOpenModal(task)}
                badges={renderPriorityPill(task.priority)}
                details={[]}
                actions={[
                    { label: "Start", onClick: () => onUpdateStatus(task._id, STATUS_IN_PROGRESS), variant: "primary", show: task.status === STATUS_ASSIGNED },
                    { label: "Complete", onClick: () => onOpenModal(task), variant: "success", show: task.status === STATUS_IN_PROGRESS },
                    { label: "Details", onClick: () => onOpenModal(task), variant: "secondary" },
                ]}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "6px", color: "#0b1220" }}>{task.title || "Untitled Task"}</div>
                    <div style={{ color: "#6b7280", fontSize: "13px" }}>
                        {task.location} • {task.resident?.residentFirstname ? `${task.resident.residentFirstname} ${task.resident.residentLastname}` : task.resident?.name || "Unknown"} • {task.category}
                    </div>
                </div>
            </EntityCard>
        );
    }

    // Grid mode
    return (
        <EntityCard
            id={`#${task._id.slice(-6).toUpperCase()}`}
            status={task.status}
            statusClass={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, "-")}`}
            title={task.title || "Untitled Task"}
            className="task-card"
            index={index}
            onClick={() => onOpenModal(task)}
            badges={renderPriorityPill(task.priority)}
            details={[
                { label: "Category", value: task.category },
                { label: "Location", value: task.location || "N/A" },
                { label: "Deadline", value: formatDate(task.deadline) || "No deadline" },
            ]}
            actions={[
                { label: "Start", onClick: () => onUpdateStatus(task._id, STATUS_IN_PROGRESS), variant: "primary", show: task.status === STATUS_ASSIGNED },
                { label: "Complete", onClick: () => onOpenModal(task), variant: "success", show: task.status === STATUS_IN_PROGRESS },
                { label: "Details", onClick: () => onOpenModal(task), variant: "secondary" },
            ]}
        />
    );
};
