import React from 'react';

/**
 * EmptyState – centered empty slot with icon, title, and optional sub-text
 *
 * Props:
 *   icon    {ReactNode} – large illustrative icon
 *   title   {string}
 *   sub     {string}    – optional secondary text
 *   action  {ReactNode} – optional call-to-action button
 */
const EmptyState = ({ icon, title = 'Nothing here yet', sub, action }) => (
    <div className="ue-empty">
        {icon && <div className="ue-empty__icon">{icon}</div>}
        <p className="ue-empty__title">{title}</p>
        {sub && <p className="ue-empty__sub">{sub}</p>}
        {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
);

export default EmptyState;
