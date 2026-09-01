import React from "react";
import { ShieldAlert, AlertTriangle, Clock } from "lucide-react";

export function renderPriorityPill(priority) {
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
                    color: "var(--warning-500, #f59e0b)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
            >
                <AlertTriangle size={12} /> High • 4h
            </span>
        );
    }
    if (p === "normal") {
        return (
            <span
                className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold"
                style={{
                    fontSize: "11.5px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "var(--primary-600, #2563eb)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                }}
            >
                <Clock size={12} /> Normal • 24h
            </span>
        );
    }
    return (
        <span
            className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-semibold text-muted"
            style={{
                fontSize: "11.5px",
                backgroundColor: "rgba(100, 116, 139, 0.1)",
                border: "1px solid rgba(100, 116, 139, 0.2)",
            }}
        >
            <Clock size={12} /> {priority}
        </span>
    );
}

export default function PriorityPill({ priority }) {
    return renderPriorityPill(priority);
}
