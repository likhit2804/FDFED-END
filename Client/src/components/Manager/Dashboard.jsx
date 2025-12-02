import React, { useState } from "react";
import {
    Building2,
    LogOut,
    Users,
    Briefcase,
    AlertCircle,
    UserCheck,
    Calendar,
    DollarSign,
    TrendingUp,
    Bell,
    Wrench,
    Package,
    Clock,
    AlertTriangle,
} from "lucide-react";
import {
    Line,
    LineChart as RechartsLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Manager/Dashboard.css"; // Your custom CSS file

function SummaryCards() {
    const summaryData = [
        { title: "Total Residents", value: "342", change: "+12 this month", icon: Users, color: "text-primary", bg: "bg-light" },
        { title: "Total Workers", value: "28", change: "4 on leave", icon: Briefcase, color: "text-purple", bg: "bg-light" },
        { title: "Active Issues", value: "15", change: "3 urgent", icon: AlertCircle, color: "text-danger", bg: "bg-light" },
        { title: "Today's Visitors", value: "47", change: "8 currently inside", icon: UserCheck, color: "text-success", bg: "bg-light" },
        { title: "Active Bookings", value: "12", change: "5 for today", icon: Calendar, color: "text-warning", bg: "bg-light" },
        { title: "Revenue Collected", value: "₹4.2L", change: "+18% vs last month", icon: DollarSign, color: "text-info", bg: "bg-light" },
    ];

    return (
        <div className="container-fluid p-0">
            <div className="summaryGrid">
                {summaryData.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div key={i} className="m-1">
                            <div className="card text-center p-3 shadow-sm summary-card">
                                <div className="d-flex flex-column align-items-center">
                                    <div className={`rounded-circle mb-2 p-2 ${item.bg}`}>
                                        <Icon className={`${item.color}`} size={24} />
                                    </div>
                                    <p className="text-muted small mb-0">{item.title}</p>
                                    <h5 className="fw-bold">{item.value}</h5>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PaymentsRevenue() {
    const paymentStatusData = [
        { name: "Paid", value: 285000, color: "#10b981" },
        { name: "Pending", value: 124000, color: "#f59e0b" },
        { name: "Overdue", value: 48000, color: "#ef4444" },
    ];

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <DollarSign className="text-success" /> Revenue Summary (This month)
                </div>
                <div className="card-body">
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300} style={{outline:'none'}} >
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {paymentStatusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} style={{ outline: 'none' }} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(1)}K`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportsAnalytics() {
    const issueResolutionData = [
        { week: "Week 1", resolved: 12, pending: 5, new: 8 },
        { week: "Week 2", resolved: 15, pending: 8, new: 10 },
        { week: "Week 3", resolved: 18, pending: 6, new: 7 },
        { week: "Week 4", resolved: 20, pending: 4, new: 5 },
    ];

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <TrendingUp className="text-warning" /> Issue Resolution Trends
                </div>
                <div className="card-body">
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300} >
                            <RechartsLine data={issueResolutionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="week" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981" }} />
                                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: "#f59e0b" }} />
                                <Line type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: "#3b82f6" }} />
                            </RechartsLine>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotificationsPanel() {
    const notifications = [
        { icon: UserCheck, title: "New Visitor", message: "Priya Sharma checked in at B-501", time: "5 mins ago", color: "text-success" },
        { icon: AlertTriangle, title: "Urgent Issue", message: "Lift maintenance in Building A", time: "30 mins ago", color: "text-danger" },
        { icon: DollarSign, title: "Overdue Payment", message: "A-401 pending ₹5,500", time: "1 hour ago", color: "text-warning" },
        { icon: Wrench, title: "Task Completed", message: "Cleaning completed", time: "2 hours ago", color: "text-primary" },
    ];

    return (
        <aside className="container-fluid p-0 ">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <Bell className="text-warning" /> Notifications
                </div>
                <div className="card-body notification-scroll">
                    {notifications.map((n, i) => {
                        const Icon = n.icon;
                        return (
                            <div key={i} className="d-flex align-items-start mb-3">
                                <div className="me-3">
                                    <Icon className={`${n.color}`} size={20} />
                                </div>
                                <div>
                                    <p className="mb-0 fw-semibold">{n.title}</p>
                                    <small className="text-muted d-block">{n.message}</small>
                                    <small className="text-secondary">{n.time}</small>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

export function ManagerDashboard() {
    return (
        <>
            <main className="pb-5">
                <div className=" container-fluid mb-3">
                    <div className="row">
                        <div className="col-8">
                        <SummaryCards />
                        </div>
                        <div className="col-4">
                            <NotificationsPanel />
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2 container-fluid">
                    <PaymentsRevenue />
                    <ReportsAnalytics />
                </div>
            </main>
        </>
    );
}