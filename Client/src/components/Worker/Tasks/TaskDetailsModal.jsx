import React from "react";
import { Modal, Input } from "../../shared";
import { STATUS_ASSIGNED, STATUS_IN_PROGRESS, STATUS_RESOLVED } from "./taskUtils";

const DETAIL_FIELDS = [
    { label: "Title", render: (t) => t.title || "Untitled Task" },
    { label: "Status", render: (t) => <span className={`status-badge ${t.status?.toLowerCase().replace(/\s+/g, "-")}`}>{t.status}</span> },
    { label: "Priority", render: (t) => <span className={`priority-badge ${t.priority?.toLowerCase()}`}>{t.priority}</span> },
    { label: "Category", render: (t) => t.category },
    { label: "Location", render: (t) => t.location || "N/A" },
    { label: "Created", render: (t) => t.createdAt ? new Date(t.createdAt).toLocaleString() : "N/A" },
    { label: "Description", render: (t) => t.description || "No description provided.", full: true },
    {
        label: "Resident",
        render: (t) => {
            const r = t.resident;
            const name = r?.residentFirstname && r?.residentLastname
                ? `${r.residentFirstname} ${r.residentLastname}` : r?.name || "Unknown";
            return `${name}${r?.uCode ? ` (${r.uCode})` : ""}`;
        },
        full: true,
    },
];

export const TaskDetailsModal = ({
    task, isOpen, onClose,
    estimatedCost, setEstimatedCost,
    actionLoading, onUpdateStatus, onMisassigned,
}) => (
    <Modal
        isOpen={isOpen && !!task}
        onClose={onClose}
        title="Task Details"
        size="lg"
        footer={
            <>
                <button className="btn-secondary" onClick={onClose}>Close</button>
                {task?.status === STATUS_ASSIGNED && (
                    <>
                        <button className="btn-primary" disabled={actionLoading} onClick={() => { onUpdateStatus(task._id, STATUS_IN_PROGRESS); onClose(); }}>Start Task</button>
                        <button className="btn-danger" disabled={actionLoading} onClick={() => { onMisassigned(task._id); onClose(); }}>Mark Misassigned</button>
                    </>
                )}
                {task?.status === STATUS_IN_PROGRESS && (
                    <button className="btn-success" disabled={actionLoading} onClick={() => { onUpdateStatus(task._id, STATUS_RESOLVED, estimatedCost); onClose(); }}>Mark Complete</button>
                )}
            </>
        }
    >
        {task && (
            <div className="popup-body">
                <div className="details-grid">
                    {DETAIL_FIELDS.map(({ label, render, full }) => (
                        <div className={`detail-item${full ? " full" : ""}`} key={label}>
                            <span className="detail-label">{label}</span>
                            <span className="detail-value">{render(task)}</span>
                        </div>
                    ))}
                    {task.remarks && (
                        <div className="detail-item full">
                            <span className="detail-label">Remarks</span>
                            <span className="detail-value">{task.remarks}</span>
                        </div>
                    )}
                </div>
                {task.status === STATUS_IN_PROGRESS && (
                    <Input type="number" label="Estimated Cost ($)" id="estimatedCost" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} min={0} step="0.01" placeholder="Enter estimated cost" style={{ marginTop: 12 }} />
                )}
            </div>
        )}
    </Modal>
);
