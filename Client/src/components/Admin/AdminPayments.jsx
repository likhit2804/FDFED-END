import React, { useState, useMemo } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables"; // ✅ corrected import (singular)
import GraphLine from "./GraphLine";
import GraphPie from "./GraphPie";
import Card from "./Card";
import { DollarSign, Grid2x2, Clock, XCircle } from "lucide-react";

export default function Payments() {
  // ===== States =====
  const [statusTab, setStatusTab] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [search, setSearch] = useState("");
  const [planType, setPlanType] = useState("All Plans");
  const [graphRange, setGraphRange] = useState("Monthly");

  // ===== Tabs & Filter Options =====
  const StatusTabs = ["All", "Completed", "Pending", "Failed"];
  const DateRangeTabs = ["All Time", "Today", "This Week", "This Month", "This Year"];
  const planOptions = ["All Plans", "Basic", "Standard", "Premium"];

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

  // ===== Data =====
  const data = [
    {
      name: "Aarav Heights",
      transactionId: "TXN_176083638958",
      plan: "Standard",
      amount: "₹1,999",
      paymentMethod: "debit_card",
      date: "17 Oct 2025",
      status: "Completed",
    },
    {
      name: "GreenView",
      transactionId: "TXN_176083932013",
      plan: "Basic",
      amount: "₹999",
      paymentMethod: "upi",
      date: "12 Oct 2025",
      status: "Pending",
    },
    {
      name: "Skyline Towers",
      transactionId: "TXN_176086239812",
      plan: "Premium",
      amount: "₹2,499",
      paymentMethod: "credit_card",
      date: "05 Oct 2025",
      status: "Failed",
    },
    {
      name: "BlueStone Complex",
      transactionId: "TXN_176086532931",
      plan: "Standard",
      amount: "₹1,999",
      paymentMethod: "upi",
      date: "03 Oct 2025",
      status: "Completed",
    },
  ];

  // ===== Filtering Logic =====
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesStatus = statusTab === "All" || row.status === statusTab;
      const matchesPlan = planType === "All Plans" || row.plan === planType;
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.transactionId.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [statusTab, planType, search, data]);

  // ===== Dynamic Stats =====
  const totalRevenue = useMemo(() => {
    return filteredData
      .filter((d) => d.status === "Completed")
      .reduce((sum, d) => sum + parseInt(d.amount.replace(/[₹,]/g, "")), 0);
  }, [filteredData]);

  const totalTransactions = filteredData.length;
  const pendingPayments = filteredData.filter((d) => d.status === "Pending").length;
  const failedPayments = filteredData.filter((d) => d.status === "Failed").length;

  // ===== Graph Data (changes by graphRange) =====
  const graphData = useMemo(() => {
    if (graphRange === "Weekly")
      return [
        { x: "Mon", y: 2000 },
        { x: "Tue", y: 1500 },
        { x: "Wed", y: 3500 },
        { x: "Thu", y: 1000 },
        { x: "Fri", y: 2500 },
        { x: "Sat", y: 3000 },
        { x: "Sun", y: 1800 },
      ];
    if (graphRange === "Yearly")
      return [
        { x: "Jan", y: 12000 },
        { x: "Feb", y: 15000 },
        { x: "Mar", y: 18000 },
        { x: "Apr", y: 22000 },
        { x: "May", y: 19000 },
        { x: "Jun", y: 24000 },
        { x: "Jul", y: 25000 },
        { x: "Aug", y: 23000 },
        { x: "Sep", y: 26000 },
        { x: "Oct", y: 27000 },
        { x: "Nov", y: 28000 },
        { x: "Dec", y: 29000 },
      ];
    return [
      { x: "Dec", y: 0 },
      { x: "Jan", y: 5000 },
      { x: "Feb", y: 3000 },
      { x: "Mar", y: 7000 },
      { x: "Apr", y: 4000 },
      { x: "May", y: 0 },
      { x: "Jun", y: 0 },
      { x: "Jul", y: 0 },
      { x: "Aug", y: 6000 },
      { x: "Sep", y: 8000 },
      { x: "Oct", y: 25000 },
      { x: "Nov", y: 4000 },
    ];
  }, [graphRange]);

  const paymentStatusData = useMemo(() => {
    const completed = filteredData.filter((d) => d.status === "Completed").length;
    const pending = filteredData.filter((d) => d.status === "Pending").length;
    const failed = filteredData.filter((d) => d.status === "Failed").length;

    const total = completed + pending + failed || 1;
    return [
      { name: "Completed", value: (completed / total) * 100 },
      { name: "Pending", value: (pending / total) * 100 },
      { name: "Failed", value: (failed / total) * 100 },
    ];
  }, [filteredData]);

  // ===== Styles =====
  const styles = {
    cardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "20px",
    },
    chartRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    graphCard: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "1.5rem",
      border: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    graphHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    filterBar: {
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "1rem 1.5rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "1rem",
    },
    tableSection: {
      background: "#ffffff",
      border: "1px solid rgba(0,0,0,0.05)",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "1.5rem",
    },
  };

  // ===== Render =====
  return (
    <>
      {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Payment Dashboard" />
      </div>

      {/* ===== Stats Cards ===== */}
      <div style={styles.cardsRow}>
        <Card
          icon={<DollarSign size={22} />}
          value={`₹${totalRevenue.toLocaleString()}`}
          label="Total Revenue"
          borderColor="#22c55e"
        />
        <Card
          icon={<Grid2x2 size={22} />}
          value={totalTransactions}
          label="Total Transactions"
          borderColor="#3b82f6"
        />
        <Card
          icon={<Clock size={22} />}
          value={pendingPayments}
          label="Pending Payments"
          borderColor="#f59e0b"
        />
        <Card
          icon={<XCircle size={22} />}
          value={failedPayments}
          label="Failed Payments"
          borderColor="#ef4444"
        />
      </div>

      {/* ===== Graph Section ===== */}
      <div style={styles.chartRow}>
        {/* Left Graph with Tabs */}
        <div style={styles.graphCard}>
          <div style={styles.graphHeader}>
            <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Revenue Trend
            </h5>
            <Tabs
              options={["Weekly", "Monthly", "Yearly"]}
              active={graphRange}
              onChange={setGraphRange}
            />
          </div>
          <GraphLine data={graphData} xKey="x" yKey="y" color="#0f172a" showArea />
        </div>

        {/* Right Graph (Pie) */}
        <div style={styles.graphCard}>
          <h5 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>
            Payment Status Distribution
          </h5>
          <GraphPie
            data={paymentStatusData}
            colors={["#22c55e", "#facc15", "#ef4444"]}
          />
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div style={styles.filterBar}>
        <div style={{ flex: "1 1 auto", minWidth: "260px" }}>
          <SearchBar
            placeholder="Search by community or transaction ID..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div style={{ flex: "1 1 auto", minWidth: "400px" }}>
          <Tabs options={DateRangeTabs} active={dateRange} onChange={setDateRange} />
        </div>
        <div style={{ flex: "0 0 300px" }}>
          <Tabs options={StatusTabs} active={statusTab} onChange={setStatusTab} />
        </div>
        <div style={{ flex: "0 0 200px", minWidth: "160px" }}>
          <Dropdown options={planOptions} selected={planType} onChange={setPlanType} />
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <div style={styles.tableSection}>
        <AdminTable columns={columns} data={filteredData} actions={[]} />
      </div>
    </>
  );
}
