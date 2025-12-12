import React, { useState, useMemo, useEffect } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables";

export default function Communities() {
  // ===== States =====
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [locations, setLocations] = useState(["All Locations"]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Tabs =====
  const tabs = ["All", "Active", "Pending"];

  // ===== Columns =====
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Location", accessor: "location" },
    { header: "Total Members", accessor: "members" },
    { header: "Created Date", accessor: "date" },
    { header: "Subscription Status", accessor: "status" },
    { header: "Manager", accessor: "manager" },
  ];

  // ===== API BASE URL =====
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : `${import.meta.env.VITE_API_URL}/admin/api`;

  // ===== Fetch Communities Data =====
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/communities/overview`, {
          method: "GET",
          credentials: "include", // allows cookie-based auth
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`, // for JWT header
          },
        });

        const json = await res.json();

        if (json.success && json.data?.allCommunities) {
          const formatted = json.data.allCommunities.map((c) => ({
            name: c.name,
            location: c.location,
            members: c.totalMembers || 0,
            date: new Date(c.createdAt).toLocaleDateString("en-IN"),
            status: c.subscriptionStatus?.toUpperCase() || "PENDING",
            manager: c.communityManager ? c.communityManager.name : "Unassigned",
          }));

          setData(formatted);
          setLocations([
            "All Locations",
            ...new Set(formatted.map((c) => c.location)),
          ]);
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // ===== Filtering Logic =====
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesTab =
        activeTab === "All" || row.status === activeTab.toUpperCase();
      const matchesLocation =
        location === "All Locations" ||
        row.location?.toLowerCase() === location.toLowerCase();
      const matchesSearch =
        row.name?.toLowerCase().includes(search.toLowerCase()) ||
        row.manager?.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesLocation && matchesSearch;
    });
  }, [activeTab, location, search, data]); // ✅ added `data` here

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
      {loading ? (
        <div className="text-center py-5 text-muted fw-semibold">
          Loading communities...
        </div>
      ) : error ? (
        <div className="text-center text-danger py-5">{error}</div>
      ) : (
        <AdminTable columns={columns} data={filteredData} actions={actions} />
      )}
    </>
  );
}
