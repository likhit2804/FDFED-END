import React from 'react';

/**
 * PageHeader – shared page title + subtitle + optional action button slot
 *
 * Props:
 *   title    {string}
 *   subtitle {string}   – optional
 *   actions  {ReactNode} – optional right-side buttons
 */
const PageHeader = ({ title, subtitle, actions }) => (
    <div className="ue-page-header">
        <div>
            <h2 className="ue-page-header__title">{title}</h2>
            {subtitle && <p className="ue-page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
    </div>
);

export default PageHeader;
