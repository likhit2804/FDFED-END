import React from 'react';
import '../assets/css/Loader.css';

export const Loader = ({ size = 44, label = '', className = '' }) => {
    const safeSize = Number(size) || 44;

    return (
        <div className={`ue-loader ${className}`.trim()} role="status" aria-live="polite">
            <span
                className="ue-loader__ring"
                style={{ width: `${safeSize}px`, height: `${safeSize}px` }}
                aria-hidden="true"
            />
            {label ? <span className="ue-loader__label">{label}</span> : null}
        </div>
    );
};
