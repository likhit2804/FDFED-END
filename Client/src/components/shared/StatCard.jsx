import React from 'react';

/**
 * StatCard – shared summary card with icon, label, and value
 *
 * Props:
 *   icon      {ReactNode} – Lucide or Bootstrap icon element
 *   label     {string}
 *   value     {string|number}
 *   iconColor {string}   – CSS color for icon, default #2563eb
 *   iconBg    {string}   – CSS background for icon circle, default #dbeafe
 *   loading   {boolean}  – shows dash instead of value while loading
 */
const StatCard = ({
    icon,
    label,
    value,
    iconColor = '#2563eb',
    iconBg = '#dbeafe',
    loading = false,
}) => (
    <div className="ue-stat-card">
        <div
            className="ue-stat-card__icon"
            style={{ background: iconBg, color: iconColor }}
        >
            {icon}
        </div>
        <p className="ue-stat-card__label">{label}</p>
        <p className="ue-stat-card__value" style={{ color: iconColor }}>
            {loading ? '—' : (value ?? 0)}
        </p>
    </div>
);

export default StatCard;
