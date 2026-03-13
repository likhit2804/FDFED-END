import React, { useState, useEffect, memo } from "react";
import { toast } from "react-toastify";
import {
    Building2, LogOut, Users, Briefcase, AlertCircle, UserCheck, Calendar,
    DollarSign, TrendingUp, Bell, Wrench, Package, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import {
    Line, LineChart as RechartsLine, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";

import { useSocket } from "../../hooks/useSocket";
import { StatCard } from "../shared";
import { ChartTooltip } from "./Dashboard/ChartTooltip";
import { MemoizedNotificationsPanel } from "./Dashboard/NotificationsPanel";

/* ── Summary Cards ── */
const SummaryCards = memo(function SummaryCards({ data, loading }) {
    const stats = [
        { label: "Total Residents", value: data?.summary?.totalResidents ?? 0, icon: <Users size={22} />, iconColor: "#2563eb", iconBg: "#dbeafe" },
        { label: "Total Workers", value: data?.summary?.totalWorkers ?? 0, icon: <Briefcase size={22} />, iconColor: "#7c3aed", iconBg: "#ede9fe" },
        { label: "Active Issues", value: data?.issues?.pending ?? 0, icon: <AlertCircle size={22} />, iconColor: "#dc2626", iconBg: "#fee2e2" },
        { label: "Today's Visitors", value: data?.visitors?.today ?? 0, icon: <UserCheck size={22} />, iconColor: "#16a34a", iconBg: "#dcfce7" },
        { label: "Active Bookings", value: data?.bookings?.approved ?? 0, icon: <Calendar size={22} />, iconColor: "#d97706", iconBg: "#fef3c7" },
        { label: "Revenue Collected", value: `\u20B9${data?.payments?.amounts?.paid || 0}`, icon: <DollarSign size={22} />, iconColor: "#0891b2", iconBg: "#e0f2fe" },
    ];
    return (
        <div className="ue-stat-grid">
            {stats.map((s, i) => <StatCard key={i} loading={loading} {...s} />)}
        </div>
    );
});

/* ── Payments / Revenue Pie Chart ── */
const PaymentsRevenue = memo(function PaymentsRevenue({ data, loading }) {
    const stats = data?.payments || {};
    const paymentData = [
        { name: "Paid", value: stats.amounts?.paid || stats.paidAmount || 0, color: "#10b981", gradient: "url(#colorPaid)" },
        { name: "Pending", value: stats.amounts?.pending || stats.pendingAmount || 0, color: "#f59e0b", gradient: "url(#colorPending)" },
        { name: "Overdue", value: stats.amounts?.overdue || stats.overdueAmount || 0, color: "#ef4444", gradient: "url(#colorOverdue)" },
    ].filter((item) => item.value > 0);

    const totalAmount = paymentData.reduce((s, i) => s + i.value, 0);
    const hasPaymentData = totalAmount > 0 && paymentData.length > 0;
    const PieTooltip = ChartTooltip({ variant: "pie", totalAmount });

    const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
        const RADIAN = Math.PI / 180;
        const r = outerRadius + 30;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: "14px", fontWeight: "600" }}>{`${name} ${(percent * 100).toFixed(0)}%`}</text>;
    };

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-lg border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-header bg-gradient fw-semibold d-flex align-items-center justify-content-between px-4 py-3" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                    <div className="d-flex align-items-center gap-2"><DollarSign size={24} /><span style={{ fontSize: "16px" }}>Revenue Summary</span></div>
                    <span style={{ fontSize: "13px", opacity: 0.9 }}>This Month</span>
                </div>
                <div className="card-body p-4" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)" }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "360px" }}><Loader2 className="text-primary" size={40} style={{ animation: "spin 1s linear infinite" }} /></div>
                    ) : !hasPaymentData ? (
                        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "360px" }}>
                            <DollarSign size={64} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                            <h5 className="text-muted mb-2" style={{ fontWeight: "600" }}>No Payment Data</h5>
                            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>No revenue data available for this month yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 text-center">
                                <h3 className="mb-1" style={{ color: "#1f2937", fontWeight: "700" }}>₹{(totalAmount / 1000).toFixed(1)}K</h3>
                                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Total Revenue</p>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={340}>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={1} /><stop offset="100%" stopColor="#059669" stopOpacity={1} /></linearGradient>
                                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={1} /><stop offset="100%" stopColor="#d97706" stopOpacity={1} /></linearGradient>
                                            <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={1} /><stop offset="100%" stopColor="#dc2626" stopOpacity={1} /></linearGradient>
                                        </defs>
                                        <Pie data={paymentData} cx="50%" cy="50%" labelLine={{ stroke: "#9ca3af", strokeWidth: 1.5 }} label={renderCustomLabel} outerRadius={110} innerRadius={60} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                                            {paymentData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.gradient} stroke="#ffffff" strokeWidth={3} style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))", cursor: "pointer" }} />)}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, entry) => <span style={{ color: "#374151", fontWeight: "500", fontSize: "14px" }}>{value}: ₹{(entry.payload.value / 1000).toFixed(1)}K</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ── Issue Resolution Trends Line Chart ── */
