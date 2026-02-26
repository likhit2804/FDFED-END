import { useEffect, useRef } from 'react';
import { X, Mail, Phone, Building2, User } from 'lucide-react';
import styles from './ManagerDetailModal.module.css';

const ManagerDetailModal = ({ isOpen, onClose, manager, communityName }) => {
    const modalRef = useRef(null);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // If no manager assigned
    if (!manager || manager === 'Unassigned') {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.header}>
                        <div>
                            <h2>Community Manager</h2>
                            <div className={styles.headerSub}>{communityName}</div>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
                            <X size={18} />
                        </button>
                    </div>
                    <div className={styles.unassigned}>
                        <User size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p>No manager assigned to this community.</p>
                    </div>
                    <div className={styles.footer}>
                        <button onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2>Community Manager</h2>
                        <div className={styles.headerSub}>{communityName}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.avatar}>
                        {getInitials(manager.name)}
                    </div>

                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <User size={18} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <div className={styles.infoLabel}>Name</div>
                                <div className={styles.infoValue}>{manager.name}</div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <Mail size={18} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <div className={styles.infoLabel}>Email</div>
                                <div className={styles.infoValue}>{manager.email || 'N/A'}</div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <Phone size={18} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <div className={styles.infoLabel}>Phone</div>
                                <div className={styles.infoValue}>{manager.contact || 'N/A'}</div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <Building2 size={18} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <div className={styles.infoLabel}>Community</div>
                                <div className={styles.infoValue}>{communityName}</div>
                            </div>
                        </div>
                    </div>

                    {/* Contact actions */}
                    <div className={styles.contactActions}>
                        {manager.email && manager.email !== 'N/A' && (
                            <a href={`mailto:${manager.email}`} className={`${styles.contactLink} ${styles.emailLink}`}>
                                <Mail size={16} />
                                Email
                            </a>
                        )}
                        {manager.contact && manager.contact !== 'N/A' && (
                            <a href={`tel:${manager.contact}`} className={`${styles.contactLink} ${styles.phoneLink}`}>
                                <Phone size={16} />
                                Call
                            </a>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ManagerDetailModal;
