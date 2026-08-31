import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, CheckCircle, Clock, FileText, Plus, XCircle } from "lucide-react";

import LeaveApplyForm from "../LeaveApplyForm";
import { fetchLeaves } from "../../slices/leaveSlice";
import { useSocket } from "../../hooks/useSocket";
import {
  getLeaveSummary,
  WorkerLeaveRequestCards,
  WorkerLeaveSummaryCards,
} from "../shared/nonAdmin/workerLeaveUI";
import "../../assets/css/Leave.css";

export default function WorkerLeaveList() {
  const dispatch = useDispatch();
  const leaves = useSelector((state) => state.leave?.leaves || []);
  const user = useSelector((state) => state.auth?.user);
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  // Real-time synchronization for leave updates
  useSocket("leave:updated", (payload) => {
    console.log("⚡ [WorkerLeaveList] Received leave:updated event:", payload);
    dispatch(fetchLeaves());
  });

  const leaveSummary = useMemo(() => getLeaveSummary(leaves), [leaves]);
  const userLabel = user?.name || user?.email || "You";

  const filteredLeaves = useMemo(() => {
    if (filter === "all") return leaves;
    return leaves.filter((leave) => String(leave.status).toLowerCase() === filter);
  }, [leaves, filter]);

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#1a3a52" }}>
            My Leave Requests
          </h2>
          <p className="text-muted small mb-0">Track and manage your scheduled time-off requests</p>
        </div>
        <div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold"
            style={{ borderRadius: "8px" }}
            onClick={() => setApplyOpen(true)}
          >
            <Plus size={18} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      <WorkerLeaveSummaryCards summary={leaveSummary} />

      <div className="d-flex align-items-center gap-2 mb-3">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filter === tab ? "1px solid #2563eb" : "1px solid #e2e8f0",
              background: filter === tab ? "#eff6ff" : "#fff",
              color: filter === tab ? "#1d4ed8" : "#64748b",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "capitalize",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="row">
        <div className="col-12">
          <WorkerLeaveRequestCards
            leaves={filteredLeaves}
            userLabel={userLabel}
            emptyText={
              filter === "all"
                ? "No leave requests yet. Apply using the button above."
                : `No ${filter} leave requests found.`
            }
          />
        </div>
      </div>

      <LeaveApplyForm
        isOpen={applyOpen}
        onClose={() => {
          setApplyOpen(false);
          dispatch(fetchLeaves());
        }}
      />
    </div>
  );
}
