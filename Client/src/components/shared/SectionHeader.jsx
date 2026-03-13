import React from 'react';

/**
 * SectionHeader – card-row header with title, optional subtitle and right-side actions
 * (mirrors Admin/Header.jsx but richer)
 *
 * Props:
 *   title    {string}
 *   subtitle {string}
 *   actions  {ReactNode}
 *   divider  {boolean}  – show bottom border, default false
 */
const SectionHeader = ({ title, subtitle, actions, divider = false }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: divider ? 12 : 0,
        borderBottom: divider ? '1px solid var(--ue-border, #e5e7eb)' : 'none',
        flexWrap: 'wrap',
        gap: 8,
    }}>
        <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{title}</h3>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b7280' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
    </div>
);

export default SectionHeader;
