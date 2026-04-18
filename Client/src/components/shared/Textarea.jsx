import React, { forwardRef } from 'react';

/**
 * Textarea – styled multiline input
 *
 * Props:
 *   label    {string}
 *   required {boolean}
 *   error    {string}
 *   hint     {string}
 *   rows     {number} default 4
 *   disabled {boolean}
 *   ...rest  passed to <textarea>
 */
const Textarea = forwardRef(({
    label,
    required = false,
    error,
    hint,
    rows = 4,
    disabled = false,
    style: extraStyle,
    ...rest
}, ref) => (
    <div style={{ marginBottom: 16 }}>
        {label && (
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {label}
                {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
            </label>
        )}

        <textarea
            ref={ref}
            rows={rows}
            required={required}
            disabled={disabled}
            style={{
                width: '100%',
                padding: '9px 12px',
                border: `1px solid ${error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'}`,
                borderRadius: 8,
                fontSize: 14,
                color: '#374151',
                background: disabled ? '#f9fafb' : '#fff',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                ...extraStyle,
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = 'var(--ue-primary, #2563eb)'; }}
            onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'; }}
            {...rest}
        />

        {hint && !error && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>{hint}</p>}
        {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, marginBottom: 0 }}>{error}</p>}
    </div>
));

Textarea.displayName = 'Textarea';
export default Textarea;
