import React, { useEffect, useMemo, useState } from "react";
import { Clock, UserCheck, Users } from "lucide-react";

import { Loader } from "../Loader";
import { GraphBar, GraphPie, StatCard } from "../shared";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";
import { UE_CHART_COLORS } from "../shared/chartPalette";

export const SecurityDashboard = () => {
  const [stats, setStats] = useState({ Visitor: 0, Pending: 0, Active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/security/dashboard/api", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!data.success) return;
        setStats(data.stats || { Visitor: 0, Pending: 0, Active: 0 });
      } catch (error) {
        console.error("Security dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkedOutCount = useMemo(
    () => Math.max((stats?.Visitor || 0) - (stats?.Pending || 0) - (stats?.Active || 0), 0),
    [stats]
  );

  const visitorSplitData = useMemo(
    () => [
      { name: "Active", value: stats?.Active || 0 },
      { name: "Pending", value: stats?.Pending || 0 },
      { name: "Checked Out", value: checkedOutCount },
    ],
    [stats, checkedOutCount]
  );

  const visitorLoadData = useMemo(
    () => [
      { name: "Total", count: stats?.Visitor || 0 },
      { name: "Active", count: stats?.Active || 0 },
      { name: "Pending", count: stats?.Pending || 0 },
    ],
    [stats]
  );

  return (
    <ManagerPageShell
      eyebrow="Security Desk"
      title="Monitor gate activity in one manager-style operational view."
      description="Track visitor flow, pending approvals, and active entries with live dashboard charts."
      chips={[`${stats?.Visitor || 0} visitors tracked`, `${stats?.Pending || 0} pending approvals`]}
    >
      <ManagerSection
        eyebrow="Snapshot"
        title="Visitor dashboard"
        description="Current status of visitors at the community gate."
      >
        <div className="ue-stat-grid">
          <StatCard label="Total Visitors" value={stats?.Visitor || 0} icon={<Users size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
          <StatCard label="Pending Approvals" value={stats?.Pending || 0} icon={<Clock size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
          <StatCard label="Active Visitors" value={stats?.Active || 0} icon={<UserCheck size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
        </div>
      </ManagerSection>

      <ManagerSection
        eyebrow="Insights"
        title="Visitor analytics"
        description="Live distribution and load trends for gate operations."
      >
        {loading ? (
          <div className="manager-ui-empty">
            <Loader label="Preparing visitor charts..." />
          </div>
        ) : (
          <div className="manager-ui-two-column">
            <GraphPie
              title="Visitor state split"
              subtitle="Active, pending, and checked-out records"
              data={visitorSplitData}
              colors={[UE_CHART_COLORS.emerald, UE_CHART_COLORS.plum, UE_CHART_COLORS.slate]}
            />
            <GraphBar
              title="Visitor load"
              subtitle="Current gate volume"
              xKey="name"
              data={visitorLoadData}
              bars={[{ key: "count", label: "Visitors", color: UE_CHART_COLORS.slate }]}
            />
          </div>
        )}
      </ManagerSection>
    </ManagerPageShell>
  );
};


