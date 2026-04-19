import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, CalendarCheck2, Clock3 } from "lucide-react";
import axios from "axios";

import { Loader } from "../Loader";
import { DateRangeFilter, EmptyState, GraphBar, StatCard } from "../shared";
import {
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "../shared/roleUI";
import { UE_CHART_COLORS } from "../shared/chartPalette";

const formatTimestamp = (value) => {
  if (!value) return "Just now";
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch (error) {
    return "Just now";
  }
};

export const ResidentDashboard = () => {
  const LIST_LIMIT = 5;
  const [recents, setRecents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadDashboard = async (from = "", to = "") => {
    try {
      setLoading(true);
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await axios.get("/resident/api/dashboard", { params });
      const data = response.data;
      if (!data.success) return;

      setRecents(data.recents || []);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Resident dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const issueCount = useMemo(
    () =>
      recents.filter((item) =>
        String(item?.type || "").toLowerCase().includes("issue")
      ).length,
    [recents]
  );

  const paymentCount = useMemo(
    () =>
      recents.filter((item) =>
        String(item?.type || "").toLowerCase().includes("payment")
      ).length,
    [recents]
  );

  const preApprovalCount = useMemo(
    () =>
      recents.filter((item) =>
        String(item?.type || "").toLowerCase().includes("preapproval")
      ).length,
    [recents]
  );

  const activityGraphData = useMemo(
    () => [
      { name: "Issues", count: issueCount },
      { name: "Payments", count: paymentCount },
      { name: "Pre-Approvals", count: preApprovalCount },
      {
        name: "Common Space",
        count: recents.filter((item) => String(item?.type || "").toLowerCase().includes("commonspace")).length,
      },
    ],
    [issueCount, paymentCount, preApprovalCount, recents]
  );

  return (
    <ManagerPageShell
      eyebrow="Resident Desk"
      title="Stay updated on your community activity in one clean dashboard."
      description="Track recent activity, notifications, and emergency contacts with the same operational layout used in manager pages."
      chips={[`${recents.length} activity updates`, `${notifications.length} notifications`]}
      className="resident-ui-page"
    >
      <ManagerSection
        eyebrow="Snapshot"
        title="Community dashboard"
        description="Your latest activity and alerts at a glance."
      >
        <div className="ue-stat-grid">
          <StatCard
            label="Recent Updates"
            value={recents.length}
            icon={<Clock3 size={22} />}
            iconColor="var(--brand-500)"
            iconBg="var(--info-soft)"
          />
          <StatCard
            label="Payment Events"
            value={paymentCount}
            icon={<CalendarCheck2 size={22} />}
            iconColor="var(--info-600)"
            iconBg="var(--surface-2)"
          />
          <StatCard
            label="Issue Updates"
            value={issueCount}
            icon={<AlertCircle size={22} />}
            iconColor="var(--danger-500)"
            iconBg="var(--danger-soft)"
          />
          <StatCard
            label="Pre-Approvals"
            value={preApprovalCount}
            icon={<Bell size={22} />}
            iconColor="var(--text-subtle)"
            iconBg="var(--surface-2)"
          />
        </div>
      </ManagerSection>

      <ManagerSection
        eyebrow="Insights"
        title="Activity graph"
        description="Date-filtered distribution of your recent activity types."
        actions={(
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onApply={() => loadDashboard(fromDate, toDate)}
            onReset={() => {
              setFromDate("");
              setToDate("");
              loadDashboard("", "");
            }}
            loading={loading}
          />
        )}
      >
        {loading ? (
          <div className="manager-ui-empty">
            <Loader label="Loading resident activity graph..." />
          </div>
        ) : (
          <GraphBar
            title="Activity split"
            subtitle="Grouped by activity type in selected date range"
            xKey="name"
            data={activityGraphData}
            bars={[{ key: "count", label: "Records", color: UE_CHART_COLORS.slate }]}
          />
        )}
      </ManagerSection>

      <div className="manager-ui-two-column">
        <ManagerSection
          eyebrow="Activity"
          title="Recent activity"
          description="Latest resident-side actions across payments, issues, and bookings."
        >
          {loading ? (
            <div className="manager-ui-empty">
              <Loader label="Loading activity..." />
            </div>
          ) : recents.length === 0 ? (
            <EmptyState title="No recent activity yet" sub="New updates will appear here." />
          ) : (
            <ManagerRecordGrid className="manager-ui-record-grid--single">
              {recents.slice(0, LIST_LIMIT).map((item, index) => (
                <ManagerRecordCard
                  key={`${item?._id || item?.id || "recent"}-${index}`}
                  title={item?.title || "Activity update"}
                  subtitle={formatTimestamp(item?.date || item?.createdAt)}
                  status={<span className="manager-ui-status-pill">{item?.type || "Update"}</span>}
                />
              ))}
            </ManagerRecordGrid>
          )}
        </ManagerSection>

        <ManagerSection
          eyebrow="Live Desk"
          title="Notifications"
          description="Important updates delivered to your resident account."
        >
          {loading ? (
            <div className="manager-ui-empty">
              <Loader label="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications yet" />
          ) : (
            <ManagerRecordGrid>
              {notifications.slice(0, LIST_LIMIT).map((item, index) => (
                <ManagerRecordCard
                  key={`${item?._id || item?.id || "note"}-${index}`}
                  title={item?.n || item?.title || "Notification"}
                  subtitle={item?.timeAgo || formatTimestamp(item?.createdAt)}
                  status={<span className="manager-ui-status-pill">{item?.belongs || "Notice"}</span>}
                />
              ))}
            </ManagerRecordGrid>
          )}
        </ManagerSection>
      </div>
    </ManagerPageShell>
  );
};


