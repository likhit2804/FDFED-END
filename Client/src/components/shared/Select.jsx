import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select – styled native dropdown
 *
 * Props:
 *   label       {string}
 *   required    {boolean}
 *   error       {string}
 *   hint        {string}
 *   disabled    {boolean}
 *   options     {Array<{label, value, disabled?}>}
 *   placeholder {string}   blank first option label
 *   ...rest     passed to <select>
 */
const Select = forwardRef(({
    label,
    required = false,
    error,
    hint,
    disabled = false,
    options = [],
    placeholder,
    style: extraStyle,
    children,
    ...rest
}, ref) => (
    <div style={{ marginBottom: 16 }}>
        {label && (
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {label}
                {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
            </label>
        )}

        <div style={{ position: 'relative' }}>
            <select
                ref={ref}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    border: `1px solid ${error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#374151',
                    background: disabled ? '#f9fafb' : '#fff',
                    outline: 'none',
                    appearance: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxSizing: 'border-box',
                    ...extraStyle,
                }}
                {...rest}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.length > 0
                    ? options.map((o, i) => (
                        <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
                    ))
                    : children
                }
            </select>
            <ChevronDown
                size={16}
                style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    color: '#9ca3af', pointerEvents: 'none',
                }}
            />
        </div>

        {hint && !error && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>{hint}</p>}
        {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, marginBottom: 0 }}>{error}</p>}
    </div>
));

Select.displayName = 'Select';
export default Select;
