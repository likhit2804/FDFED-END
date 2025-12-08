import React, { useState, useEffect, memo } from "react";
import { toast } from "react-toastify";
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
    Loader2,
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
import "../../assets/css/Manager/Dashboard.css";
import { useSocket } from "../../hooks/useSocket";


const SummaryCards = memo(function SummaryCards({ data, loading }) {
    const summaryData = [
        {
            title: "Total Residents",
            value: loading ? "-" : data?.summary?.totalResidents || "0",
            change: "",
            icon: Users,
            color: "text-primary",
            bg: "bg-light"
        },
        {
            title: "Total Workers",
            value: loading ? "-" : data?.summary?.totalWorkers || "0",
            change: "",
            icon: Briefcase,
            color: "text-purple",
            bg: "bg-light"
        },
        {
            title: "Active Issues",
            value: loading ? "-" : data?.issues?.pending || "0",
            change: "",
            icon: AlertCircle,
            color: "text-danger",
            bg: "bg-light"
        },
        {
            title: "Today's Visitors",
            value: loading ? "-" : data?.visitors?.today || "0",
            change: "",
            icon: UserCheck,
            color: "text-success",
            bg: "bg-light"
        },
        {
            title: "Active Bookings",
            value: loading ? "-" : data?.bookings?.approved || "0",
            change: "",
            icon: Calendar,
            color: "text-warning",
            bg: "bg-light"
        },
        {
            title: "Revenue Collected",
            value: loading ? "-" : `₹${data?.payments?.amounts?.paid || 0}`,
            change: "",
            icon: DollarSign,
            color: "text-info",
            bg: "bg-light"
        },
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
                                    {item.change && <small className="text-muted">{item.change}</small>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const PaymentsRevenue = memo(function PaymentsRevenue({ data, loading }) {
    // Build payment data from backend with proper structure
    const stats = data?.payments || {};
    const paymentData = [
        { name: "Paid", value: stats.amounts?.paid || stats.paidAmount || 0, color: "#10b981" },
        { name: "Pending", value: stats.amounts?.pending || stats.pendingAmount || 0, color: "#f59e0b" },
        { name: "Overdue", value: stats.amounts?.overdue || stats.overdueAmount || 0, color: "#ef4444" },
    ].filter(item => item.value > 0); // Only show non-zero values

    // If no data, show default empty state
    if (paymentData.length === 0) {
        paymentData.push(
            { name: "Paid", value: 1, color: "#10b981" },
            { name: "Pending", value: 1, color: "#f59e0b" },
            { name: "Overdue", value: 1, color: "#ef4444" }
        );
    }

    console.log("Payment data for chart:", paymentData);

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <DollarSign className="text-success" /> Revenue Summary (This month)
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                            <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300} style={{ outline: "none" }}>
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, value, percent }) => `${name}: ₹${(value / 1000).toFixed(0)}K (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(1)}K`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
const defaultIssueData = [
    { week: "Week 1", resolved: 12, pending: 5, new: 8 },
    { week: "Week 2", resolved: 15, pending: 8, new: 10 },
    { week: "Week 3", resolved: 18, pending: 6, new: 7 },
    { week: "Week 4", resolved: 20, pending: 4, new: 5 },
];

const ReportsAnalytics = memo(function ReportsAnalytics({ data, loading }) {
    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <TrendingUp className="text-warning" /> Issue Resolution Trends
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                            <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsLine data={defaultIssueData}>
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
                    )}
                </div>
            </div>
        </div>
    );
});

function NotificationsPanel({ data, loading, bookings=[] }) {

    const notifications = data?.notifications || [];

    console.log("notifications : ",notifications);

    const getIcon = (referenceType) => {
        switch (referenceType) {
            case "CommonSpaces":
                return Calendar;
            case "Issues":
                return ExclamationTriangle ;
            default:
                return Bell;
        }
    };

    const getColor = (referenceType) => {
        switch (referenceType) {
            case "CommonSpaces":
                return "text-primary";
            case "Issues":
                return "text-warning";
            default:
                return "text-info";
        }
    };

    return (
        <aside className="container-fluid p-0 ">
            <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                    <Bell className="text-warning" /> Notifications
                </div>
                <div className="card-body notification-scroll">
                    {notifications.map((n, i) => {
                        const Icon = getIcon(n.referenceType);
                        const color = getColor(n.referenceType);
                        return (
                            <div key={i} className="d-flex align-items-start mb-3">
                                <div className="me-3">
                                    <Icon className={color} size={20} />
                                </div>
                                <div>
                                    <p className="mb-0 fw-semibold">{n.title}</p>
                                    <small className="text-muted d-block">{n.message}</small>
                                    <small className="text-secondary">{n.createdAt}</small>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

const MemoizedNotificationsPanel = memo(NotificationsPanel);

export function ManagerDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingNotifications, setBookingNotifications] = useState([]);

    // Initialize socket connection
    const socket = useSocket("http://localhost:3000");

    useEffect(() => {
        if (socket) {
            console.log("got socket in dashboard");

            socket.on("booking:new", (data) => {
                console.log("📦 New booking received:", data);
                setBookingNotifications((prev) => [data, ...prev.slice(0, 9)]);
                toast.success(`✅ ${data.message}`);
            });

            return () => {
                socket.off("booking:new");
            };
        }
    }, [socket]);
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("http://localhost:3000/manager/api/dashboard", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status === 401) {
                    setError("Unauthorized: Please log in again");
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.status}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Invalid response format. Expected JSON.");
                }

                const result = await response.json();
                console.log("dashboard data : ",result);

                if (result.success) {
                    setDashboardData(result.data);
                    setBookingNotifications(result.data.notifications);
                } else {
                    throw new Error(result.message || "Failed to fetch dashboard data");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err.message || "An error occurred while fetching dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        // Fetch data immediately
        fetchDashboardData();
    }, []);

    if (error) {
        return (
            <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
                <AlertCircle size={20} className="me-2" />
                {error}
                <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                    aria-label="Close"
                ></button>
            </div>
        );
    }

    console.log(bookingNotifications);


    return (
        <>
            <main className="pb-5">
                <div className="container-fluid mb-3">
                    <div className="row">
                        <div className="col-8">
                            <SummaryCards data={dashboardData} loading={loading} />
                        </div>
                        <div className="col-4" >
                            <MemoizedNotificationsPanel data={dashboardData} loading={loading} bookings={bookingNotifications} />
                        </div>

                    </div>

                </div>
                <div className="d-flex gap-2 container-fluid">
                    <div style={{ flex: 2 }}>
                        <PaymentsRevenue data={dashboardData} loading={loading} />
                        <ReportsAnalytics data={dashboardData} loading={loading} />
                    </div>

                </div>

            </main>
        </>
    );
}
