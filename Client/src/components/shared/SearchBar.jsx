import React, { useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * SearchBar – mirrors Admin/SearchBar but uses user theme tokens
 *
 * Props:
 *   placeholder {string}
 *   value       {string}
 *   onChange    {function(string)}
 *   width       {string}  default '100%'
 */
const SearchBar = ({ placeholder = 'Search…', value = '', onChange, width = '100%' }) => {
    const containerRef = useRef(null);

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid var(--ue-border, #e5e7eb)',
                borderRadius: '10px',
                padding: '0 14px',
                height: '42px',
                width,
                transition: 'border-color 0.2s ease',
            }}
        >
            <Search size={16} color="#9ca3af" style={{ marginRight: 10, flexShrink: 0 }} />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onFocus={() => {
                    if (containerRef.current)
                        containerRef.current.style.borderColor = 'var(--ue-primary, #2563eb)';
                }}
                onBlur={() => {
                    if (containerRef.current)
                        containerRef.current.style.borderColor = 'var(--ue-border, #e5e7eb)';
                }}
                style={{
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    flex: 1,
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: 500,
                    background: 'transparent',
                    height: '100%',
                }}
            />
        </div>
    );
};

export default SearchBar;
