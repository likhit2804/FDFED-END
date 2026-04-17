import React from 'react';

/**
 * StatusBadge – mirrors Admin/Status.jsx but extended with all user-role statuses
 *
 * Props:
 *   status    {string}   – raw status string (case-insensitive)
 *   uppercase {boolean}  – whether to uppercase label, default false
 */
const STATUS_MAP = {
    // General
    active: { bg: '#dcfce7', color: '#166534' },
    inactive: { bg: '#fee2e2', color: '#991b1b' },
    online: { bg: '#dcfce7', color: '#166534' },
    offline: { bg: '#f3f4f6', color: '#374151' },

    // Issues
    pending: { bg: '#fef3c7', color: '#92400e' },
    'pending assignment': { bg: '#fef3c7', color: '#92400e' },
    assigned: { bg: '#dbeafe', color: '#1e40af' },
    'in progress': { bg: '#fed7aa', color: '#92400e' },
    resolved: { bg: '#dcfce7', color: '#065f46' },
    'resolved (awaiting confirmation)': { bg: '#dcfce7', color: '#065f46' },
    closed: { bg: '#f3f4f6', color: '#374151' },
    reopened: { bg: '#fee2e2', color: '#991b1b' },
    'payment pending': { bg: '#fef3c7', color: '#92400e' },

    // Payments / Bookings
    completed: { bg: '#dcfce7', color: '#166534' },
    approved: { bg: '#dcfce7', color: '#065f46' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    cancelled: { bg: '#f3f4f6', color: '#374151' },
    overdue: { bg: '#fee2e2', color: '#991b1b' },
    'payment completed': { bg: '#dcfce7', color: '#166534' },

    // Subscription
    expired: { bg: '#fee2e2', color: '#991b1b' },
    processing: { bg: '#fef3c7', color: '#92400e' },
    on_hold: { bg: '#fef3c7', color: '#92400e' },
    refunded: { bg: '#e0f2fe', color: '#0369a1' },

    // Verification
    verified: { bg: '#dcfce7', color: '#15803d' },
    unverified: { bg: '#fef9c3', color: '#854d0e' },
    under_review: { bg: '#e0f2fe', color: '#0369a1' },
};

const StatusBadge = ({ status = '', uppercase = false }) => {
    const key = (status || '').toLowerCase().trim().replace(/_/g, ' ');
    const style = STATUS_MAP[key] || { bg: '#f3f4f6', color: '#374151' };
    const label = uppercase ? (status || '').toUpperCase() : (status || '—');

    return (
        <span style={{
            display: 'inline-block',
            padding: '4px 11px',
            borderRadius: 99,
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: uppercase ? '0.4px' : '0',
            background: style.bg,
            color: style.color,
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
};

export default StatusBadge;
