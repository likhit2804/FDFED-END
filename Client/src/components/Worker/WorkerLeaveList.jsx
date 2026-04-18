import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import LeaveApplyForm from "../LeaveApplyForm";
import { fetchLeaves } from "../../slices/leaveSlice";
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

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  const leaveSummary = useMemo(() => getLeaveSummary(leaves), [leaves]);
  const userLabel = user?.name || user?.email || "You";

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row mb-4">
        <div className="col-8">
          <h2 className="fw-bold mb-1" style={{ color: "#1a3a52" }}>
            My Leave Requests
          </h2>
          <p className="text-muted small mb-0">View your leave requests and their status</p>
        </div>
        <div className="col-4 text-end align-self-center">
          <button className="btn btn-primary btn-sm" onClick={() => setApplyOpen(true)}>
            Apply for Leave
          </button>
        </div>
      </div>

      <WorkerLeaveSummaryCards summary={leaveSummary} />

      <div className="row">
        <div className="col-12">
          <WorkerLeaveRequestCards
            leaves={leaves}
            userLabel={userLabel}
            emptyText="No leave requests yet. Apply using the button above."
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
