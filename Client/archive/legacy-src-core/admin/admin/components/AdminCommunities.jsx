import React, { useState, useEffect } from "react";
import { Trash2, Eye, UserCog } from "lucide-react";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables";
import DeleteCommunityModal from "./DeleteCommunityModal";
import CommunityDetailModal from "./CommunityDetailModal";
import ManagerDetailModal from "./ManagerDetailModal";
import adminApiClient from "../../../features/admin/services/adminApiClient";
import { useTableFilter } from "../../../features/admin/hooks/useAdminHooks";
import { LoadingOverlay } from "../../common/components/Loader";

export default function Communities() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [locations, setLocations] = useState(["All Locations"]);
  const [data, setData] = useState([]);
  const [rawCommunities, setRawCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [deletionCounts, setDeletionCounts] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Community detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState("");

  // Manager detail modal state
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedManagerCommunity, setSelectedManagerCommunity] = useState("");

  const tabs = ["All", "Active", "Pending", "Expired"];

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Location", accessor: "location" },
    { header: "Total Members", accessor: "members" },
    { header: "Created Date", accessor: "date" },
    { header: "Subscription Status", accessor: "status" },
    { header: "Manager", accessor: "manager" },
  ];

  // Fetch Communities Data
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        setError("");

        const json = await adminApiClient.getCommunities();

        if (json.success && json.data?.allCommunities) {
          // Store raw data for manager lookup
          setRawCommunities(json.data.allCommunities);

          const formatted = json.data.allCommunities.map((c) => ({
            id: c._id,
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
          setError("No communities data received");
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // Use custom filter hook
  const filteredData = useTableFilter(data, {
    tab: activeTab,
    search: search,
    searchFields: ['name', 'manager'],
    custom: location !== "All Locations" ? { location: location } : {},
  });

  // Handle delete click
  const handleDeleteClick = async (community) => {
    try {
      setLoading(true);
      const preview = await adminApiClient.getDeletePreview(community.id);
      if (preview.success) {
        setCommunityToDelete({
          id: community.id,
          name: community.name,
          location: community.location,
        });
        setDeletionCounts(preview.willDelete);
        setDeleteModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching delete preview:', err);
      alert('Failed to load deletion preview');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const result = await adminApiClient.deleteCommunity(communityToDelete.id);

      if (result.success) {
        // Remove from local state
        setData(prev => prev.filter(c => c.id !== communityToDelete.id));

        // Show success message
        alert(`Community deleted successfully!\n\nDeleted:\n${Object.entries(result.deleted)
          .map(([key, count]) => `${key}: ${count}`)
          .join('\n')}`);

        // Close modal
        setDeleteModalOpen(false);
        setCommunityToDelete(null);
        setDeletionCounts({});
      }
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Failed to delete community: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle view community details
  const handleViewDetails = (community) => {
    setSelectedCommunityId(community.id);
    setSelectedCommunityName(community.name);
    setDetailModalOpen(true);
  };

  // Handle view manager details
  const handleViewManager = (community) => {
    // Find the raw community to get manager details
    const raw = rawCommunities.find(c => c._id === community.id);
    const managerData = raw?.communityManager || null;

    setSelectedManager(managerData || community.manager);
    setSelectedManagerCommunity(community.name);
    setManagerModalOpen(true);
  };

  const actions = [
    {
      component: ({ row }) => (
        <button
          onClick={() => handleViewDetails(row)}
          title="View Details"
          style={{
            padding: '6px 8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          <Eye size={14} />
        </button>
      ),
    },
    {
      component: ({ row }) => (
        <button
          onClick={() => handleViewManager(row)}
          title="View Manager"
          style={{
            padding: '6px 8px',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          <UserCog size={14} />
        </button>
      ),
    },
    {
      component: ({ row }) => (
        <button
          onClick={() => handleDeleteClick(row)}
          title="Delete Community"
          style={{
            padding: '6px 8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Communities" />
      </div>

      {/* Filters Row */}
      <div
        className="bg-white rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-4 px-4 py-4"
        style={{
          border: "1px solid #f1f5f9",
          minHeight: "84px",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "280px", marginRight: "16px" }}>
          <SearchBar
            placeholder="Search communities..."
            value={search}
            onChange={setSearch}
          />
        </div>

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

        <div style={{ flex: "0 0 200px", minWidth: "160px" }}>
          <Dropdown
            options={locations}
            selected={location}
            onChange={setLocation}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingOverlay message="Loading communities..." />
      ) : error ? (
        <div className="text-center text-danger py-5">{error}</div>
      ) : (
        <AdminTable columns={columns} data={filteredData} actions={actions} />
      )}

      {/* Delete Confirmation Modal */}
      {communityToDelete && (
        <DeleteCommunityModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCommunityToDelete(null);
            setDeletionCounts({});
          }}
          community={communityToDelete}
          deletionCounts={deletionCounts}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {/* Community Detail Modal */}
      <CommunityDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCommunityId(null);
          setSelectedCommunityName("");
        }}
        communityId={selectedCommunityId}
        communityName={selectedCommunityName}
      />

      {/* Manager Detail Modal */}
      <ManagerDetailModal
        isOpen={managerModalOpen}
        onClose={() => {
          setManagerModalOpen(false);
          setSelectedManager(null);
          setSelectedManagerCommunity("");
        }}
        manager={selectedManager}
        communityName={selectedManagerCommunity}
      />
    </>
  );
}
