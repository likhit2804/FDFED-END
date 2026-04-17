import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal – accessible slide-in dialog
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   title     {string}
 *   size      {'sm'|'md'|'lg'|'xl'}  default 'md'
 *   footer    {ReactNode}  buttons/actions in footer
 *   children  {ReactNode}  body content
 *   scrollable {boolean}   scrollable body, default true
 */
const SIZES = {
    sm: 400,
    md: 560,
    lg: 700,
    xl: 880,
};

const Modal = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    footer,
    children,
    scrollable = true,
}) => {
    const contentRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxW = SIZES[size] ?? SIZES.md;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1100, padding: 16,
                animation: 'ue-modal-fade 0.18s ease',
            }}
        >
            <style>{`
        @keyframes ue-modal-fade { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
      `}</style>

            <div
                ref={contentRef}
                style={{
                    background: '#fff',
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: maxW,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
                }}>
                    {title && (
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h2>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f3f4f6', border: 'none', borderRadius: 8,
                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#6b7280', marginLeft: 'auto',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: scrollable ? 'auto' : 'visible',
                    flex: 1,
                }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '14px 24px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex', gap: 10, justifyContent: 'flex-end',
                        background: '#f9fafb', flexShrink: 0,
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
