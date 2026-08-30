import React from "react";
import { Modal } from "./index";
import { IssueTimeline } from "./IssueTimeline";
import {
  Home,
  Building,
  User,
  Wrench,
  Calendar,
  Clock,
  ShieldAlert,
  AlertTriangle,
  FileText,
  IndianRupee,
  Radio
} from "lucide-react";

export function renderPriorityBadge(priority) {
  const p = (priority || "Normal").toLowerCase();
  if (p === "urgent") {
    return (
      <span
        className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold"
        style={{
          fontSize: "12px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#dc2626",
          border: "1px solid rgba(239, 68, 68, 0.25)",
        }}
      >
        <ShieldAlert size={14} className="flex-shrink-0" />
        <span>Urgent • 30m SLA</span>
      </span>
    );
  }
  if (p === "high") {
    return (
      <span
        className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold"
        style={{
          fontSize: "12px",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          color: "#d97706",
          border: "1px solid rgba(245, 158, 11, 0.25)",
        }}
      >
        <AlertTriangle size={14} className="flex-shrink-0" />
        <span>High • 4h SLA</span>
      </span>
    );
  }
  return (
    <span
      className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-medium"
      style={{
        fontSize: "12px",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        color: "#2563eb",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      }}
    >
      <Clock size={14} className="flex-shrink-0" />
      <span>Normal • 24h SLA</span>
    </span>
  );
}

