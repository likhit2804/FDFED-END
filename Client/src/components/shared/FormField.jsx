import React from 'react';

/**
 * FormField – labelled input/select/textarea wrapper for user forms
 *
 * Props:
 *   label       {string}
 *   required    {boolean}
 *   error       {string}    validation error message
 *   children    {ReactNode} the actual <input>, <select>, or <textarea>
 *   hint        {string}    helper text below field
 *   horizontal  {boolean}   label and field side-by-side
 */
const FormField = ({ label, required = false, error, children, hint, horizontal = false }) => (
    <div style={{
        display: horizontal ? 'flex' : 'block',
        alignItems: horizontal ? 'flex-start' : undefined,
        gap: horizontal ? 16 : 0,
        marginBottom: 16,
    }}>
        {label && (
            <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: horizontal ? 0 : 6,
                paddingTop: horizontal ? 10 : 0,
                minWidth: horizontal ? 140 : undefined,
                flexShrink: horizontal ? 0 : undefined,
            }}>
                {label}
                {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
            </label>
        )}
        <div style={{ flex: 1 }}>
            {React.Children.map(children, child =>
                child
                    ? React.cloneElement(child, {
                        style: {
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${error ? '#fca5a5' : 'var(--ue-border, #e5e7eb)'}`,
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#374151',
                            outline: 'none',
                            background: '#fff',
                            ...child.props.style,
                        },
                    })
                    : null
            )}
            {hint && !error && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>{hint}</p>}
            {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, marginBottom: 0 }}>{error}</p>}
        </div>
    </div>
);

export default FormField;
