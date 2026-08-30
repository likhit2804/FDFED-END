import React from "react";
import { IssueDetailsModal as UnifiedIssueDetailsModal, Input } from "../../shared";
import { Play, CheckCircle2, AlertOctagon } from "lucide-react";
import { STATUS_ASSIGNED, STATUS_IN_PROGRESS, STATUS_RESOLVED } from "./taskUtils";

export const TaskDetailsModal = ({
    task,
    isOpen,
    onClose,
    estimatedCost,
    setEstimatedCost,
    actionLoading,
    onUpdateStatus,
    onMisassigned,
}) => {
    if (!isOpen || !task) return null;

    const actions = [];
    if (task.status === STATUS_ASSIGNED) {
        actions.push({
            label: "Start Task",
            variant: "primary",
            icon: <Play size={15} />,
            disabled: actionLoading,
            onClick: () => {
                onUpdateStatus(task._id, STATUS_IN_PROGRESS);
                onClose();
            },
        });
        actions.push({
            label: "Mark Misassigned",
            variant: "danger",
            icon: <AlertOctagon size={15} />,
            disabled: actionLoading,
            onClick: () => {
                onMisassigned(task._id);
                onClose();
            },
        });
    }

    if (task.status === STATUS_IN_PROGRESS) {
        actions.push({
            label: "Mark Complete",
            variant: "success",
            icon: <CheckCircle2 size={15} />,
            disabled: actionLoading,
            onClick: () => {
                onUpdateStatus(task._id, STATUS_RESOLVED, estimatedCost);
                onClose();
            },
        });
    }

    return (
        <UnifiedIssueDetailsModal
            issue={task}
            isOpen={isOpen}
            onClose={onClose}
            role="worker"
            actions={actions}
        >
            {task.status === STATUS_IN_PROGRESS && (
                <div className="p-3 rounded-3 bg-light border mb-3">
                    <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: "13px" }}>
                        Work Completion & Cost
                    </h6>
                    {task.categoryType === "Community" ||
                    task.category === "Waste Management" ||
                    task.category === "Security" ? (
                        <div className="text-muted" style={{ fontSize: "12.5px" }}>
                            <span className="badge bg-success-subtle text-success border border-success-subtle me-2">
                                Free Service
                            </span>
                            This service is covered under standard society maintenance dues. No repair invoice will be charged to the resident.
                        </div>
                    ) : (
                        <>
                            <Input
                                type="number"
                                label="Material / Replacement Parts Cost (₹)"
                                id="estimatedCost"
                                value={estimatedCost}
                                onChange={(e) => setEstimatedCost(e.target.value)}
                                min={0}
                                step="1"
                                placeholder="Enter 0 if no parts/materials were replaced (e.g. 250)"
                            />
                            <div className="text-muted mt-1" style={{ fontSize: "11.5px" }}>
                                Enter ₹0 if this was a minor repair requiring no purchased materials.
                            </div>
                        </>
                    )}
                </div>
            )}
            {task.remarks && (
                <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: "10.5px" }}>
                        Manager Remarks & Special Instructions
                    </div>
                    <div className="text-dark" style={{ fontSize: "13px" }}>
                        {task.remarks}
                    </div>
                </div>
            )}
        </UnifiedIssueDetailsModal>
    );
};

export default TaskDetailsModal;
