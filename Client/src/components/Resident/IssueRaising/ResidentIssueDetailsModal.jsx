import React from "react";
import { Modal, Textarea, Select } from "../../shared";
import { StatusTracker } from "./StatusTracker";

const DETAIL_FIELDS = [
    { label: "Issue ID", render: (i) => i.issueID || `#${i._id?.slice(-6)}`, icon: null },
    { label: "Status", render: (i) => <span className={`status-badge status-${i.status}`}>{i.status}</span>, icon: null },
    { label: "Title", render: (i) => i.title, icon: "bi-card-heading" },
    { label: "Category", render: (i) => <>{i.category}{i.otherCategory && <span className="text-muted ms-2">({i.otherCategory})</span>}</>, icon: "bi-tag" },
    { label: "Assigned Worker", render: (i) => i.workerAssigned ? `Worker ID: ${i.workerAssigned?.toString().slice(-6)}` : <span className="text-muted">Not Assigned</span>, icon: "bi-person-badge" },
    { label: "Auto Assigned", render: (i) => i.autoAssigned ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>, icon: "bi-lightning-charge" },
    { label: "Priority", render: (i) => <span className={`priority-${i.priority?.toLowerCase()}`}>{i.priority} <span style={{ fontSize: "11px", color: "#666" }}>(Auto-determined)</span></span>, icon: "bi-exclamation-circle" },
    { label: "Raised On", render: (i) => new Date(i.createdAt).toLocaleDateString("en-IN"), icon: "bi-calendar" },
];

const CONDITIONAL_FIELDS = [
    { label: "Location", key: "location", icon: "bi-geo-alt" },
    { label: "Resolved On", key: "resolvedAt", icon: "bi-check-circle", className: "text-success", render: (v) => new Date(v).toLocaleDateString("en-IN") },
];

/**
 * Details modal for a single issue with status tracker, detail grid, and feedback form.
 */
export const ResidentIssueDetailsModal = ({
    issue,
    isOpen,
    onClose,
    onConfirm,
    onReject,
    feedbackText,
    setFeedbackText,
    feedbackRating,
    setFeedbackRating,
    feedbackSubmitting,
    onFeedbackSubmit,
}) => (
    <Modal
        isOpen={isOpen && !!issue}
        onClose={onClose}
        title="Issue Details"
        size="xl"
        footer={
            <>
                {issue?.categoryType === "Resident" &&
                    issue?.status?.trim().toLowerCase() === "resolved (awaiting confirmation)" && (
                        <>
                            <button className="btn btn-success" onClick={() => onConfirm(issue._id)}>
                                <i className="bi bi-check-circle" /> Approve Resolution
                            </button>
                            <button className="btn btn-danger" onClick={() => onReject(issue._id)}>
                                <i className="bi bi-x-circle" /> Reject Resolution
                            </button>
                        </>
                    )}
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </>
        }
    >
        {issue && (
            <div className="popup-body">
                <StatusTracker issue={issue} />

                <div className="ir-details-grid shadow-sm">
                    {DETAIL_FIELDS.map(({ label, render, icon }) => (
                        <div className="detail-item" key={label}>
                            {icon && <i className={`bi ${icon} text-primary`} />}
                            <div>
                                <span className="detail-label">{label}</span>
                                <span className="detail-value">{render(issue)}</span>
                            </div>
                        </div>
                    ))}

                    {/* Payment status */}
                    <div className="detail-item">
                        <i className="bi bi-cash-coin text-primary" />
                        <div>
                            <span className="detail-label">Payment Status</span>
                            <span className="detail-value">{issue.paymentStatus || <span className="text-muted">N/A</span>}</span>
                        </div>
                    </div>

                    {/* Description (full width) */}
                    <div className="detail-item col-span-2">
                        <i className="bi bi-card-text text-primary" />
                        <div>
                            <span className="detail-label">Description</span>
                            <span className="detail-value">{issue.description}</span>
                        </div>
                    </div>

                    {/* Conditional fields */}
                    {CONDITIONAL_FIELDS.map(({ label, key, icon, className, render: renderFn }) =>
                        issue[key] ? (
                            <div className="detail-item" key={key}>
                                <i className={`bi ${icon} ${className || "text-primary"}`} />
                                <div>
                                    <span className="detail-label">{label}</span>
                                    <span className="detail-value">{renderFn ? renderFn(issue[key]) : issue[key]}</span>
                                </div>
                            </div>
                        ) : null
                    )}
                </div>

                {/* Feedback form for Payment Pending issues */}
                {issue.categoryType === "Resident" && issue.status === "Payment Pending" && !issue.feedback && (
                    <div style={{ width: "100%", marginTop: 16 }}>
                        <Textarea
                            label="Feedback"
                            id="feedbackText"
                            rows={3}
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            disabled={feedbackSubmitting}
                            placeholder="Share your feedback about this issue resolution..."
                        />
                        <Select
                            label="Rating"
                            id="feedbackRating"
                            value={feedbackRating}
                            onChange={(e) => setFeedbackRating(Number(e.target.value))}
                            disabled={feedbackSubmitting}
                            options={[5, 4, 3, 2, 1].map((r) => ({ label: `${r} Star${r > 1 ? "s" : ""}`, value: r }))}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={onFeedbackSubmit}
                            disabled={feedbackSubmitting || !feedbackText}
                        >
                            <i className="bi bi-send" /> Submit Feedback
                        </button>
                    </div>
                )}
            </div>
        )}
    </Modal>
);
