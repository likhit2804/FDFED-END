import React from 'react';

/**
 * Card – generic container card for the user theme
 *
 * Props:
 *   children    {ReactNode}
 *   padding     {string|number}  default '20px'
 *   radius      {string|number}  default '14px'
 *   shadow      {string}         'sm'|'md'|'lg', default 'sm'
 *   border      {boolean}        show border, default true
 *   style       {object}         extra inline styles
 *   className   {string}
 *   noPad       {boolean}        remove padding (for image cards)
 *   accent      {string}         left border accent colour
 */
const SHADOWS = {
    sm: '0 1px 4px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.09)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
};

const Card = ({
    children,
    padding = '20px',
    radius = '14px',
    shadow = 'sm',
    border = true,
    style = {},
    className = '',
    noPad = false,
    accent,
}) => (
    <div
        className={className}
        style={{
            background: 'var(--ue-bg-card, #fff)',
            borderRadius: radius,
            boxShadow: SHADOWS[shadow] ?? shadow,
            border: border ? '1px solid var(--ue-border, #e5e7eb)' : 'none',
            borderLeft: accent ? `4px solid ${accent}` : undefined,
            padding: noPad ? 0 : padding,
            ...style,
        }}
    >
        {children}
    </div>
);

export default Card;
