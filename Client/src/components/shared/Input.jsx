import React, { forwardRef } from 'react';

/**
 * Input – styled text/email/date/number/password/url input
 *
 * Props:
 *   type        {string}   default 'text'
 *   label       {string}
 *   required    {boolean}
 *   error       {string}   validation error message
 *   hint        {string}   helper text below
 *   icon        {ReactNode} leading icon
 *   suffix      {ReactNode} trailing element (e.g. unit label, button)
 *   disabled    {boolean}
 *   ...rest     passed to <input>
 */
const Input = forwardRef(({
    type = 'text',
    label,
    required = false,
    error,
    hint,
    icon,
    suffix,
    disabled = false,
    style: extraStyle,
    className,
    ...rest
}, ref) => {
    const hasWrap = icon || suffix;

    return (
        <div style={{ marginBottom: 16 }}>
            {label && (
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    {label}
                    {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
                </label>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && (
                    <span style={{
                        position: 'absolute', left: 10, color: '#9ca3af',
                        display: 'flex', alignItems: 'center', pointerEvents: 'none',
                    }}>
                        {icon}
                    </span>
                )}

                <input
                    ref={ref}
                    type={type}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: icon ? '9px 12px 9px 34px' : '9px 12px',
                        paddingRight: suffix ? 44 : 12,
                        border: `1px solid ${error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#374151',
                        background: disabled ? '#f9fafb' : '#fff',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        ...extraStyle,
                    }}
                    onFocus={e => { if (!error) e.target.style.borderColor = 'var(--ue-primary, #2563eb)'; }}
                    onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'; }}
                    {...rest}
                />

                {suffix && (
                    <span style={{
                        position: 'absolute', right: 10,
                        color: '#9ca3af', display: 'flex', alignItems: 'center',
                    }}>
                        {suffix}
                    </span>
                )}
            </div>

            {hint && !error && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>{hint}</p>}
            {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, marginBottom: 0 }}>{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
