import React from 'react';

/**
 * Tabs – user-themed tab bar (underline style, matching the IssueResolving look)
 *
 * Props:
 *   tabs     {Array<{label, value, count}>}  — items to display
 *   active   {string}                        — active value
 *   onChange {function(value)}
 *   variant  {'underline'|'pill'}            — default 'underline'
 */
const Tabs = ({ tabs = [], active, onChange, variant = 'underline' }) => {
    if (variant === 'pill') {
        return (
            <div style={{
                display: 'flex', gap: 8,
                background: '#f1f5f9',
                borderRadius: 12, padding: 5,
                width: 'fit-content',
            }}>
                {tabs.map(tab => {
                    const isActive = active === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => onChange?.(tab.value)}
                            style={{
                                padding: '8px 18px',
                                border: 'none',
                                borderRadius: 9,
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: 'pointer',
                                color: isActive ? '#fff' : '#475569',
                                background: isActive ? 'var(--ue-primary, #2563eb)' : 'transparent',
                                boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.3)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span style={{
                                    marginLeft: 6,
                                    background: isActive ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                                    color: isActive ? '#fff' : '#374151',
                                    borderRadius: 99, fontSize: 11, padding: '1px 7px',
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Underline variant (default)
    return (
        <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--ue-border, #e5e7eb)',
            marginBottom: 20,
            gap: 0,
        }}>
            {tabs.map(tab => {
                const isActive = active === tab.value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => onChange?.(tab.value)}
                        style={{
                            padding: '10px 18px',
                            border: 'none',
                            borderBottom: `3px solid ${isActive ? 'var(--ue-primary, #2563eb)' : 'transparent'}`,
                            marginBottom: -2,
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 14,
                            cursor: 'pointer',
                            color: isActive ? 'var(--ue-text-dark, #1f2937)' : '#6b7280',
                            background: 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span style={{
                                background: isActive ? 'var(--ue-primary-light, #dbeafe)' : '#f3f4f6',
                                color: isActive ? 'var(--ue-primary, #2563eb)' : '#6b7280',
                                borderRadius: 99, fontSize: 11, fontWeight: 700,
                                padding: '1px 7px',
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
