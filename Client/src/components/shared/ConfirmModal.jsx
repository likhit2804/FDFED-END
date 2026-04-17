import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal – reusable confirmation dialog (delete/cancel/action)
 *
 * Props:
 *   isOpen      {boolean}
 *   onClose     {function}
 *   onConfirm   {function}
 *   title       {string}
 *   message     {string|ReactNode}
 *   confirmText {string}    default 'Confirm'
 *   cancelText  {string}    default 'Cancel'
 *   variant     {'danger'|'warning'|'primary'}  default 'danger'
 *   loading     {boolean}
 */
const VARIANT_COLORS = {
    danger: { bg: '#fee2e2', icon: '#dc2626', btn: '#dc2626', btnHover: '#b91c1c' },
    warning: { bg: '#fef3c7', icon: '#d97706', btn: '#d97706', btnHover: '#b45309' },
    primary: { bg: '#dbeafe', icon: '#2563eb', btn: '#2563eb', btnHover: '#1d4ed8' },
};

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}) => {
    if (!isOpen) return null;
    const c = VARIANT_COLORS[variant] || VARIANT_COLORS.danger;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 16,
                    padding: '28px', width: '100%', maxWidth: 420,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.15s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AlertTriangle size={24} color={c.icon} />
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{message}</p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e5e7eb',
                            background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                            background: loading ? '#9ca3af' : c.btn,
                            color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? 'Please wait…' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
