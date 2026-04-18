import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchLeaves } from "../../slices/leaveSlice";
import {
  getLeaveSummary,
  WorkerLeaveRequestCards,
  WorkerLeaveSummaryCards,
} from "../shared/nonAdmin/workerLeaveUI";

export default function WorkerLeaveModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const leaves = useSelector((state) => state.leave?.leaves || []);

  useEffect(() => {
    if (isOpen) dispatch(fetchLeaves());
  }, [isOpen, dispatch]);

  const leaveSummary = useMemo(() => getLeaveSummary(leaves), [leaves]);

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">My Leave Requests</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <WorkerLeaveSummaryCards summary={leaveSummary} />
            </div>

            <WorkerLeaveRequestCards
              leaves={leaves}
              compact
              emptyText="No leave requests yet."
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
