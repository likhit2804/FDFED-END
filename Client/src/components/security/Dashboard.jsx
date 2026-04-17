import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { StatCard } from "../shared";
import { Users, Clock, UserCheck } from "lucide-react";

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
    <>
      <div className="contentCon">
        <h4 className="section-title">Dashboard</h4>
        <div className="stats-grid">
          <StatCard title="Total Visitors" value={stats.Visitor} icon={<Users size={22} />} color="#16a34a" />
          <StatCard title="Pending Approvals" value={stats.Pending} icon={<Clock size={22} />} color="#d97706" />
          <StatCard title="Active Visitors" value={stats.Active} icon={<UserCheck size={22} />} color="#2563eb" />
        </div>
      </div>
    </>
  );
};
