
import {
  Clock,
  User,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowRight
} from "lucide-react";

const ACTION_COLORS = {
  Created: { bg: "#3b82f6", text: "#1e40af", softBg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)" },
  Assigned: { bg: "#f59e0b", text: "#b45309", softBg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  Reassigned: { bg: "#8b5cf6", text: "#6d28d9", softBg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.3)" },
  Started: { bg: "#06b6d4", text: "#0e7490", softBg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.3)" },
  Resolved: { bg: "#10b981", text: "#047857", softBg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" },
  Confirmed: { bg: "#059669", text: "#065f46", softBg: "rgba(5, 150, 105, 0.15)", border: "rgba(5, 150, 105, 0.35)" },
  Reopened: { bg: "#ef4444", text: "#b91c1c", softBg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" },
  Deleted: { bg: "#1f2937", text: "#111827", softBg: "rgba(31, 41, 55, 0.12)", border: "rgba(31, 41, 55, 0.3)" },
  Closed: { bg: "#4b5563", text: "#374151", softBg: "rgba(75, 85, 99, 0.12)", border: "rgba(75, 85, 99, 0.3)" },
};

const getActionIcon = (action) => {
  switch (action) {
    case "Created": return <User size={11} />;
    case "Assigned": return <Wrench size={11} />;
    case "Reassigned": return <ArrowRight size={11} />;
    case "Started": return <Clock size={11} />;
    case "Resolved": return <CheckCircle2 size={11} />;
    case "Confirmed": return <CheckCircle2 size={11} />;
    case "Reopened": return <AlertTriangle size={11} />;
    case "Deleted": return <Trash2 size={11} />;
    default: return <Clock size={11} />;
  }
};

export const IssueTimeline = ({ timeline = [], createdAt }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-3 text-center rounded-3 bg-light border text-muted" style={{ fontSize: "12.5px" }}>
        <Clock size={18} className="mb-1 d-block mx-auto text-secondary opacity-75" />
        <span>
          Ticket created on {createdAt ? new Date(createdAt).toLocaleString("en-IN") : "N/A"}.
        </span>
      </div>
    );
  }

  return (
    <div className="position-relative ps-3 ms-2" style={{ borderLeft: "2px solid #e5e7eb" }}>
      {timeline.map((entry, idx) => {
        const actionCfg = ACTION_COLORS[entry.action] || {
          bg: "#6b7280",
          text: "#ffffff",
          border: "#4b5563",
          pill: "bg-secondary-subtle text-secondary border",
        };

        const isLast = idx === timeline.length - 1;

        return (
          <div key={idx} className={`position-relative ${isLast ? "mb-0" : "mb-3"}`}>
            {/* Timeline Dot */}
            <span
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: "18px",
                height: "18px",
                left: "-25px",
                top: "2px",
                backgroundColor: actionCfg.bg,
                color: actionCfg.text,
                border: "2px solid #ffffff",
                fontSize: "9px",
              }}
            >
              {getActionIcon(entry.action)}
            </span>

            {/* Event Header */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <div className="d-flex align-items-center gap-1.5">
                <span
                  className="badge rounded-pill px-2.5 py-1 fw-semibold"
                  style={{
                    fontSize: "11px",
                    backgroundColor: actionCfg.softBg,
                    color: actionCfg.text,
                    border: `1px solid ${actionCfg.border}`,
                  }}
                >
                  {entry.action}
                </span>
                <span className="text-secondary" style={{ fontSize: "12px" }}>
                  by <strong>{entry.performedBy || "System"}</strong>
                </span>
              </div>
              <span className="text-muted font-monospace" style={{ fontSize: "11px" }}>
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "-"}
              </span>
            </div>

            {/* Event Details */}
            {entry.details && (
              <p
                className="mb-0 mt-1 px-2.5 py-1.5 rounded-2 bg-light text-dark border-start border-2"
                style={{
                  fontSize: "12px",
                  borderColor: actionCfg.bg,
                  backgroundColor: "rgba(243, 244, 246, 0.7)",
                }}
              >
                {entry.details}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IssueTimeline;
