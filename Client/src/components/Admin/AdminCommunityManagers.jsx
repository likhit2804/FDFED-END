import React, { useState, useEffect } from "react";
import Header from "./Header";
import SearchBar from "./SearchBar";
import AdminTable from "./AdminTables";
import adminApiClient from "../../services/adminApiClient";
import { useTableFilter } from "../../hooks/useAdminHooks";
import { LoadingOverlay } from "../common/Loader";

export default function CommunityManagers() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Contact", accessor: "contact" },
    { header: "Assigned Communities", accessor: "assigned_communities" },
    { header: "Created Date", accessor: "date" },
  ];

  const actions = [];

  // Fetch Community Managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const json = await adminApiClient.getCommunityManagers();

        if (json.success && json.data?.managers) {
          const formatted = json.data.managers.map((m) => ({
            id: m._id,
            name: m.name,
            email: m.email,
            contact: m.contact || "N/A",
            assigned_communities: m.assignedCommunity
              ? m.assignedCommunity.name
              : "Unassigned",
            date: new Date(m.createdAt).toLocaleDateString("en-IN"),
          }));

          setData(formatted);
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

  // Use custom filter hook
  const filteredData = useTableFilter(data, {
    search: search,
    searchFields: ['name', 'email', 'assigned_communities'],
  });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <Header title="Community Managers" />
      </div>

      {/* Filters Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ flex: "1 1 260px", minWidth: "200px" }}>
          <SearchBar
            placeholder="Search community managers..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingOverlay message="Loading managers..." />
      ) : error ? (
        <div className="text-center text-danger py-5">{error}</div>
      ) : (
        <AdminTable columns={columns} data={filteredData} actions={actions} />
      )}
    </>
  );
}
