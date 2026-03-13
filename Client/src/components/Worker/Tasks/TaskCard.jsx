import React from "react";
import { EntityCard } from "../../shared";
import { formatDate, STATUS_ASSIGNED, STATUS_IN_PROGRESS } from "./taskUtils";

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
                badges={<span className={`priority-badge ${task.priority?.toLowerCase()}`}>{task.priority}</span>}
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
            id={`#${task._id.slice(-6)}`}
            status={task.status}
            statusClass={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, "-")}`}
            title={task.title || "Untitled Task"}
            className="task-card"
            index={index}
            onClick={() => onOpenModal(task)}
            badges={<span className={`priority-badge ${task.priority?.toLowerCase()}`}>{task.priority}</span>}
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
