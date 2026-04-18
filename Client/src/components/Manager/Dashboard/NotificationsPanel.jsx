import React, { memo } from "react";
import { Bell, Calendar, AlertTriangle, Loader2 } from "lucide-react";

const NOTIFICATION_STYLES = {
    CommonSpaces: { icon: Calendar, colorClass: "text-primary", bg: "var(--info-soft)" },
    Issues: { icon: AlertTriangle, colorClass: "text-warning", bg: "var(--warning-soft)" },
    default: { icon: Bell, colorClass: "text-info", bg: "#e0f2fe" },
};
const NOTIFICATION_LIMIT = 5;

const getStyle = (type) => NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.default;

function NotificationsPanel({ data, loading, bookings = [] }) {
    const notifications = data?.notifications || [];
    const visibleNotifications = notifications.slice(0, NOTIFICATION_LIMIT);

    return (
        <aside className="h-100">
            <div className="card shadow-lg border-0 h-100" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-header fw-semibold d-flex align-items-center justify-content-between px-4 py-3"
                    style={{ background: "white", color: "rgba(55, 55, 55, 1)" }}>
                    <div className="d-flex align-items-center gap-2">
                        <Bell size={24} />
                        <span style={{ fontSize: "16px" }}>Recent Activity</span>
                    </div>
                    <span className="badge bg-white text-dark" style={{ fontSize: "11px", fontWeight: "600" }}>{notifications.length}</span>
                </div>
                <div className="card-body p-0" style={{ maxHeight: "600px", overflowY: "auto", background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)" }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center p-5">
                            <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center p-5">
                            <Bell className="text-muted mb-3" size={48} style={{ opacity: 0.3 }} />
                            <p className="text-muted mb-0">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="p-3">
                            {visibleNotifications.map((n, i) => {
                                const { icon: Icon, colorClass, bg } = getStyle(n.referenceType);
                                return (
                                    <div key={i} className="d-flex align-items-start p-3 mb-2"
                                        style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #e5e7eb", transition: "all 0.2s ease", cursor: "pointer" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
                                    >
                                        <div className="d-flex align-items-center justify-content-center me-3"
                                            style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: bg, flexShrink: 0 }}>
                                            <Icon className={colorClass} size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p className="mb-1 fw-semibold" style={{ fontSize: "14px", color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                                            <small className="d-block text-muted mb-1" style={{ fontSize: "12px", lineHeight: "1.4" }}>{n.message}</small>
                                            <small className="text-secondary" style={{ fontSize: "11px" }}>{n.createdAt}</small>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

export const MemoizedNotificationsPanel = memo(NotificationsPanel);

