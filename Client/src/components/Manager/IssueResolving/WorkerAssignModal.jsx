import React, { useState, useEffect } from "react";
import { Loader } from "../../Loader";
import { Modal, Select, Input, Textarea } from "../../shared";

/**
 * Formats a worker's jobRole (string or array) into a display string.
 */
const formatRole = (w) =>
    Array.isArray(w.jobRole) ? w.jobRole.join(", ") : w.jobRole;

/**
 * Build the <Select> options list, disabling the currently‑assigned and
 * previously‑misassigned workers where applicable.
 */
const buildWorkerOptions = (issue, allWorkers, mode) => {
    const disabledIds = new Set();
    const opts = [];

    // Current / previous worker (disabled)
    if (issue.workerAssigned) {
        disabledIds.add(issue.workerAssigned._id);
        const suffix = mode === "reassign" ? "(Current)" : "(Previously Assigned)";
        opts.push({
            label: `${issue.workerAssigned.name} - ${formatRole(issue.workerAssigned)} ${suffix}`,
            value: issue.workerAssigned._id,
            disabled: true,
        });
    }

    // Misassigned workers (only relevant for assign mode)
    if (mode === "assign" && issue.misassignedBy) {
        issue.misassignedBy.forEach((w) => {
            disabledIds.add(w._id);
            opts.push({
                label: `${w.name} - ${formatRole(w)} (Reported Misassigned)`,
                value: w._id,
                disabled: true,
            });
        });
    }

    // Available workers
    allWorkers
        .filter((w) => !disabledIds.has(w._id))
        .forEach((w) =>
            opts.push({ label: `${w.name} - ${formatRole(w)}`, value: w._id })
        );

    return opts;
};

/**
 * Unified modal for both "assign" and "reassign" flows.
 *
 * @param {"assign"|"reassign"} mode
 */
export const WorkerAssignModal = ({
    mode,
    issue,
    workers,
    workersLoading,
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [selectedWorker, setSelectedWorker] = useState("");
    const [deadline, setDeadline] = useState("");
    const [remarks, setRemarks] = useState("");

    // Reset fields whenever modal opens with a new issue
    useEffect(() => {
        if (!isOpen || !issue) return;
        setSelectedWorker("");
        if (mode === "reassign") {
            setDeadline(issue.deadline ? issue.deadline.split("T")[0] : "");
            setRemarks(issue.remarks || "");
        } else {
            setDeadline("");
            setRemarks("");
        }
    }, [isOpen, issue?._id, mode]);

    const isAssign = mode === "assign";
    const title = isAssign ? "Assign Worker" : "Reassign Worker";

    const handleSubmit = () => {
        onSubmit({ worker: selectedWorker, deadline, remarks });
    };

    return (
        <Modal
            isOpen={isOpen && !!issue}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit}>{isAssign ? "Assign" : "Reassign"}</button>
                </>
            }
        >
            {issue && (
                <>
                    {/* Contextual info */}
                    {isAssign ? (
                        <>
                            <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
                                <strong>Issue:</strong> {issue.title || issue.category}
                            </p>
                            {issue.workerAssigned ? (
                                <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                                    <strong>Previously Assigned:</strong> {issue.workerAssigned.name} - {formatRole(issue.workerAssigned)}
                                    <br /><em>Please select a different worker for reassignment.</em>
                                </p>
                            ) : issue.misassignedBy?.length > 0 ? (
                                <p style={{ marginBottom: "16px", color: "var(--danger-500)", fontSize: "12px" }}>
                                    <strong>Misassigned by:</strong> {issue.misassignedBy.map((w) => w.name).join(", ")}
                                    <br /><em>These workers reported this issue as misassigned. Please assign a different worker.</em>
                                </p>
                            ) : (
                                <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                                    This issue has not been assigned yet. Please manually assign a worker.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
                                <strong>Current Worker:</strong>{" "}
                                {issue.workerAssigned?.name || issue.workerAssigned?.email || issue.workerAssigned?._id || "N/A"}
                            </p>
                            <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                                <strong>Reason:</strong>{" "}
                                {issue.autoAssigned ? "Auto-assigned but rejected by resident" : "Manual reassignment"}
                            </p>
                        </>
                    )}

                    {/* Worker dropdown */}
                    <Select
                        label={isAssign ? "Select Worker" : "Select New Worker"}
                        value={selectedWorker}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        disabled={workersLoading}
                        placeholder="Choose a worker..."
                        options={buildWorkerOptions(issue, workers, mode)}
                    />
                    {workersLoading ? (
                        <div style={{ paddingTop: 8 }}>
                            <Loader label="Loading workers..." size={24} />
                        </div>
                    ) : null}

                    {/* Shared fields */}
                    <Input type="date" label="Deadline (optional)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    <Textarea
                        label="Remarks (optional)"
                        rows={3}
                        placeholder="Add any special instructions..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </>
            )}
        </Modal>
    );
};

