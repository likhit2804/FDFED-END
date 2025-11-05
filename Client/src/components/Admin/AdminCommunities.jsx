import React, { useState, useMemo } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables"; // ✅ corrected (singular, consistent with your new StatusBadge setup)

export default function Communities() {
  // ===== States =====
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");

  // ===== Filters =====
  const tabs = ["All", "Active", "Pending"];
  const locations = ["All Locations", "Bangalore", "Delhi", "Hyderabad"];

  // ===== Table Columns =====
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Location", accessor: "location" },
    { header: "Total Members", accessor: "members" },
    { header: "Created Date", accessor: "date" },
    { header: "Subscription Status", accessor: "status" },
    { header: "Manager", accessor: "manager" },
  ];

  // ===== Table Data =====
  const data = [
    { name: "Nani Network", location: "Vijayawada", members: 0, date: "5/9/2025", status: "ACTIVE", manager: "Unassigned" },
    { name: "Thanvi", location: "Nirmal", members: 0, date: "5/9/2025", status: "ACTIVE", manager: "Srusanth Sadhu" },
    { name: "C23", location: "Markapur", members: 0, date: "12/9/2025", status: "ACTIVE", manager: "Bhanu Sishya" },
    { name: "svSS", location: "ZvDD", members: 0, date: "15/9/2025", status: "PENDING", manager: "Unassigned" },
    { name: "off", location: "On", members: 0, date: "5/10/2025", status: "PENDING", manager: "Unassigned" },
    { name: "Community 1", location: "Bangalore", members: 87, date: "21/8/2025", status: "ACTIVE", manager: "Srusanth Sadhu" },
    { name: "Community 2", location: "Delhi", members: 39, date: "27/9/2025", status: "ACTIVE", manager: "Srusanth Sadhu" },
  ];

  // ===== Filtering Logic =====
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesTab =
        activeTab === "All" || row.status.toUpperCase() === activeTab.toUpperCase();
      const matchesLocation =
        location === "All Locations" ||
        row.location.toLowerCase() === location.toLowerCase();
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.manager.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesLocation && matchesSearch;
    });
  }, [activeTab, location, search]);

  // ===== Table Actions =====
  const actions = [
    {
      component: ({ row }) => (
        <button className="btn btn-sm btn-warning bg-warning-subtle me-2">
          ✏️
        </button>
      ),
    },
    {
      component: ({ row }) => (
        <button className="btn btn-sm btn-danger bg-danger-subtle">
          🗑️
        </button>
      ),
    },
  ];

  // ===== Render =====
  return (
    <>
      {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Communities" />
      </div>

      {/* ===== Filters Row ===== */}
      <div
        className="bg-white rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-4 px-4 py-4"
        style={{
          border: "1px solid #f1f5f9",
          minHeight: "84px",
        }}
      >
        {/* 🟢 Search Bar */}
        <div
          style={{
            flex: "1 1 auto",
            minWidth: "280px",
            marginRight: "16px",
          }}
        >
          <SearchBar
            placeholder="Search communities..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* 🟡 Tabs */}
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            flex: "0 0 auto",
            minWidth: "280px",
            maxWidth: "400px",
            marginRight: "16px",
          }}
        >
          <Tabs options={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* 🔵 Dropdown */}
        <div
          style={{
            flex: "0 0 200px",
            minWidth: "160px",
          }}
        >
          <Dropdown
            options={locations}
            selected={location}
            onChange={setLocation}
          />
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <AdminTable columns={columns} data={filteredData} actions={actions} />
    </>
  );
}
