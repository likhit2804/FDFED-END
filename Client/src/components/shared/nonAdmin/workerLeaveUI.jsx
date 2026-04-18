import React from "react";

const STATUS_META = {
  pending: {
    borderColor: "#ffc107",
    badgeClass: "bg-warning text-dark",
    label: "Pending",
  },
  approved: {
    borderColor: "#28a745",
    badgeClass: "bg-success",
    label: "Approved",
  },
  rejected: {
    borderColor: "#dc3545",
    badgeClass: "bg-danger",
    label: "Rejected",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[String(status || "").toLowerCase()] || {
    borderColor: "#64748b",
    badgeClass: "bg-secondary",
    label: "Unknown",
  };

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const getLeaveDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
};

export const getLeaveSummary = (leaves = []) => ({
  total: leaves.length,
  pending: leaves.filter((leave) => leave.status === "pending").length,
  approved: leaves.filter((leave) => leave.status === "approved").length,
  rejected: leaves.filter((leave) => leave.status === "rejected").length,
});

export const WorkerLeaveSummaryCards = ({ summary }) => (
  <div className="row g-3 mb-4">
    <div className="col-md-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center">
          <h6 className="text-muted small mb-2">Total</h6>
          <h3 className="fw-bold text-primary">{summary.total}</h3>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center">
          <h6 className="text-muted small mb-2">Pending</h6>
          <h3 className="fw-bold text-warning">{summary.pending}</h3>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center">
          <h6 className="text-muted small mb-2">Approved</h6>
          <h3 className="fw-bold text-success">{summary.approved}</h3>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center">
          <h6 className="text-muted small mb-2">Rejected</h6>
          <h3 className="fw-bold text-danger">{summary.rejected}</h3>
        </div>
      </div>
    </div>
  </div>
);

const LeaveCard = ({ leave, userLabel, compact }) => {
  const meta = getStatusMeta(leave.status);

  return (
    <div key={leave._id} className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid ${meta.borderColor}` }}>
      <div className="card-body">
        <div className="row align-items-start mb-3">
          <div className="col-md-8">
            {compact ? (
              <h6 className="fw-bold mb-1">Request ID: {leave._id}</h6>
            ) : (
              <>
                <h5 className="fw-bold mb-1">{userLabel}</h5>
                <small className="text-muted">Request ID: {leave._id}</small>
              </>
            )}
            {compact ? (
              <small className="text-muted">
                {leave.type} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </small>
            ) : null}
          </div>
          <div className="col-md-4 text-end">
            <span className={`badge fs-6 ${meta.badgeClass}`}>{meta.label}</span>
          </div>
        </div>

        {!compact ? (
          <div className="row mb-3">
            <div className="col-md-3 mb-2">
              <small className="text-muted d-block">Leave Type</small>
              <div className="fw-semibold text-capitalize">{leave.type}</div>
            </div>
            <div className="col-md-3 mb-2">
              <small className="text-muted d-block">Duration</small>
              <div className="fw-semibold">{getLeaveDays(leave.startDate, leave.endDate)} days</div>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Period</small>
              <div className="fw-semibold">
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </div>
            </div>
          </div>
        ) : null}

        <div className={compact ? "mt-2" : "mb-3"}>
          <small className="text-muted d-block">Reason</small>
          <p className="mb-0">{leave.reason || "No reason provided"}</p>
        </div>

        {!compact ? (
          <div className="row text-muted small mb-3">
            <div className="col-md-6">
              <small className="text-muted d-block">Applied On</small>
              <span>{formatDateTime(leave.appliedAt)}</span>
            </div>
            {leave.decisionAt ? (
              <div className="col-md-6">
                <small className="text-muted d-block">Decision On</small>
                <span>{formatDateTime(leave.decisionAt)}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {leave.notes ? (
          <div className={`alert alert-info py-2 ${compact ? "mt-2 mb-0" : "mb-3"}`}>
            <small className="d-block text-muted mb-1">
              <strong>Manager Notes:</strong>
            </small>
            <small>{leave.notes}</small>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const WorkerLeaveRequestCards = ({
  leaves,
  emptyText,
  compact = false,
  userLabel = "You",
}) => (
  <>
    {leaves.length === 0 ? (
      <div className="card border-0 shadow-sm p-4 text-center">
        <p className="text-muted mb-0">{emptyText}</p>
      </div>
    ) : null}

    {leaves.map((leave) => (
      <LeaveCard key={leave._id} leave={leave} compact={compact} userLabel={userLabel} />
    ))}
  </>
);
