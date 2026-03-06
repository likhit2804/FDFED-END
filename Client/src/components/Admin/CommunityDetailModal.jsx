import { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, Users, Wrench, Shield, Info, MapPin, Calendar, Building2, Image as ImageIcon, Key } from 'lucide-react';
import adminApiClient from '../../services/adminApiClient';
import styles from './CommunityDetailModal.module.css';

const CommunityDetailModal = ({ isOpen, onClose, communityId, communityName }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !communityId) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const result = await adminApiClient.getCommunityDetail(communityId);
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error('Error fetching community detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
        setActiveTab('overview');
    }, [isOpen, communityId]);

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
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return styles.statusActive;
            case 'pending': return styles.statusPending;
            case 'expired': return styles.statusExpired;
            default: return styles.statusPending;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: Info },
        { key: 'residents', label: 'Residents', icon: Users },
        { key: 'workers', label: 'Workers', icon: Wrench },
        { key: 'securities', label: 'Security', icon: Shield },
    ];

    const renderPersonCard = (person, extraInfo) => (
        <div key={person._id} className={styles.personCard}>
            <div className={styles.personAvatar}>
                {person.image ? (
                    <img src={person.image} alt={person.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    getInitials(person.name)
                )}
            </div>
            <div className={styles.personInfo}>
                <div className={styles.personName}>{person.name}</div>
                <div className={styles.personMeta}>{extraInfo}</div>
            </div>
            <div className={styles.personActions}>
                {person.email && person.email !== 'N/A' && (
                    <a href={`mailto:${person.email}`} className={styles.contactBtn} title={`Email ${person.name}`}>
                        <Mail size={14} />
                    </a>
                )}
                {person.contact && person.contact !== 'N/A' && (
                    <a href={`tel:${person.contact}`} className={styles.contactBtn} title={`Call ${person.name}`}>
                        <Phone size={14} />
                    </a>
                )}
            </div>
        </div>
    );

    const renderOverview = () => {
        if (!data) return null;
        const c = data.community;
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

        return (
            <div className={styles.overviewSection}>
                {/* Community Photos */}
                {(c.profile?.logo || (c.profile?.photos && c.profile.photos.length > 0)) && (
                    <div className={styles.overviewBlock}>
                        <h4 className={styles.overviewTitle}>
                            <ImageIcon size={15} style={{ marginRight: 6 }} />
                            Photos
                        </h4>
                        <div className={styles.photoGrid}>
                            {c.profile.logo && (
                                <div className={styles.photoItem}>
                                    <img
                                        src={`${API_BASE}/${c.profile.logo}`}
                                        alt="Community Logo"
                                        className={styles.photoImg}
                                    />
                                    <span className={styles.photoLabel}>Logo</span>
                                </div>
                            )}
                            {c.profile.photos.map((photo, idx) => (
                                <div key={idx} className={styles.photoItem}>
                                    <img
                                        src={`${API_BASE}/${photo}`}
                                        alt={`Community photo ${idx + 1}`}
                                        className={styles.photoImg}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Details Grid */}
                <div className={styles.overviewBlock}>
                    <h4 className={styles.overviewTitle}>
                        <Info size={15} style={{ marginRight: 6 }} />
                        Community Details
                    </h4>
                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <Key size={14} className={styles.detailIcon} />
                            <div>
                                <span className={styles.detailLabel}>Community Code</span>
                                <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                    {c.communityCode || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <Calendar size={14} className={styles.detailIcon} />
                            <div>
                                <span className={styles.detailLabel}>Created</span>
                                <span className={styles.detailValue}>{formatDate(c.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {c.description && (
                    <div className={styles.overviewBlock}>
                        <h4 className={styles.overviewTitle}>Description</h4>
                        <p className={styles.descriptionText}>{c.description}</p>
                    </div>
                )}

                {/* Structure */}
                {c.hasStructure && (
                    <div className={styles.overviewBlock}>
                        <h4 className={styles.overviewTitle}>
                            <Building2 size={15} style={{ marginRight: 6 }} />
                            Structure
                        </h4>
                        <div className={styles.structureRow}>
                            <div className={styles.structureItem}>
                                <span className={styles.structureValue}>{c.blocksCount}</span>
                                <span className={styles.structureLabel}>Blocks</span>
                            </div>
                            <div className={styles.structureItem}>
                                <span className={styles.structureValue}>{c.totalFlats}</span>
                                <span className={styles.structureLabel}>Total Flats</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscription */}
                <div className={styles.overviewBlock}>
                    <h4 className={styles.overviewTitle}>Subscription</h4>
                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <div>
                                <span className={styles.detailLabel}>Plan</span>
                                <span className={styles.detailValue}>{c.subscriptionPlan || 'None'}</span>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <div>
                                <span className={styles.detailLabel}>Member Since</span>
                                <span className={styles.detailValue}>{formatDate(c.createdAt)}</span>
                            </div>
                        </div>
                        {c.planStartDate && (
                            <div className={styles.detailItem}>
                                <div>
                                    <span className={styles.detailLabel}>Last Subscribed</span>
                                    <span className={styles.detailValue}>{formatDate(c.planStartDate)}</span>
                                </div>
                            </div>
                        )}
                        {c.planEndDate && (
                            <div className={styles.detailItem}>
                                <div>
                                    <span className={styles.detailLabel}>Expires On</span>
                                    <span className={styles.detailValue}>{formatDate(c.planEndDate)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Manager */}
                {data.manager && (
                    <div className={styles.overviewBlock}>
                        <h4 className={styles.overviewTitle}>Manager</h4>
                        {renderPersonCard(data.manager, data.manager.email)}
                    </div>
                )}
            </div>
        );
    };

    const renderTabContent = () => {
        if (!data) return null;

        if (activeTab === 'overview') return renderOverview();

        const lists = {
            residents: {
                items: data.residents,
                getExtra: (r) => `Flat: ${r.flat} · ${r.email}`,
            },
            workers: {
                items: data.workers,
                getExtra: (w) => `${w.jobRole} · ${w.contact}`,
            },
            securities: {
                items: data.securities,
                getExtra: (s) => `Shift: ${s.shift} · ${s.contact}`,
            },
        };

        const current = lists[activeTab];
        if (!current || current.items.length === 0) {
            return <div className={styles.emptyState}>No {activeTab} found in this community.</div>;
        }

        return (
            <div className={styles.personList}>
                {current.items.map(person => renderPersonCard(person, current.getExtra(person)))}
            </div>
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2>{loading ? communityName : data?.community?.name || communityName}</h2>
                        {data?.community && (
                            <div className={styles.headerSub}>
                                <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {data.community.location}
                                {' · '}
                                <span className={`${styles.statusBadge} ${getStatusClass(data.community.subscriptionStatus)}`}>
                                    {data.community.subscriptionStatus}
                                </span>
                            </div>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <span>Loading community details...</span>
                    </div>
                ) : data ? (
                    <>


                        {/* Tabs */}
                        <div className={styles.tabs}>
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const count = tab.key === 'overview' ? null : (data.counts[tab.key] || data[tab.key]?.length || 0);
                                return (
                                    <button
                                        key={tab.key}
                                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        <Icon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        {tab.label}{count !== null ? ` (${count})` : ''}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className={styles.content}>
                            {renderTabContent()}
                        </div>
                    </>
                ) : null}

                {/* Footer */}
                <div className={styles.footer}>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default CommunityDetailModal;
