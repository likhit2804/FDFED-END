import { useState } from "react";
import { IssueDetailsModal, Textarea } from "../../shared";
import { CheckCircle2, XCircle, Star, MessageSquareQuote } from "lucide-react";

/**
 * Details modal for a single issue with integrated Review & Rating on Approval.
 */
export const ResidentIssueDetailsModal = ({
    issue,
    isOpen,
    onClose,
    onConfirm,
    onReject,
}) => {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !issue) return null;

    const isAwaitingConfirmation =
        issue.categoryType === "Resident" &&
        issue.status?.trim().toLowerCase() === "resolved (awaiting confirmation)";

    const handleConfirmClick = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm({ id: issue._id, rating, feedback });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectClick = async () => {
        setIsSubmitting(true);
        try {
            await onReject(issue._id);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const actions = [];
    if (isAwaitingConfirmation) {
        actions.push({
            label: isSubmitting ? "Approving..." : "Approve & Rate Service",
            variant: "success",
            icon: <CheckCircle2 size={16} />,
            disabled: isSubmitting,
            onClick: handleConfirmClick,
        });
        actions.push({
            label: "Reject Resolution",
            variant: "danger",
            icon: <XCircle size={16} />,
            disabled: isSubmitting,
            onClick: handleRejectClick,
        });
    }

    return (
        <IssueDetailsModal
            issue={issue}
            isOpen={isOpen}
            onClose={onClose}
            role="resident"
            actions={actions}
        >
            {/* Integrated Rating & Feedback Form during Approval */}
            {isAwaitingConfirmation && (
                <div
                    style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "14px",
                        padding: "18px 20px",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <h6
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#166534",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Star size={16} className="text-warning" fill="#f59e0b" />
                            Rate & Accept Technician's Work
                        </h6>
                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>
                            Repair Completed
                        </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "#14532d", margin: "0 0 14px 0" }}>
                        Please rate your service experience before approving the resolution. Your feedback helps maintain service quality.
                    </p>

                    {/* Interactive Star Rating */}
                    <div className="mb-3">
                        <label
                            style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                color: "#166534",
                                marginBottom: "6px",
                            }}
                        >
                            Rating ({rating} of 5 Stars)
                        </label>
                        <div className="d-flex align-items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "4px",
                                        cursor: "pointer",
                                        transition: "transform 0.15s ease",
                                    }}
                                >
                                    <Star
                                        size={24}
                                        color={(hoverRating || rating) >= star ? "#f59e0b" : "#cbd5e1"}
                                        fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                        <Textarea
                            label="Feedback & Comments (Optional)"
                            id="residentApprovalFeedback"
                            rows={3}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="How was the technician's punctuality and work quality?..."
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            )}

            {/* Display submitted rating/feedback if already provided */}
            {issue.rating && (
                <div
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "16px 18px",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <MessageSquareQuote size={14} /> Resident Rating & Review
                        </span>
                        <div className="d-flex align-items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={14}
                                    color={s <= issue.rating ? "#f59e0b" : "#cbd5e1"}
                                    fill={s <= issue.rating ? "#f59e0b" : "none"}
                                />
                            ))}
                        </div>
                    </div>
                    {issue.feedback && (
                        <p style={{ margin: 0, fontSize: "13px", color: "#334155", fontStyle: "italic" }}>
                            "{issue.feedback}"
                        </p>
                    )}
                </div>
            )}
        </IssueDetailsModal>
    );
};

export default ResidentIssueDetailsModal;
