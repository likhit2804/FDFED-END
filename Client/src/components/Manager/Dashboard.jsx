import React, { memo, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Manager/Dashboard.css";

import { Loader } from "../Loader";
import { useSocket } from "../../hooks/useSocket";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const CHART_PALETTE = {
  plum: "#0F766E",
  emerald: "#15803D",
  slate: "#334155",
  slateSoft: "#94A3B8",
  danger: "#C94F45",
};
const NOTIFICATION_LIMIT = 5;

function formatCurrency(value = 0) {
  return `\u20B9${CURRENCY_FORMATTER.format(Number(value) || 0)}`;
}

function formatTimestamp(value) {
  if (!value) return "Just now";
  try {
    return TIME_FORMATTER.format(new Date(value));
  } catch (error) {
    return "Just now";
  }
}

function formatCompactPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function getCollectionRate(payments = {}) {
  const total = payments.paid + payments.pending + payments.overdue;
  if (!total) return 0;
  return (payments.paid / total) * 100;
}

function getBookingApprovalRate(bookings = {}) {
  const total = bookings.pending + bookings.approved;
  if (!total) return 0;
  return (bookings.approved / total) * 100;
}

function getServiceStability(issues = {}) {
  const total = issues.pending + issues.resolved;
  if (!total) return 0;
  return (issues.resolved / total) * 100;
}

function buildAttentionItems(data) {
  const payments = data?.payments || {};
  const issues = data?.issues || {};
  const bookings = data?.bookings || {};

  return [
    {
      title: "Overdue collections",
      count: payments.overdue || 0,
      note:
        payments.overdue > 0
          ? `${formatCurrency(payments.amounts?.overdue || 0)} waiting to be recovered`
          : "Collection cycle is under control",
      action: "Review payments",
      href: "/manager/payments",
      tone: "danger",
    },
    {
      title: "Urgent service issues",
      count: issues.urgent || 0,
      note:
        issues.urgent > 0
          ? `${issues.pending || 0} issues still open in the property`
          : "No urgent issues need escalation",
      action: "Open issue desk",
      href: "/manager/issueResolving",
      tone: "warning",
    },
    {
      title: "Booking approvals",
      count: bookings.pending || 0,
      note:
        bookings.pending > 0
          ? `${bookings.approved || 0} already approved for upcoming use`
          : "Common space requests are up to date",
      action: "Manage bookings",
      href: "/manager/commonSpace",
      tone: "accent",
    },
  ];
}

function buildTimeline(data) {
  const issueItems = (data?.issues?.recent || []).map((issue) => ({
    id: `issue-${issue._id}`,
    type: "Issue",
    title: issue.title || "Issue raised",
    subtitle: issue.resident || "Resident",
    timestamp: issue.createdAt,
    tone: issue.priority === "High" ? "danger" : "warning",
  }));

  const bookingItems = (data?.bookings?.recent || []).map((booking) => ({
    id: `booking-${booking._id}`,
    type: "Booking",
    title: booking.name || "Common space booking",
    subtitle: booking.bookedBy || "Resident",
    timestamp: booking.createdAt,
    tone: booking.status === "Pending" ? "accent" : "success",
  }));

  return [...issueItems, ...bookingItems]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 6);
}

const HeroBanner = memo(function HeroBanner({ data, onNavigate }) {
  const pendingActions =
    (data?.payments?.overdue || 0) +
    (data?.issues?.urgent || 0) +
    (data?.bookings?.pending || 0);

  return (
    <section className="manager-hero">
      <div className="manager-hero__content">
        <div className="manager-hero__eyebrow">Manager Dashboard</div>
        <h1 className="manager-hero__title">Stay ahead of daily community operations.</h1>
        <p className="manager-hero__subtitle">
          {pendingActions > 0
            ? `${pendingActions} items need attention across collections, bookings, and service operations.`
            : "Operations are stable right now. Use this view to monitor activity, dues, and resident demand."}
        </p>
        <div className="manager-hero__chips">
          <span className="manager-chip manager-chip--solid">
            {formatCompactPercent(getCollectionRate(data?.payments || {}))} collection health
          </span>
          <span className="manager-chip">
            {formatCompactPercent(getBookingApprovalRate(data?.bookings || {}))} booking approval rate
          </span>
          <span className="manager-chip">{DATE_FORMATTER.format(new Date())}</span>
        </div>
      </div>

      <div className="manager-hero__actions">
        <button type="button" className="manager-hero__button" onClick={() => onNavigate("/manager/userManagement")}>
          Add Resident
        </button>
        <button type="button" className="manager-hero__button" onClick={() => onNavigate("/manager/payments")}>
          Create Due
        </button>
        <button
          type="button"
          className="manager-hero__button manager-hero__button--primary"
          onClick={() => onNavigate("/manager/commonSpace")}
        >
          Approve Booking
        </button>
      </div>
    </section>
  );
});

