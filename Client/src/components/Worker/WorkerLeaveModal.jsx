import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaves } from '../../slices/leaveSlice';

export default function WorkerLeaveModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const leaves = useSelector(s => s.leave?.leaves || []);

  useEffect(() => {
    if (isOpen) dispatch(fetchLeaves());
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">My Leave Requests</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <div className="row g-3">
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
            </div>

            <div>
              {leaves.length === 0 && (
                <div className="card border-0 shadow-sm p-4 text-center">
                  <p className="text-muted mb-0">No leave requests yet.</p>
                </div>
              )}

              {leaves.map(l => (
                <div key={l._id} className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid ${l.status === 'pending' ? '#ffc107' : l.status === 'approved' ? '#28a745' : '#dc3545'}` }}>
                  <div className="card-body">
                    <div className="row align-items-start mb-2">
                      <div className="col-md-8">
                        <h6 className="fw-bold mb-1">Request ID: {l._id}</h6>
                        <small className="text-muted">{l.type} • {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}</small>
                      </div>
                      <div className="col-md-4 text-end">
                        <span className={`badge fs-6 ${l.status === 'pending' ? 'bg-warning text-dark' : l.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                          {l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted d-block">Reason</small>
                      <p className="mb-0">{l.reason || 'No reason provided'}</p>
                    </div>
                    {l.notes && (
                      <div className="alert alert-info py-2 mt-2 mb-0">
                        <small className="d-block text-muted mb-1"><strong>Manager Notes:</strong></small>
                        <small>{l.notes}</small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
