import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { applyLeave } from '../slices/leaveSlice';
import { Modal, Select, Input, Textarea } from './shared';

export default function LeaveApplyForm({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [type, setType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const submit = async (e) => {
    e.preventDefault();
    if (startDate && startDate < today) {
      alert("Start date cannot be in the past.");
      return;
    }
    if (endDate && endDate < startDate) {
      alert("End date cannot be before start date.");
      return;
    }
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </>
      }
    >
      <Select
        label="Leave Type"
        value={type}
        onChange={e => setType(e.target.value)}
        options={[
          { label: 'Sick', value: 'sick' },
          { label: 'Casual', value: 'casual' },
          { label: 'Annual', value: 'annual' },
          { label: 'Other', value: 'other' },
        ]}
      />
      <Input
        type="date"
        label="Start Date"
        required
        min={today}
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      />
      <Input
        type="date"
        label="End Date"
        required
        min={startDate || today}
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
      />
      <Textarea
        label="Reason"
        rows={4}
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
    </Modal>
  );
}
