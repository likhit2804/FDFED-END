import React from 'react';

/**
 * Button – user-themed button
 *
 * Props:
 *   children  {ReactNode}
 *   variant   {'primary'|'secondary'|'danger'|'success'|'warning'|'ghost'|'outline'}
 *   size      {'sm'|'md'|'lg'}  default 'md'
 *   loading   {boolean}
 *   disabled  {boolean}
 *   icon      {ReactNode}  left icon
 *   iconRight {ReactNode}  right icon
 *   onClick   {function}
 *   type      {string}   'button'|'submit', default 'button'
 *   fullWidth {boolean}
 *   style     {object}
 */
const VARIANTS = {
    primary: { bg: '#2563eb', color: '#fff', border: 'none', hover: '#1d4ed8' },
    secondary: { bg: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', hover: '#e5e7eb' },
    danger: { bg: '#dc2626', color: '#fff', border: 'none', hover: '#b91c1c' },
    success: { bg: '#16a34a', color: '#fff', border: 'none', hover: '#15803d' },
    warning: { bg: '#d97706', color: '#fff', border: 'none', hover: '#b45309' },
    ghost: { bg: 'transparent', color: '#6b7280', border: 'none', hover: '#f3f4f6' },
    outline: { bg: 'transparent', color: '#2563eb', border: '1px solid #2563eb', hover: '#eff6ff' },
};

const SIZES = {
    sm: { padding: '6px 14px', fontSize: 13, height: 34 },
    md: { padding: '9px 18px', fontSize: 14, height: 40 },
    lg: { padding: '11px 24px', fontSize: 15, height: 46 },
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconRight,
    onClick,
    type = 'button',
    fullWidth = false,
    style = {},
}) => {
    const v = VARIANTS[variant] || VARIANTS.primary;
    const s = SIZES[size] || SIZES.md;
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: s.padding,
                height: s.height,
                fontSize: s.fontSize,
                fontWeight: 600,
                background: isDisabled ? '#9ca3af' : v.bg,
                color: isDisabled ? '#fff' : v.color,
                border: v.border,
                borderRadius: 8,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.18s, opacity 0.18s',
                width: fullWidth ? '100%' : undefined,
                whiteSpace: 'nowrap',
                ...style,
            }}
            onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = v.hover; }}
            onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = v.bg; }}
        >
            {icon && !loading && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
            {loading && (
                <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                }} />
            )}
            {children}
            {iconRight && !loading && <span style={{ display: 'flex', alignItems: 'center' }}>{iconRight}</span>}
        </button>
    );
};

export default Button;