const OpsStrip = memo(function OpsStrip({ data, loading }) {
  const cards = [
    {
      label: "Residents",
      value: data?.summary?.totalResidents ?? 0,
      note: `${data?.bookings?.approved ?? 0} active facility bookings`,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Workers On Duty",
      value: data?.summary?.totalWorkers ?? 0,
      note: `${data?.issues?.pending ?? 0} open tasks in circulation`,
      icon: Briefcase,
      tone: "green",
    },
    {
      label: "Open Issues",
      value: data?.issues?.pending ?? 0,
      note: `${data?.issues?.urgent ?? 0} marked urgent`,
      icon: AlertCircle,
      tone: "amber",
    },
    {
      label: "Visitors Today",
      value: data?.visitors?.today ?? 0,
      note: `${data?.summary?.totalVisitors ?? 0} visitor records in community`,
      icon: UserCheck,
      tone: "teal",
    },
    {
      label: "Dues Pending",
      value: formatCurrency(data?.payments?.amounts?.pending || 0),
      note: `${data?.payments?.overdue ?? 0} overdue payment records`,
      icon: CircleDollarSign,
      tone: "rose",
    },
  ];

  return (
    <section className="manager-ops-strip">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className={`manager-ops-card manager-ops-card--${card.tone}`}>
            <div className="manager-ops-card__meta">
              <span className="manager-ops-card__label">{card.label}</span>
              <div className="manager-ops-card__icon">
                <Icon size={18} />
              </div>
            </div>
            <div className="manager-ops-card__value">{loading ? "\u2014" : card.value}</div>
            <div className="manager-ops-card__note">{card.note}</div>
          </article>
        );
      })}
    </section>
  );
});

