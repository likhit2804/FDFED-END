import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { applyLeave } from '../Slices/leaveSlice';

export default function LeaveApplyForm({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [type, setType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(applyLeave({ type, startDate, endDate, reason })).unwrap();
      setStartDate(''); setEndDate(''); setReason('');
      alert('Leave applied successfully');
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Failed to apply');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Apply for Leave</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                  <option value="sick">Sick</option>
                  <option value="casual">Casual</option>
                  <option value="annual">Annual</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Start Date</label>
                <input className="form-control" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label">End Date</label>
                <input className="form-control" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Reason</label>
                <textarea className="form-control" value={reason} onChange={e => setReason(e.target.value)} rows={4} />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Applying...' : 'Apply'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
