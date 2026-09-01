import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Calendar } from "lucide-react";
import { applyLeave } from "../slices/leaveSlice";
import {
  Modal,
  Select,
  Input,
  Textarea
} from "./shared";
export default function LeaveApplyForm({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [type, setType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);
  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (endDate && endDate < val) {
      setEndDate(val);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.warning('Please select start and end dates.');
      return;
    }
    if (startDate < today) {
      toast.error('Start date cannot be in the past.');
      return;
    }
    if (endDate < startDate) {
      toast.error('End date cannot be before start date.');
      return;
    }
    if (!reason.trim()) {
      toast.warning('Please provide a brief reason for your leave.');
      return;
    }
    setLoading(true);
    try {
      await dispatch(applyLeave({ type, startDate, endDate, reason })).unwrap();
      setStartDate('');
      setEndDate('');
      setReason('');
      toast.success('Leave applied successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || err?.error || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: '9px 22px',
              borderRadius: 8,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Select
          label="Leave Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { label: 'Casual Leave', value: 'casual' },
            { label: 'Sick Leave', value: 'sick' },
            { label: 'Annual Leave', value: 'annual' },
            { label: 'Other', value: 'other' },
          ]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            type="date"
            label="Start Date"
            required
            min={today}
            value={startDate}
            onChange={handleStartDateChange}
          />
          <Input
            type="date"
            label="End Date"
            required
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {totalDays > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Calendar size={16} />
            <span>
              Requested Duration: <strong>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</strong>
            </span>
          </div>
        )}
        <Textarea
          label="Reason / Notes"
          placeholder="State the reason for taking leave..."
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