export function getStatusBadge(status) {
  let bg = "rgba(107, 114, 128, 0.08)";
  let color = "#4b5563";
  let border = "rgba(107, 114, 128, 0.25)";

  if (status === "In Progress") {
    bg = "rgba(6, 182, 212, 0.1)";
    color = "#0891b2";
    border = "rgba(6, 182, 212, 0.25)";
  } else if (status === "Assigned") {
    bg = "rgba(245, 158, 11, 0.1)";
    color = "#b45309";
    border = "rgba(245, 158, 11, 0.25)";
  } else if (status?.includes("Resolved") || status === "Closed" || status === "Confirmed") {
    bg = "rgba(16, 185, 129, 0.1)";
    color = "#059669";
    border = "rgba(16, 185, 129, 0.25)";
  } else if (status === "Deleted" || status === "Rejected") {
    bg = "rgba(31, 41, 55, 0.08)";
    color = "#1f2937";
    border = "rgba(31, 41, 55, 0.25)";
  }

  return (
    <span
      className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold"
      style={{
        fontSize: "12px",
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span>{status || "Pending"}</span>
    </span>
  );
}

export const IssueDetailsModal = ({
  issue,
  isOpen,
  onClose,
  role = "manager",
  actions = [],
  children,
}) => {
  if (!isOpen || !issue) return null;

  const issueId = issue.issueID ? `#${issue.issueID}` : `#${issue._id?.slice(-6).toUpperCase()}`;

  // Role-specific field list
  const metaItems = [];

  // 1. Category
  metaItems.push({
    icon: <FileText size={15} style={{ color: "#d97706" }} />,
    label: "Category",
    value: `${issue.category || "General"}${issue.otherCategory ? ` (${issue.otherCategory})` : ""}`,
  });

  // 2. Location (for worker, manager, security, or community issues)
  if (role !== "resident" || issue.categoryType === "Community") {
    metaItems.push({
      icon: issue.categoryType === "Community" ? <Building size={15} style={{ color: "#2563eb" }} /> : <Home size={15} style={{ color: "#2563eb" }} />,
      label: "Location",
      value: `${issue.location || issue.resident?.uCode || "Flat"} (${issue.categoryType || "Resident"})`,
    });
  }

  // 3. Resident / Contact (for worker, manager, security)
  if (role !== "resident") {
    metaItems.push({
      icon: <User size={15} style={{ color: "#0891b2" }} />,
      label: "Resident / Contact",
      value: issue.resident ? (
        <>
          {issue.resident.residentFirstname} {issue.resident.residentLastname}
          {issue.resident.contact && (
            <a
              href={`tel:${issue.resident.contact}`}
              style={{
                color: "#2563eb",
                textDecoration: "none",
                marginLeft: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              ({issue.resident.contact})
            </a>
          )}
        </>
      ) : (
        "Society Common Area"
      ),
    });
  }

  // 4. Assigned Worker (for resident, manager, security)
  if (role !== "worker") {
    metaItems.push({
      icon: <Wrench size={15} style={{ color: "#059669" }} />,
      label: "Assigned Tech",
      value: issue.workerAssigned ? (
        `${issue.workerAssigned.name || "Technician"} (${
          Array.isArray(issue.workerAssigned.jobRole)
            ? issue.workerAssigned.jobRole.join(", ")
            : issue.workerAssigned.jobRole || "Staff"
        })`
      ) : (
        <span style={{ color: "#94a3b8" }}>Pending Dispatch</span>
      ),
    });
  }

  // 5. Call Source (for security desk)
  if (role === "security" && issue.callSource) {
    metaItems.push({
      icon: <Radio size={15} style={{ color: "#9333ea" }} />,
      label: "Call Source",
      value: issue.callSource,
    });
  }

  // 6. Created Date
  metaItems.push({
    icon: <Calendar size={15} style={{ color: "#475569" }} />,
    label: "Logged Date",
    value: issue.createdAt
      ? new Date(issue.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A",
  });

  // 7. Estimated Cost if present
  if (issue.estimatedCost) {
    metaItems.push({
      icon: <IndianRupee size={15} style={{ color: "#059669" }} />,
      label: "Repair Cost",
      value: `₹${issue.estimatedCost} (${issue.paymentStatus || "Pending"})`,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Details: ${issueId}`}
      size="lg"
      footer={
        <div className="d-flex align-items-center justify-content-end gap-3 w-100 flex-wrap">
          <button
            type="button"
            className="manager-ui-button manager-ui-button--secondary"
            onClick={onClose}
          >
            Close
          </button>
          {actions.map((act, idx) =>
            act.show !== false ? (
              <button
                key={idx}
                type="button"
                className={`manager-ui-button ${
                  act.variant === "danger"
                    ? "manager-ui-button--danger"
                    : act.variant === "warning"
                    ? "manager-ui-button--warning"
                    : act.variant === "success"
                    ? "manager-ui-button--success"
                    : "manager-ui-button--primary"
                }`}
                disabled={act.disabled}
                onClick={act.onClick}
              >
                {act.icon && <span className="me-1.5 d-inline-flex align-items-center">{act.icon}</span>}
                {act.label}
              </button>
            ) : null
          )}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Hero Banner Card */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 22px",
          }}
        >
          {/* Top Row: Ticket ID + Status Badge + Priority Badge */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5 mb-3">
            <span
              style={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "3px 9px",
                fontSize: "12px",
                fontWeight: "700",
                fontFamily: "monospace",
              }}
            >
              {issueId}
            </span>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {getStatusBadge(issue.status)}
              {renderPriorityBadge(issue.priority)}
            </div>
          </div>

          {/* Ticket Title */}
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
              lineHeight: "1.35",
            }}
          >
            {issue.title || issue.category || "Untitled Issue"}
          </h4>

          {/* Description */}
          {issue.description && (
            <p
              style={{
                margin: "0 0 18px 0",
                fontSize: "13.5px",
                lineHeight: "1.55",
                color: "#475569",
              }}
            >
              {issue.description}
            </p>
          )}

          {/* Metadata Cards Grid (Neat white pill cards with clear icons & labels) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
              paddingTop: "16px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            {metaItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#64748b",
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Contextual Content (e.g. Worker Cost input, Resident Rating) */}
        {children}

        {/* Lifecycle & Event Audit Log Card */}
        <div
          style={{
            padding: "18px 20px",
            borderRadius: "14px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <h6
            style={{
              fontSize: "11.5px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: "#64748b",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Clock size={14} /> Lifecycle & Event Audit Log
          </h6>
          <IssueTimeline timeline={issue.timeline} createdAt={issue.createdAt} />
        </div>
      </div>
    </Modal>
  );
};

export default IssueDetailsModal;
