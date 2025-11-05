import React, { useState, useEffect } from "react";
import Card from "./Card";
import GraphLine from "./GraphLine";
import GraphPie from "./GraphPie";
import { Building2, Users, FileText, Wallet, RefreshCw } from "lucide-react";

export default function DashboardOverview() {
  const [period, setPeriod] = useState("6M");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({
    totalCommunities: 0,
    totalResidents: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
  });
  const [chartData, setChartData] = useState({
    revenueData: [],
    applicationsStatus: { approved: 0, pending: 0, rejected: 0 },
  });

  const API_BASE_URL = `${window.location.origin}/admin/api`;

  // 🧠 Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/dashboard`);
      const json = await res.json();
      if (json.success) {
        const { kpis, chartData } = json.data;

        const revenueData = chartData.growthChart.labels.map((label, i) => ({
          x: label,
          y: chartData.growthChart.revenue[i],
        }));

        setKpis(kpis);
        setChartData({
          revenueData,
          applicationsStatus: chartData.applicationsStatus,
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📈 Fetch chart for selected period
  const fetchChartPeriod = async (selectedPeriod) => {
    try {
      setPeriod(selectedPeriod);
      const res = await fetch(
        `${API_BASE_URL}/dashboard/charts?period=${selectedPeriod}`
      );
      const json = await res.json();
      if (json.success) {
        const { growthChart } = json.data;
        const revenueData = growthChart.labels.map((label, i) => ({
          x: label,
          y: growthChart.revenue[i],
        }));
        setChartData((prev) => ({ ...prev, revenueData }));
      }
    } catch (err) {
      console.error("Chart fetch error:", err);
    }
  };

  // ⏱️ Fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const { totalCommunities, totalResidents, pendingApplications, monthlyRevenue } =
    kpis;
  const { revenueData, applicationsStatus } = chartData;

  const styles = {
    header: {
      marginBottom: "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    refreshBtn: {
      background: "#0f172a",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 500,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    },
    cardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    chartRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "24px",
      alignItems: "stretch",
      width: "100%",
      minHeight: "500px",
    },
    chartCard: {
      flex: "1 1 500px",
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "24px 28px",
      display: "flex",
      flexDirection: "column",
      minHeight: "500px",
    },
    graphContainer: {
      width: "100%",
      height: "280px",
      marginTop: "16px",
    },
  };

  return (
    <>
      {/* ===== Header ===== */}
      <div style={styles.header}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            Dashboard Overview
          </h2>
          <span style={{ color: "#64748b" }}>
            Welcome back, Admin! Here's what's happening across all communities.
          </span>
        </div>
        <button style={styles.refreshBtn} onClick={fetchDashboardData}>
          <RefreshCw size={18} /> {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ===== KPI Cards ===== */}
      <div style={styles.cardsRow}>
        <Card
          icon={<Building2 size={22} />}
          value={totalCommunities}
          label="Total Communities"
          borderColor="#3b82f6"
        />
        <Card
          icon={<Users size={22} />}
          value={totalResidents}
          label="Total Residents"
          borderColor="#16a34a"
        />
        <Card
          icon={<FileText size={22} />}
          value={pendingApplications}
          label="Pending Applications"
          borderColor="#f59e0b"
        />
        <Card
          icon={<Wallet size={22} />}
          value={`₹${monthlyRevenue.toLocaleString()}`}
          label="Monthly Revenue"
          borderColor="#8b5cf6"
        />
      </div>

      {/* ===== Charts ===== */}
      <div style={styles.chartRow}>
        {/* 📈 Revenue Chart */}
        <div style={styles.chartCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h5 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a" }}>
              Portfolio Growth & Revenue
            </h5>
            <div style={{ display: "flex", gap: "8px" }}>
              {["6M", "1Y", "All"].map((p) => (
                <button
                  key={p}
                  style={{
                    background: p === period ? "#0f172a" : "#f1f5f9",
                    color: p === period ? "#fff" : "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 16px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onClick={() => fetchChartPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.graphContainer}>
            <GraphLine data={revenueData} xKey="x" yKey="y" color="#10b981" showArea />
          </div>
        </div>

        {/* 🥧 Applications Overview */}
        <div style={styles.chartCard}>
          <h5 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a" }}>
            Applications Overview
          </h5>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              marginTop: "16px",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "26px", fontWeight: 700 }}>
                {applicationsStatus.pending +
                  applicationsStatus.approved +
                  applicationsStatus.rejected}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>This Month</div>
            </div>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 700 }}>
                {applicationsStatus.pending}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>Pending</div>
            </div>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 700 }}>
                {applicationsStatus.approved}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>Approved</div>
            </div>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 700 }}>
                {applicationsStatus.rejected}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>Rejected</div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: "260px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <GraphPie
              data={[
                { name: "Approved", value: applicationsStatus.approved },
                { name: "Pending", value: applicationsStatus.pending },
                { name: "Rejected", value: applicationsStatus.rejected },
              ]}
              colors={["#22c55e", "#fbbf24", "#ef4444"]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
