import React from "react";
import { Modal } from "../../shared";

const workerDisplay = (w) =>
    w ? w.name || w.email || w._id : "Unassigned";

const residentDisplay = (r) =>
    r ? `${r.residentFirstname || ""} ${r.residentLastname || ""}`.trim() || "-" : "-";

const FIELDS = [
    { label: "Status", render: (i) => i.status || "Unknown" },
    { label: "Priority", render: (i) => i.priority || "Normal" },
    { label: "Category", render: (i) => i.category || "-" },
    { label: "Type", render: (i) => i.categoryType || "-" },
    { label: "Location", render: (i) => i.location || "-" },
    { label: "Created", render: (i) => new Date(i.createdAt).toLocaleString() },
    { label: "Description", render: (i) => i.description || "-", full: true },
    { label: "Worker", render: (i) => workerDisplay(i.workerAssigned) },
    { label: "Resident", render: (i) => residentDisplay(i.resident) },
    { label: "Auto-Assigned", render: (i) => (i.autoAssigned ? "Yes" : "No") },
    { label: "Deadline", render: (i) => (i.deadline ? new Date(i.deadline).toLocaleDateString() : "-") },
];

export const IssueDetailsModal = ({ issue, isOpen, onClose, canAssign, canReassign, onAssign, onReassign }) => (
    <Modal
        isOpen={isOpen && !!issue}
        onClose={onClose}
        title={issue?.title || issue?.category || "Issue Details"}
        size="lg"
        footer={
            <>
                <button className="btn-secondary" onClick={onClose}>Close</button>
                {canAssign(issue) && <button className="btn-primary" onClick={() => onAssign(issue)}>Assign Worker</button>}
                {canReassign(issue) && <button className="btn-primary" onClick={() => onReassign(issue)}>Reassign Worker</button>}
            </>
        }
    >
        {issue && (
            <div className="details-grid">
                {FIELDS.map(({ label, render, full }) => (
                    <div className={`detail-item${full ? " full" : ""}`} key={label}>
                        <span className="detail-label">{label}</span>
                        <span className="detail-value">{render(issue)}</span>
                    </div>
                ))}
                {issue.remarks && (
                    <div className="detail-item full">
                        <span className="detail-label">Remarks</span>
                        <span className="detail-value">{issue.remarks}</span>
                    </div>
                )}
            </div>
        )}
    </Modal>
);
