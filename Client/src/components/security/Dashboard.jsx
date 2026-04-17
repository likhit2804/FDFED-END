import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { StatCard } from "../shared";
import { Users, Clock, UserCheck } from "lucide-react";
import { ManagerPageShell, ManagerSection } from "../Manager/ui";

export const SecurityDashboard = () => {
  const [stats, setStats] = useState({ Visitor: 0, Pending: 0, Active: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/security/dashboard/api", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!data.success) return;
        setStats(data.stats || {});
      } catch (err) { console.error("Error loading dashboard: ", err); }
    };
    fetchData();
  }, []);

  return (
    <ManagerPageShell
      eyebrow="Security Desk"
      title="Monitor gate activity in one operational view."
      description="Track visitor flow, pending approvals, and active entries in real time."
    >
      <ManagerSection
        eyebrow="Snapshot"
        title="Visitor dashboard"
        description="Current status of visitors at the community gate."
      >
        <div className="ue-stat-grid">
          <StatCard label="Total Visitors" value={stats.Visitor} icon={<Users size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
          <StatCard label="Pending Approvals" value={stats.Pending} icon={<Clock size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
          <StatCard label="Active Visitors" value={stats.Active} icon={<UserCheck size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
        </div>
      </ManagerSection>
    </ManagerPageShell>
  );
};
