import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables";
import GraphLine from "./GraphLine";
import GraphPie from "./GraphPie";
import Card from "./Card";
import { DollarSign, Grid2x2, Clock, XCircle } from "lucide-react";
import { GraphBar } from "../shared";

export default function Payments() {
  // ===== States =====
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [communityRevenueData, setCommunityRevenueData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusTab, setStatusTab] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [search, setSearch] = useState("");
  const [planType, setPlanType] = useState("All Plans");

  // ===== Constants =====
  const StatusTabs = ["All", "Completed", "Pending", "Failed"];
  const DateRangeTabs = ["All Time", "This Month", "This Year"];
  const planOptions = ["All Plans", "Basic", "Standard", "Premium"];

  // ===== Fetch Payments =====
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get("/admin/api/payments");
        const json = res.data;
        if (json.success) {
          const { payments, statistics, planDistribution, communityRevenue = [] } = json.data;

          setData(
            payments.map((p) => ({
              name: p.communityName,
              transactionId: p.transactionId,
              plan: p.plan,
              amount: `₹${p.amount}`,
              rawAmount: p.amount,
              paymentMethod: p.paymentMethod,
              date: p.paymentDate,
              rawDate: p.paymentDateIso || p.paymentDateRaw || p.paymentDate,
              status: p.status,
            }))
          );

          setStats(statistics);
          setCommunityRevenueData(
            communityRevenue
              .slice(0, 10)
              .map((item) => {
                const name = item.communityName || "Community";
                let shortName = name;
                if (shortName.startsWith("UrbanEase Lite Community ")) {
                  shortName = shortName.replace("UrbanEase Lite Community ", "Lite ");
                } else if (shortName.startsWith("UrbanEase ")) {
                  shortName = shortName.replace("UrbanEase ", "");
                }
                return {
                  x: shortName,
                  fullX: name,
                  revenue: item.revenue,
                  transactions: item.completedTransactions,
                };
              })
          );
          setPlanDistribution(planDistribution);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError(err.response?.data?.message || "Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // ===== Columns =====
  const columns = [
    { header: "Community", accessor: "name" },
    { header: "Transaction ID", accessor: "transactionId" },
    { header: "Plan", accessor: "plan" },
    { header: "Amount", accessor: "amount" },
    { header: "Payment Method", accessor: "paymentMethod" },
    { header: "Date", accessor: "date" },
    { header: "Status", accessor: "status" },
  ];

  // Helper to parse dates from various formats (ISO, DD/MM/YYYY, DD-MM-YYYY)
  const parsePaymentDate = (p) => {
    const dVal = p?.rawDate || p?.date || p;
    if (!dVal || dVal === "N/A") return null;
    if (dVal instanceof Date) return isNaN(dVal.getTime()) ? null : dVal;
    if (typeof dVal === "string") {
      if (dVal.includes("T")) {
        const d = new Date(dVal);
        return isNaN(d.getTime()) ? null : d;
      }
      const parts = dVal.split(/[-/]/).map(Number);
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
      const d = new Date(dVal);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // Helper to check if a date falls in the selected period (This Month, This Year, All Time)
  const isDateInPeriod = (pDate, selectedPeriod) => {
    if (!pDate || selectedPeriod === "All Time" || selectedPeriod === "All") return true;
    const now = new Date();

    switch (selectedPeriod) {
      case "Monthly":
      case "This Month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return pDate >= startOfMonth && pDate <= endOfMonth;
      }

      case "Yearly":
      case "This Year": {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return pDate >= startOfYear && pDate <= endOfYear;
      }

      default:
        return true;
    }
  };

  // ===== Dynamic Data Filtered by Active Date Period =====
  const periodPayments = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (dateRange === "All Time") return data;
    return data.filter((p) => {
      const pDate = parsePaymentDate(p);
      return isDateInPeriod(pDate, dateRange);
    });
  }, [data, dateRange]);

  // ===== Dynamic Stats for Selected Period =====
  const activeStats = useMemo(() => {
    if (dateRange === "All Time") {
      return stats;
    }

    let totalRevenue = 0;
    let totalTransactions = 0;
    let pendingPayments = 0;
    let failedPayments = 0;

    periodPayments.forEach((p) => {
      const status = (p.status || "").toLowerCase();
      const amt = typeof p.rawAmount === "number" ? p.rawAmount : (parseFloat((p.amount || "").toString().replace(/[₹,]/g, "")) || 0);

      if (status === "completed") {
        totalRevenue += amt;
        totalTransactions += 1;
      } else if (status === "pending") {
        pendingPayments += 1;
      } else if (status === "failed") {
        failedPayments += 1;
      }
    });

    return {
      totalRevenue,
      totalTransactions,
      pendingPayments,
      failedPayments,
    };
  }, [periodPayments, dateRange, stats]);

  // ===== Table Filtering Logic =====
  const filteredData = useMemo(() => {
    const normalize = (v) => (v || "").toString().trim().toLowerCase();

    return periodPayments.filter((row) => {
      const rowStatus = normalize(row.status);
      const tabStatus = normalize(statusTab);
      const rowPlan = normalize(row.plan);
      const selPlan = normalize(planType);

      const matchesStatus = tabStatus === "all" || rowStatus === tabStatus;
      const matchesPlan = selPlan === "all plans" || rowPlan === selPlan;

      const q = normalize(search);
      const matchesSearch =
        (row.name || "").toLowerCase().includes(q) ||
        (row.transactionId || "").toLowerCase().includes(q);

      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [statusTab, planType, search, periodPayments]);

  // ===== Filtered Line Chart Data (Revenue Trend) =====
  const filteredGraphData = useMemo(() => {
    const now = new Date();
    const revenueByPeriod = {};
    let expectedLabels = [];

    if (dateRange === "This Month") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const totalWeeks = Math.ceil(daysInMonth / 7);
      for (let i = 1; i <= totalWeeks; i++) {
        const label = `Week ${i}`;
        expectedLabels.push(label);
        revenueByPeriod[label] = 0;
      }

      periodPayments.forEach((payment) => {
        if ((payment.status || "").toLowerCase() !== "completed") return;
        const pDate = parsePaymentDate(payment);
        if (!pDate) return;
        const weekNum = Math.ceil(pDate.getDate() / 7);
        const key = `Week ${weekNum}`;
        const amt = typeof payment.rawAmount === "number" ? payment.rawAmount : (parseFloat((payment.amount || "").toString().replace(/[₹,]/g, "")) || 0);
        if (revenueByPeriod[key] !== undefined) {
          revenueByPeriod[key] += amt;
        }
      });
    } else if (dateRange === "This Year") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      expectedLabels = [...monthNames];
      monthNames.forEach((m) => (revenueByPeriod[m] = 0));

      periodPayments.forEach((payment) => {
        if ((payment.status || "").toLowerCase() !== "completed") return;
        const pDate = parsePaymentDate(payment);
        if (!pDate) return;
        const key = monthNames[pDate.getMonth()];
        const amt = typeof payment.rawAmount === "number" ? payment.rawAmount : (parseFloat((payment.amount || "").toString().replace(/[₹,]/g, "")) || 0);
        if (revenueByPeriod[key] !== undefined) {
          revenueByPeriod[key] += amt;
        }
      });
    } else {
      // All Time
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      expectedLabels = [...monthNames];
      monthNames.forEach((m) => (revenueByPeriod[m] = 0));

      data.forEach((payment) => {
        if ((payment.status || "").toLowerCase() !== "completed") return;
        const pDate = parsePaymentDate(payment);
        if (!pDate) return;
        const key = monthNames[pDate.getMonth()];
        const amt = typeof payment.rawAmount === "number" ? payment.rawAmount : (parseFloat((payment.amount || "").toString().replace(/[₹,]/g, "")) || 0);
        if (revenueByPeriod[key] !== undefined) {
          revenueByPeriod[key] += amt;
        }
      });
    }

    return expectedLabels.map((label) => ({
      x: label,
      y: revenueByPeriod[label] || 0,
    }));
  }, [periodPayments, data, dateRange]);

  // ===== Dynamic Pie Chart (Payment Status Distribution) =====
  const paymentStatusData = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let failed = 0;

    periodPayments.forEach((p) => {
      const st = (p.status || "").toLowerCase();
      if (st === "completed") completed++;
      else if (st === "pending") pending++;
      else if (st === "failed") failed++;
    });

    const total = completed + pending + failed;
    if (total === 0) {
      return [
        { name: "Completed", value: 0 },
        { name: "Pending", value: 0 },
        { name: "Failed", value: 0 },
      ];
    }

    return [
      { name: "Completed", value: Math.round((completed / total) * 100) },
      { name: "Pending", value: Math.round((pending / total) * 100) },
      { name: "Failed", value: Math.round((failed / total) * 100) },
    ];
  }, [periodPayments]);

  // ===== Dynamic Bar Chart (Revenue by Community) =====
  const dynamicCommunityRevenueData = useMemo(() => {
    const commMap = {};

    periodPayments.forEach((payment) => {
      if ((payment.status || "").toLowerCase() !== "completed") return;
      const name = payment.name || "Community";
      const amt = typeof payment.rawAmount === "number" ? payment.rawAmount : (parseFloat((payment.amount || "").toString().replace(/[₹,]/g, "")) || 0);

      if (!commMap[name]) {
        commMap[name] = { revenue: 0, transactions: 0 };
      }
      commMap[name].revenue += amt;
      commMap[name].transactions += 1;
    });

    const list = Object.entries(commMap).map(([name, val]) => {
      let shortName = name;
      if (shortName.startsWith("UrbanEase Lite Community ")) {
        shortName = shortName.replace("UrbanEase Lite Community ", "Lite ");
      } else if (shortName.startsWith("UrbanEase ")) {
        shortName = shortName.replace("UrbanEase ", "");
      }
      return {
        x: shortName,
        fullX: name,
        revenue: val.revenue,
        transactions: val.transactions,
      };
    });

    list.sort((a, b) => b.revenue - a.revenue);

    if (list.length > 0) {
      return list.slice(0, 10);
    }

    return dateRange === "All Time" ? communityRevenueData : [];
  }, [periodPayments, dateRange, communityRevenueData]);

  // ===== Styles =====
  const styles = {
    cardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "14px",
      marginBottom: "20px",
    },
    chartRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
      gap: "16px",
      marginBottom: "20px",
    },
    graphCard: {
      background: "white",
      borderRadius: "14px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      padding: "1.25rem",
      border: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    filterBar: {
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      padding: "12px 16px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
    },
    tableSection: {
      background: "#ffffff",
      border: "1px solid rgba(0,0,0,0.05)",
      borderRadius: "14px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      padding: "1.25rem",
    },
  };

  // ===== Render =====
  return (
    <>
      {/* Header + Unified Date Range Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <Header title="Payment Dashboard" />
        <div style={{ minWidth: "320px", maxWidth: "380px" }}>
          <Tabs
            options={DateRangeTabs}
            active={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div style={styles.cardsRow}>
        <Card
          icon={<DollarSign size={20} />}
          value={`₹${activeStats.totalRevenue.toLocaleString()}`}
          label="Total Revenue"
          borderColor="#22c55e"
        />
        <Card
          icon={<Grid2x2 size={20} />}
          value={activeStats.totalTransactions}
          label="Total Transactions"
          borderColor="#3b82f6"
        />
        <Card
          icon={<Clock size={20} />}
          value={activeStats.pendingPayments}
          label="Pending Payments"
          borderColor="#f59e0b"
        />
        <Card
          icon={<XCircle size={20} />}
          value={activeStats.failedPayments}
          label="Failed Payments"
          borderColor="#ef4444"
        />
      </div>

      {/* ===== Graph Section ===== */}
      <div style={styles.chartRow}>
        <div style={styles.graphCard}>
          <div style={{ marginBottom: "12px" }}>
            <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "15px" }}>
              Revenue Trend
            </h5>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Completed revenue over time ({dateRange})
            </span>
          </div>
          <GraphLine data={filteredGraphData} xKey="x" yKey="y" color="#0f172a" showArea />
        </div>

        <div style={styles.graphCard}>
          <div style={{ marginBottom: "12px" }}>
            <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "15px" }}>
              Payment Status Distribution
            </h5>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Status breakdown ({dateRange})
            </span>
          </div>
          <GraphPie data={paymentStatusData} colors={["#22c55e", "#facc15", "#ef4444"]} />
        </div>

        {/* Occupy full horizontal space */}
        <div style={{ ...styles.graphCard, gridColumn: "1 / -1", width: "100%" }}>
          <GraphBar
            title="Revenue by Community"
            subtitle={`Top communities by completed revenue (${dateRange})`}
            xKey="x"
            data={dynamicCommunityRevenueData}
            bars={[{ key: "revenue", label: "Revenue", color: "#0f766e" }]}
            height={290}
            xAngle={-20}
            xHeight={55}
            xInterval={0}
          />
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div style={styles.filterBar}>
        <div style={{ flex: "1 1 280px", minWidth: "200px" }}>
          <SearchBar
            placeholder="Search by community or transaction ID..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div style={{ flex: "0 0 280px" }}>
          <Tabs options={StatusTabs} active={statusTab} onChange={setStatusTab} />
        </div>
        <div style={{ flex: "0 0 160px", minWidth: "140px" }}>
          <Dropdown options={planOptions} selected={planType} onChange={setPlanType} />
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <div style={styles.tableSection}>
        {loading ? (
          <div className="text-center py-4 text-muted">Loading payments...</div>
        ) : error ? (
          <div className="text-center text-danger py-4">{error}</div>
        ) : (
          <AdminTable columns={columns} data={filteredData} actions={[]} />
        )}
      </div>
    </>
  );
}