const defaultIssueData = [
    { week: "Week 1", resolved: 12, pending: 5, new: 8 },
    { week: "Week 2", resolved: 15, pending: 8, new: 10 },
    { week: "Week 3", resolved: 18, pending: 6, new: 7 },
    { week: "Week 4", resolved: 20, pending: 4, new: 5 },
];

const LINE_SERIES = [
    { key: "resolved", color: "#10b981", gradientId: "colorResolved" },
    { key: "pending", color: "#f59e0b", gradientId: "colorPendingLine" },
    { key: "new", color: "#3b82f6", gradientId: "colorNew" },
];

const ReportsAnalytics = memo(function ReportsAnalytics({ data, loading }) {
    const issueData = data?.issues || {};
    const hasIssueData = issueData.pending > 0 || issueData.resolved > 0 || issueData.new > 0;
    const LineTooltip = ChartTooltip({ variant: "line" });

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-lg border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-header bg-gradient fw-semibold d-flex align-items-center justify-content-between px-4 py-3" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
                    <div className="d-flex align-items-center gap-2"><TrendingUp size={24} /><span style={{ fontSize: "16px" }}>Issue Resolution Trends</span></div>
                    <span style={{ fontSize: "13px", opacity: 0.9 }}>Last 4 Weeks</span>
                </div>
                <div className="card-body p-4" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)" }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "340px" }}><Loader2 className="text-primary" size={40} style={{ animation: "spin 1s linear infinite" }} /></div>
                    ) : !hasIssueData ? (
                        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "340px" }}>
                            <AlertCircle size={64} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                            <h5 className="text-muted mb-2" style={{ fontWeight: "600" }}>No Issue Data</h5>
                            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>No issue tracking data available yet.</p>
                        </div>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={340}>
                                <RechartsLine data={defaultIssueData}>
                                    <defs>
                                        {LINE_SERIES.map(({ color, gradientId }) => (
                                            <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.8} /><stop offset="95%" stopColor={color} stopOpacity={0.1} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                    <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: "13px", fontWeight: "500" }} tickLine={false} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: "13px", fontWeight: "500" }} tickLine={false} />
                                    <Tooltip content={<LineTooltip />} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: "20px" }} formatter={(v) => <span style={{ color: "#374151", fontWeight: "500", fontSize: "14px" }}>{v}</span>} />
                                    {LINE_SERIES.map(({ key, color, gradientId }) => (
                                        <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={3} dot={{ r: 6, fill: color, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }} fill={`url(#${gradientId})`} />
                                    ))}
                                </RechartsLine>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ── Main Dashboard ── */
export function ManagerDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingNotifications, setBookingNotifications] = useState([]);
    const socket = useSocket("");

    useEffect(() => {
        if (!socket) return;
        socket.on("booking:new", (data) => {
            setBookingNotifications((prev) => [data, ...prev.slice(0, 9)]);
            toast.success(data.message);
        });
        return () => socket.off("booking:new");
    }, [socket]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true); setError(null);
                const res = await fetch("/manager/api/dashboard", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
                if (res.status === 401) { setError("Unauthorized: Please log in again"); return; }
                if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Failed: ${res.status}`); }
                const ct = res.headers.get("content-type");
                if (!ct?.includes("application/json")) throw new Error("Invalid response format.");
                const result = await res.json();
                if (result.success) { setDashboardData(result.data); setBookingNotifications(result.data.notifications); }
                else throw new Error(result.message || "Failed to fetch dashboard data");
            } catch (err) { setError(err.message || "An error occurred while fetching dashboard data."); }
            finally { setLoading(false); }
        })();
    }, []);

    if (error) {
        return (
            <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
                <AlertCircle size={20} className="me-2" />{error}
                <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
            </div>
        );
    }

    return (
        <main className="pb-5" style={{ background: "linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)", minHeight: "100vh" }}>
            <div className="container-fluid px-4 pt-4">
                <div className="mb-4">
                    <h2 style={{ color: "#1f2937", fontWeight: "700", fontSize: "28px" }}>Dashboard Overview</h2>
                    <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: 0 }}>Welcome back! Here's what's happening in your community today.</p>
                </div>
                <div className="mb-4"><SummaryCards data={dashboardData} loading={loading} /></div>
                <div className="row g-4 mb-4">
                    <div className="col-12 col-lg-8">
                        <div className="mb-4"><PaymentsRevenue data={dashboardData} loading={loading} /></div>
                        <div><ReportsAnalytics data={dashboardData} loading={loading} /></div>
                    </div>
                    <div className="col-12 col-lg-4">
                        <div className="sticky-top" style={{ top: "70px" }}>
                            <MemoizedNotificationsPanel data={dashboardData} loading={loading} bookings={bookingNotifications} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
