import React from 'react';

/**
 * FormSection – groups related form fields under a titled section
 *
 * Props:
 *   title    {string}
 *   subtitle {string}
 *   columns  {number}  grid columns, default 1
 *   children {ReactNode}
 */
const FormSection = ({ title, subtitle, columns = 1, children }) => (
    <div style={{ marginBottom: 24 }}>
        {title && (
            <div style={{ marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {title}
                </p>
                {subtitle && (
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#9ca3af' }}>{subtitle}</p>
                )}
                <div style={{ height: 1, background: '#e5e7eb', marginTop: 10 }} />
            </div>
        )}
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '0 20px',
        }}>
            {children}
        </div>
    </div>
);

export default FormSection;
