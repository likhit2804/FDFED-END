import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaves } from '../../slices/leaveSlice';
import LeaveApplyForm from '../LeaveApplyForm';
import '../../assets/css/Leave.css';

export default function WorkerLeaveList() {
  const dispatch = useDispatch();
  const leaves = useSelector(s => s.leave?.leaves || []);
  const user = useSelector(s => s.auth?.user);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => { dispatch(fetchLeaves()); }, [dispatch]);

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row mb-4">
        <div className="col-8">
          <h2 className="fw-bold mb-1" style={{ color: '#1a3a52' }}>My Leave Requests</h2>
          <p className="text-muted small mb-0">View your leave requests and their status</p>
        </div>
        <div className="col-4 text-end align-self-center">
          <button className="btn btn-primary btn-sm" onClick={() => setApplyOpen(true)}>Apply for Leave</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted small mb-2">Total</h6>
              <h3 className="fw-bold text-primary">{leaves.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted small mb-2">Pending</h6>
              <h3 className="fw-bold text-warning">{leaves.filter(l => l.status === 'pending').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted small mb-2">Approved</h6>
              <h3 className="fw-bold text-success">{leaves.filter(l => l.status === 'approved').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted small mb-2">Rejected</h6>
              <h3 className="fw-bold text-danger">{leaves.filter(l => l.status === 'rejected').length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {leaves.length === 0 && (
            <div className="card border-0 shadow-sm p-4 text-center">
              <p className="text-muted">No leave requests yet. Apply using the button above.</p>
            </div>
          )}

          {leaves.map(l => (
            <div key={l._id} className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid ${l.status === 'pending' ? '#ffc107' : l.status === 'approved' ? '#28a745' : '#dc3545'}` }}>
              <div className="card-body">
                <div className="row align-items-start mb-3">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-1">{user?.name || user?.email || 'You'}</h5>
                    <small className="text-muted">Request ID: {l._id}</small>
                  </div>
                  <div className="col-md-4 text-end">
                    <span className={`badge fs-6 ${l.status === 'pending' ? 'bg-warning text-dark' : l.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                      {l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block">Leave Type</small>
                    <div className="fw-semibold text-capitalize">{l.type}</div>
                  </div>
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block">Duration</small>
                    <div className="fw-semibold">{calculateDays(l.startDate, l.endDate)} days</div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Period</small>
                    <div className="fw-semibold">{new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <small className="text-muted d-block">Reason</small>
                  <p className="mb-0">{l.reason || 'No reason provided'}</p>
                </div>

                <div className="row text-muted small mb-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Applied On</small>
                    <span>{new Date(l.appliedAt).toLocaleString()}</span>
                  </div>
                  {l.decisionAt && (
                    <div className="col-md-6">
                      <small className="text-muted d-block">Decision On</small>
                      <span>{new Date(l.decisionAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {l.notes && (
                  <div className="alert alert-info py-2 mb-3">
                    <small className="d-block text-muted mb-1"><strong>Manager Notes:</strong></small>
                    <small>{l.notes}</small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LeaveApplyForm isOpen={applyOpen} onClose={() => { setApplyOpen(false); dispatch(fetchLeaves()); }} />
    </div>
  );
}
