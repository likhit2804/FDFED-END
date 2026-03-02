import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaves, approveLeave, rejectLeave } from '../Slices/leaveSlice';
import '../assets/css/Leave.css';

export default function ManagerLeaveList() {
  const dispatch = useDispatch();
  const leaves = useSelector(s => s.leave?.leaves || []);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});

  useEffect(() => { dispatch(fetchLeaves()); }, [dispatch]);

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const onApprove = async (id) => {
    if (!confirm('Approve this leave?')) return;
    setLoading(true);
    try {
      await dispatch(approveLeave({ id, notes: notes[id] || '' })).unwrap();
      await dispatch(fetchLeaves()).unwrap();
      alert('Approved');
      setNotes(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed');
    } finally { setLoading(false); }
  };

  const onReject = async (id) => {
    if (!confirm('Reject this leave?')) return;
    setLoading(true);
    try {
      await dispatch(rejectLeave({ id, notes: notes[id] || '' })).unwrap();
      await dispatch(fetchLeaves()).unwrap();
      alert('Rejected');
      setNotes(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="container-fluid px-4 py-4">
        {/* HEADER */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="fw-bold mb-1" style={{ color: '#1a3a52' }}>Leave Approvals</h2>
            <p className="text-muted small mb-0">Review and manage worker leave requests</p>
            <hr style={{ marginTop: '1rem', marginBottom: '1rem', opacity: 0.2 }} />
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted small mb-2">Total Requests</h6>
                <h3 className="fw-bold text-primary">{leaves.length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted small mb-2">Pending</h6>
                <h3 className="fw-bold text-warning">{leaves.filter(l => l.status === 'pending').length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted small mb-2">Approved</h6>
                <h3 className="fw-bold text-success">{leaves.filter(l => l.status === 'approved').length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* LEAVES LIST */}
        <div className="row">
          <div className="col-12">
            {leaves.length === 0 && (
              <div className="card border-0 shadow-sm p-4 text-center">
                <p className="text-muted">No leave requests at the moment</p>
              </div>
            )}

            {leaves.map(l => (
              <div key={l._id} className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid ${l.status === 'pending' ? '#ffc107' : l.status === 'approved' ? '#28a745' : '#dc3545'}` }}>
                <div className="card-body">
                  {/* HEADER ROW */}
                  <div className="row align-items-start mb-3">
                    <div className="col-md-8">
                      <h5 className="fw-bold mb-1">{l.worker?.name || l.worker?.email || 'Unknown Worker'}</h5>
                      <small className="text-muted">Work ID: {l.worker?._id || 'N/A'}</small>
                    </div>
                    <div className="col-md-4 text-end">
                      <span className={`badge fs-6 ${l.status === 'pending' ? 'bg-warning text-dark' : l.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
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

                  {/* REASON */}
                  <div className="mb-3">
                    <small className="text-muted d-block">Reason</small>
                    <p className="mb-0">{l.reason || 'No reason provided'}</p>
                  </div>

                  {/* DATES INFO */}
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

                  {/* NOTES */}
                  {l.notes && (
                    <div className="alert alert-info py-2 mb-3">
                      <small className="d-block text-muted mb-1"><strong>Notes:</strong></small>
                      <small>{l.notes}</small>
                    </div>
                  )}

                  {/* ACTIONS */}
                  {l.status === 'pending' && (
                    <div>
                      <textarea
                        className="form-control form-control-sm mb-2"
                        placeholder="Add notes (optional)"
                        rows="2"
                        value={notes[l._id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [l._id]: e.target.value }))}
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={() => onApprove(l._id)} disabled={loading}>
                          <i className="bi bi-check-circle me-1"></i> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => onReject(l._id)} disabled={loading}>
                          <i className="bi bi-x-circle me-1"></i> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
