import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown – styled select dropdown for user theme
 *
 * Props:
 *   options  {Array<string|{label,value}>}
 *   selected {string}
 *   onChange {function(value)}
 *   width    {string}  default '180px'
 *   placeholder {string}
 */
const Dropdown = ({ options = [], selected, onChange, width = '180px', placeholder = 'Select…' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);
    const toValue = (opt) => (typeof opt === 'object' ? opt.value : opt);
    const displayLabel = options.find(o => toValue(o) === selected) ? toLabel(options.find(o => toValue(o) === selected)) : (placeholder);

    return (
        <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                style={{
                    width: '100%',
                    padding: '9px 14px',
                    border: '1px solid var(--ue-border, #e5e7eb)',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--ue-primary, #2563eb)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--ue-border, #e5e7eb)'; }}
            >
                <span style={{ color: selected ? '#374151' : '#9ca3af' }}>{displayLabel}</span>
                <ChevronDown size={15} color="#6b7280" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1px solid var(--ue-border, #e5e7eb)',
                    borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.09)',
                    zIndex: 200, overflow: 'hidden',
                }}>
                    {options.map((opt) => {
                        const v = toValue(opt);
                        const l = toLabel(opt);
                        const isActive = v === selected;
                        return (
                            <div
                                key={v}
                                onClick={() => { onChange?.(v); setOpen(false); }}
                                style={{
                                    padding: '9px 14px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--ue-primary, #2563eb)' : '#374151',
                                    background: isActive ? 'var(--ue-primary-light, #dbeafe)' : '#fff',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff'; }}
                            >
                                {l}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
