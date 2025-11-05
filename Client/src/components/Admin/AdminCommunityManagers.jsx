import React, { useState } from "react";
import Header from "./Header";

import SearchBar from "./SearchBar";

import AdminTable from "./AdminTables";

export default function CommunitiesManagers() {

  const [search, setSearch] = useState("");


  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Contact", accessor: "contact" },
    
    { header: "Assigned Communities", accessor: "assigned_communities" },
    { header: "Created Date", accessor: "date" },
 
  ];

const data = [
  {
    name: "Rakesh Sharma",
    email: "rakesh.sharma@urbanease.in",
    contact: "+91 98234 56789",
    assigned_communities: "GreenView Residency",
    date: "2024-10-05",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@urbanease.in",
    contact: "+91 98765 43210",
    assigned_communities: "Lakewood Towers",
    date: "2024-08-22",
  },
  {
    name: "Amit Patel",
    email: "amit.patel@urbanease.in",
    contact: "+91 99321 87654",
    assigned_communities: "Skyline Apartments",
    date: "2024-07-15",
  },
  {
    name: "Neha Verma",
    email: "neha.verma@urbanease.in",
    contact: "+91 97654 32109",
    assigned_communities: "BlueHeaven Villas",
    date: "2024-09-03",
  },
  {
    name: "Rahul Menon",
    email: "rahul.menon@urbanease.in",
    contact: "+91 98567 12345",
    assigned_communities: "Sunrise Enclave",
    date: "2024-11-01",
  },
  {
    name: "Ananya Reddy",
    email: "ananya.reddy@urbanease.in",
    contact: "+91 99876 54321",
    assigned_communities: "Palm Grove Estates",
    date: "2024-10-18",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@urbanease.in",
    contact: "+91 98456 78901",
    assigned_communities: "Maple Leaf Homes",
    date: "2024-06-12",
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer@urbanease.in",
    contact: "+91 99988 77766",
    assigned_communities: "Hillcrest Residency",
    date: "2024-05-09",
  },
];

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

  return (
    <>
     {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{
          zIndex: 100,
        }}
      >
        <Header title="Community Managers" />
      </div>
      {/* ===== Filters Row ===== */}
      <div
        className="bg-white rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-4 px-4 py-4"
        style={{
          border: "1px solid #f1f5f9",
          minHeight: "84px", // ✅ increased overall height
        }}
      >
        {/* 🟢 Search Bar — Longest */}
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
        </div>





      {/* Data Table */}
      <AdminTable columns={columns} data={data} actions={actions} />
    </>
  );
}