const AttentionQueue = memo(function AttentionQueue({ data, onNavigate, loading }) {
  const items = buildAttentionItems(data);

  return (
    <section className="manager-panel manager-panel--queue">
      <div className="manager-panel__header">
        <div>
          <div className="manager-panel__eyebrow">Attention Queue</div>
          <h2 className="manager-panel__title">What needs action now</h2>
        </div>
      </div>

      <div className="manager-queue">
        {items.map((item) => {
          return (
            <article key={item.title} className={`manager-queue-item manager-queue-item--${item.tone}`}>
              <div className="manager-queue-item__body">
                <div className="manager-queue-item__row">
                  <h3>{item.title}</h3>
                  <span className="manager-queue-item__count">{loading ? "\u2014" : item.count}</span>
                </div>
                <p>{item.note}</p>
                <button type="button" className="manager-queue-item__action" onClick={() => onNavigate(item.href)}>
                  {item.action}
                  <ChevronRight size={15} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
});

const CommunityPulse = memo(function CommunityPulse({ data, loading }) {
  const pulseStats = [
    {
      label: "Collection Health",
      value: formatCompactPercent(getCollectionRate(data?.payments || {})),
      progress: getCollectionRate(data?.payments || {}),
      tone: "green",
    },
    {
      label: "Service Stability",
      value: formatCompactPercent(getServiceStability(data?.issues || {})),
      progress: getServiceStability(data?.issues || {}),
      tone: "blue",
    },
    {
      label: "Booking Flow",
      value: formatCompactPercent(getBookingApprovalRate(data?.bookings || {})),
      progress: getBookingApprovalRate(data?.bookings || {}),
      tone: "amber",
    },
  ];

  const timeline = buildTimeline(data);

  return (
    <section className="manager-panel manager-panel--pulse">
      <div className="manager-panel__header">
        <div>
          <div className="manager-panel__eyebrow">Community Pulse</div>
          <h2 className="manager-panel__title">Live health across the campus</h2>
        </div>
      </div>

      <div className="manager-pulse-grid">
        <div className="manager-pulse-card">
          <div className="manager-pulse-card__title">Operational balance</div>
          <div className="manager-pulse-card__stats">
            {pulseStats.map((stat) => (
              <div key={stat.label} className="manager-progress">
                <div className="manager-progress__row">
                  <span>{stat.label}</span>
                  <strong>{loading ? "\u2014" : stat.value}</strong>
                </div>
                <div className="manager-progress__track">
                  <div
                    className={`manager-progress__fill manager-progress__fill--${stat.tone}`}
                    style={{ width: `${loading ? 0 : stat.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="manager-pulse-card manager-pulse-card--timeline">
          <div className="manager-pulse-card__title">Today&apos;s movement</div>
          <div className="manager-timeline">
            {loading ? (
              <div className="manager-timeline__empty">
                <Loader label="Loading recent activity..." size={34} />
              </div>
            ) : timeline.length === 0 ? (
              <div className="manager-timeline__empty">No fresh activity has reached the desk yet.</div>
            ) : (
              timeline.map((entry) => (
                <div key={entry.id} className="manager-timeline__item">
                  <span className={`manager-timeline__dot manager-timeline__dot--${entry.tone}`} />
                  <div className="manager-timeline__content">
                    <div className="manager-timeline__meta">
                      <span className="manager-timeline__type">{entry.type}</span>
                      <span className="manager-timeline__time">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    <div className="manager-timeline__title">{entry.title}</div>
                    <div className="manager-timeline__subtitle">{entry.subtitle}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

const LiveDesk = memo(function LiveDesk({ data, loading, bookings, onNavigate }) {
  const notifications = data?.notifications || [];
  const recentBookings = bookings || [];

  return (
    <aside className="manager-panel manager-panel--desk manager-live-desk">
      <div className="manager-panel__header">
        <div>
          <div className="manager-panel__eyebrow">Live Desk</div>
          <h2 className="manager-panel__title">Updates the manager should not miss</h2>
        </div>
      </div>

      <div className="manager-live-desk__section">
        <div className="manager-live-desk__section-head">
          <span>Notification rail</span>
          <button type="button" onClick={() => onNavigate("/manager/commonSpace")}>
            Open bookings
          </button>
        </div>
        <div className="manager-live-feed">
          {loading ? (
            <div className="manager-live-feed__empty">
              <Loader label="Loading notifications..." size={34} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="manager-live-feed__empty">No notifications have arrived yet.</div>
          ) : (
            notifications.slice(0, NOTIFICATION_LIMIT).map((notification, index) => (
              <article key={`${notification._id || index}-${notification.title || "note"}`} className="manager-live-feed__item">
                <span className="manager-live-feed__marker" />
                <div>
                  <div className="manager-live-feed__title">{notification.title || "Activity update"}</div>
                  <p>{notification.message || "A new update is available on the desk."}</p>
                  <small>{formatTimestamp(notification.createdAt)}</small>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="manager-live-desk__section">
        <div className="manager-live-desk__section-head">
          <span>Booking pulse</span>
          <button type="button" onClick={() => onNavigate("/manager/commonSpace")}>
            Review all
          </button>
        </div>
        <div className="manager-live-bookings">
          {loading ? (
            <div className="manager-live-feed__empty">
              <Loader label="Loading booking activity..." size={34} />
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="manager-live-feed__empty">No booking activity has been recorded yet.</div>
          ) : (
            recentBookings.slice(0, 4).map((booking) => (
              <article key={booking._id} className="manager-live-bookings__item">
                <div>
                  <div className="manager-live-bookings__name">{booking.name || "Common space request"}</div>
                  <div className="manager-live-bookings__meta">
                    {booking.bookedBy || "Resident"} . {formatTimestamp(booking.createdAt)}
                  </div>
                </div>
                <span className={`manager-status manager-status--${String(booking.status || "").toLowerCase()}`}>
                  {booking.status || "Unknown"}
                </span>
              </article>
            ))
          )}
        </div>
      </div>
    </aside>
  );
});

const RevenuePanel = memo(function RevenuePanel({ data, loading }) {
  const payments = data?.payments || {};
  const paymentData = [
    { name: "Paid", value: payments.amounts?.paid || 0, color: CHART_PALETTE.emerald },
    { name: "Pending", value: payments.amounts?.pending || 0, color: CHART_PALETTE.plum },
    { name: "Overdue", value: payments.amounts?.overdue || 0, color: CHART_PALETTE.danger },
  ].filter((item) => item.value > 0);

  const totalAmount = paymentData.reduce((sum, item) => sum + item.value, 0);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div className="manager-chart-tooltip">
        <strong>{item.name}</strong>
        <span>{formatCurrency(item.value)}</span>
      </div>
    );
  };

  return (
    <section className="manager-panel manager-panel--chart">
      <div className="manager-panel__header">
        <div>
          <div className="manager-panel__eyebrow">Finance</div>
          <h2 className="manager-panel__title">Collections and dues mix</h2>
        </div>
      </div>

      <div className="manager-chart-summary">
        <div>
          <div className="manager-chart-summary__label">Recovered</div>
          <div className="manager-chart-summary__value">{loading ? "\u2014" : formatCurrency(payments.amounts?.paid || 0)}</div>
        </div>
        <div>
          <div className="manager-chart-summary__label">Total tracked</div>
          <div className="manager-chart-summary__value">{loading ? "\u2014" : formatCurrency(totalAmount)}</div>
        </div>
      </div>

      <div className="manager-chart-area">
        {loading ? (
          <div className="manager-chart-empty">
            <Loader label="Preparing finance snapshot..." size={34} />
          </div>
        ) : paymentData.length === 0 ? (
          <div className="manager-chart-empty">No payment data is available for this community yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={paymentData}
                dataKey="value"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={4}
                stroke="#f8f7ff"
                strokeWidth={6}
              >
                {paymentData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="manager-legend-label">
                    {value}: {formatCurrency(entry.payload.value)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
});

const OperationsChart = memo(function OperationsChart({ data, loading }) {
  const chartData = [
    {
      name: "Issues",
      stable: data?.issues?.resolved || 0,
      attention: data?.issues?.pending || 0,
    },
    {
      name: "Bookings",
      stable: data?.bookings?.approved || 0,
      attention: data?.bookings?.pending || 0,
    },
    {
      name: "Payments",
      stable: data?.payments?.paid || 0,
      attention: data?.payments?.overdue || 0,
    },
  ];

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="manager-chart-tooltip">
        <strong>{label}</strong>
        {payload.map((entry) => (
          <span key={entry.dataKey}>
            {entry.name}: {entry.value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="manager-panel manager-panel--chart">
      <div className="manager-panel__header">
        <div>
          <div className="manager-panel__eyebrow">Service Snapshot</div>
          <h2 className="manager-panel__title">Stable load vs items needing intervention</h2>
        </div>
      </div>

      <div className="manager-chart-summary">
        <div>
          <div className="manager-chart-summary__label">Urgent issues</div>
          <div className="manager-chart-summary__value">{loading ? "\u2014" : data?.issues?.urgent || 0}</div>
        </div>
        <div>
          <div className="manager-chart-summary__label">Pending bookings</div>
          <div className="manager-chart-summary__value">{loading ? "\u2014" : data?.bookings?.pending || 0}</div>
        </div>
      </div>

      <div className="manager-chart-area">
        {loading ? (
          <div className="manager-chart-empty">
            <Loader label="Preparing service snapshot..." size={34} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <RechartsBarChart data={chartData} barGap={10}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="#64748b"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#64748b"
              />
              <Tooltip
                content={renderTooltip}
                cursor={{ fill: "#fbfaff" }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span className="manager-legend-label">{value}</span>}
              />
              <Bar
                dataKey="stable"
                name="Stable / approved"
                radius={[10, 10, 0, 0]}
                fill={CHART_PALETTE.emerald}
              />
              <Bar
                dataKey="attention"
                name="Needs attention"
                radius={[10, 10, 0, 0]}
                fill={CHART_PALETTE.slate}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
});

export function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const socket = useSocket("");
  const navigate = useNavigate();

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
        setLoading(true);
        setError(null);

        const response = await fetch("/manager/api/dashboard", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 401) {
          setError("Unauthorized: Please log in again");
          return;
        }

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || `Failed: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format.");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch dashboard data");
        }

        setDashboardData(result.data);
        setBookingNotifications(result.data.bookings?.recent || []);
      } catch (requestError) {
        setError(requestError.message || "An error occurred while fetching dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
        <AlertCircle size={20} className="me-2" />
        {error}
        <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
      </div>
    );
  }

  return (
    <main className="manager-dashboard-shell">
      <div className="manager-dashboard-shell__inner">
        <HeroBanner data={dashboardData} onNavigate={navigate} />
        <OpsStrip data={dashboardData} loading={loading} />

        <section className="manager-dashboard-grid">
          <div className="manager-dashboard-grid__main">
            <AttentionQueue data={dashboardData} onNavigate={navigate} loading={loading} />
            <CommunityPulse data={dashboardData} loading={loading} />
          </div>

          <div className="manager-dashboard-grid__side">
            <LiveDesk
              data={dashboardData}
              loading={loading}
              bookings={bookingNotifications}
              onNavigate={navigate}
            />
          </div>
        </section>

        <section className="manager-dashboard-charts">
          <RevenuePanel data={dashboardData} loading={loading} />
          <OperationsChart data={dashboardData} loading={loading} />
        </section>
      </div>
    </main>
  );
}
