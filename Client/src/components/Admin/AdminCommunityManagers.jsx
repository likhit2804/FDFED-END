import React, { useState, useMemo, useEffect } from "react";
import Header from "./Header";
import SearchBar from "./SearchBar";
import AdminTable from "./AdminTables";

export default function CommunityManagers() {
  // ===== States =====
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Columns =====
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Contact", accessor: "contact" },
    { header: "Assigned Communities", accessor: "assigned_communities" },
    { header: "Created Date", accessor: "date" },
  ];

  // ===== Actions =====
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

  // ===== API BASE URL =====
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : "http://localhost:3000/admin/api";

  // ===== Fetch Community Managers =====
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/community-managers`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          window.location.href = "/adminLogin";
          return;
        }

        const json = await res.json();
        if (json.success && json.data?.managers) {
          const formatted = json.data.managers.map((m) => ({
            name: m.name,
            email: m.email,
            contact: m.contact || "N/A",
            assigned_communities: m.assignedCommunity
              ? m.assignedCommunity.name
              : "Unassigned",
            date: new Date(m.createdAt).toLocaleDateString("en-IN"),
          }));

          setData(formatted);
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        console.error("Error fetching community managers:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // ===== Filtering Logic =====
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        row.name?.toLowerCase().includes(search.toLowerCase()) ||
        row.email?.toLowerCase().includes(search.toLowerCase()) ||
        row.assigned_communities
          ?.toLowerCase()
          .includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [search, data]);

  // ===== Render =====
  return (
    <>
      {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Community Managers" />
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
            placeholder="Search community managers..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* ===== Data Table ===== */}
      {loading ? (
        <div className="text-center py-5 text-muted fw-semibold">
          Loading managers...
        </div>
      ) : error ? (
        <div className="text-center text-danger py-5">{error}</div>
      ) : (
        <AdminTable columns={columns} data={filteredData} actions={actions} />
      )}
    </>
  );
}
