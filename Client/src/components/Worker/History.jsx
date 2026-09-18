import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Star,
  Award,
  MessageSquare,
  ClipboardList,
  Calendar,
  User,
  MapPin,
  FileText,
  IndianRupee,
} from "lucide-react";
import { Loader } from "../Loader";
import { SearchBar, Dropdown, EmptyState, StatCard, StatusBadge, Modal } from "../shared";
import {
  ManagerPageShell,
  ManagerSection,
  ManagerRecordGrid,
  ManagerRecordCard,
  ManagerActionButton,
} from "../shared/roleUI";
import { getResolvedIssues, HISTORY_SORT_OPTIONS } from "../shared/nonAdmin/taskInsights";

const RATING_FILTER_OPTIONS = [
  { label: "All Ratings", value: "all" },
  { label: "5 Stars (Excellent)", value: "5" },
  { label: "4+ Stars (Good)", value: "4+" },
  { label: "3+ Stars (Average)", value: "3+" },
  { label: "With Feedback Only", value: "feedback" },
];

export const History = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/worker/history");
        const data = res.data;
        if (data.success && Array.isArray(data.issues)) {
          setIssues(data.issues);
        } else {
          console.error("Failed to fetch history:", data.message);
        }
      } catch (err) {
        console.error("Error fetching worker history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter & Sort
  const resolvedIssues = useMemo(() => {
    let list = getResolvedIssues(issues, search, sortBy);

    if (ratingFilter === "5") {
      list = list.filter((t) => Number(t.rating) === 5);
    } else if (ratingFilter === "4+") {
      list = list.filter((t) => Number(t.rating) >= 4);
    } else if (ratingFilter === "3+") {
      list = list.filter((t) => Number(t.rating) >= 3);
    } else if (ratingFilter === "feedback") {
      list = list.filter((t) => t.feedback && String(t.feedback).trim().length > 0);
    }

    return list;
  }, [issues, search, sortBy, ratingFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = issues.length;
    const ratedIssues = issues.filter((i) => typeof i.rating === "number" && i.rating > 0);
    const sumRatings = ratedIssues.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = ratedIssues.length > 0 ? (sumRatings / ratedIssues.length).toFixed(1) : 0;
    const fiveStarCount = issues.filter((i) => Number(i.rating) === 5).length;
    const feedbackCount = issues.filter((i) => i.feedback && String(i.feedback).trim().length > 0).length;

    return {
      total,
      avgRating,
      fiveStarCount,
      feedbackCount,
    };
  }, [issues]);

  const renderStarVisual = (rating, max = 5) => {
    const stars = [];
    const r = Math.round(Number(rating) || 0);
    for (let i = 1; i <= max; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= r ? "text-warning fill-warning" : "text-muted opacity-30"}
          style={{ fill: i <= r ? "#f59e0b" : "none", color: i <= r ? "#f59e0b" : "#94a3b8" }}
        />
      );
    }
    return <span style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>{stars}</span>;
  };

  return (
    <ManagerPageShell
      eyebrow="Worker Desk"
      title="Review resolved task history and resident feedback."
      description="Inspect completed maintenance tickets, check inspection timelines, and review star ratings."
      chips={[`${issues.length} total completed`, `${stats.avgRating} ★ average rating`]}
    >
      {/* 1. Metric Overview Bar (Consistent with other role pages) */}
      <ManagerSection
        eyebrow="Snapshot"
        title="Resolution metrics"
        description="Key performance indicators for completed maintenance tickets."
      >
        <div className="ue-stat-grid">
          <StatCard
            label="Resolved Tasks"
            value={stats.total}
            icon={<CheckCircle2 size={22} />}
            iconColor="var(--success-500)"
            iconBg="var(--success-soft)"
          />
          <StatCard
            label="Average Rating"
            value={stats.avgRating > 0 ? `${stats.avgRating} / 5` : "N/A"}
            icon={<Star size={22} />}
            iconColor="var(--warning-700)"
            iconBg="var(--warning-soft)"
          />
          <StatCard
            label="5-Star Ratings"
            value={stats.fiveStarCount}
            icon={<Award size={22} />}
            iconColor="var(--brand-500)"
            iconBg="var(--info-soft)"
          />
          <StatCard
            label="Resident Reviews"
            value={stats.feedbackCount}
            icon={<MessageSquare size={22} />}
            iconColor="var(--info-600)"
            iconBg="var(--surface-2)"
          />
        </div>
      </ManagerSection>

      {/* 2. Resolved Tasks Workbench */}
      <ManagerSection
        eyebrow="Archive"
        title="Resolved task history"
        description="Search completed tickets, filter by resident feedback, and inspect resolution logs."
      >
        {/* Controls Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <SearchBar
              placeholder="Search by title, resident, or category..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <Dropdown
            options={RATING_FILTER_OPTIONS}
            selected={ratingFilter}
            onChange={setRatingFilter}
            width="170px"
          />
          <Dropdown
            options={HISTORY_SORT_OPTIONS}
            selected={sortBy}
            onChange={setSortBy}
            width="170px"
          />
          <div
            style={{
              display: "flex",
              background: "#f3f4f6",
              borderRadius: 8,
              padding: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 6,
                background: viewMode === "grid" ? "#0b1220" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 6,
                background: viewMode === "list" ? "#0b1220" : "transparent",
                color: viewMode === "list" ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              List
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="manager-ui-empty">
            <Loader label="Loading completed task history..." />
          </div>
        ) : resolvedIssues.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title="No Tasks Found"
            sub={
              issues.length === 0
                ? "You haven't resolved any maintenance tickets yet."
                : "No completed tasks match your selected filters."
            }
          />
        ) : (
          <ManagerRecordGrid>
            {resolvedIssues.map((task) => {
              const residentName =
                task.resident?.residentFirstname
                  ? `${task.resident.residentFirstname} ${task.resident.residentLastname || ""}`.trim()
                  : task.resident?.name || "Resident";

              const resolvedDate = task.resolvedAt || task.updatedAt;
              const formattedDate = resolvedDate
                ? new Date(resolvedDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              const ratingValue = Number(task.rating) || 0;

              return (
                <ManagerRecordCard
                  key={task._id}
                  title={task.title || "Untitled Task"}
                  subtitle={`${task.category || "General"} • ${task.location || "Community"}`}
                  status={<StatusBadge status={task.status || "Resolved"} />}
                  meta={[
                    { label: "Resident", value: residentName },
                    { label: "Resolved On", value: formattedDate },
                    {
                      label: "Rating",
                      value:
                        ratingValue > 0 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontWeight: 700,
                              color: "#b45309",
                              background: "#fef3c7",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                            }}
                          >
                            ★ {ratingValue} / 5
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Not rated</span>
                        ),
                    },
                    {
                      label: "Final Cost",
                      value: task.estimatedCost ? `₹${task.estimatedCost}` : "Free",
                    },
                  ]}
                  actions={
                    <ManagerActionButton
                      variant="secondary"
                      onClick={() => setSelectedTask(task)}
                    >
                      View Details
                    </ManagerActionButton>
                  }
                />
              );
            })}
          </ManagerRecordGrid>
        )}
      </ManagerSection>

      {/* 3. Standard Unified Modal for Task Details */}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title="Completed Task Details"
        size="md"
        footer={
          <button
            type="button"
            className="manager-ui-button manager-ui-button--secondary"
            onClick={() => setSelectedTask(null)}
          >
            Close
          </button>
        }
      >
        {selectedTask && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#0f172a" }}>
            {/* Header info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  {selectedTask.title || "Untitled Task"}
                </h3>
                <StatusBadge status={selectedTask.status || "Resolved"} />
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {selectedTask.category} • Location: {selectedTask.location || "Common Area"}
              </div>
            </div>

            {/* Structured meta table */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <div>
                <span style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: 2 }}>Resident</span>
                <strong>
                  {selectedTask.resident?.residentFirstname
                    ? `${selectedTask.resident.residentFirstname} ${selectedTask.resident.residentLastname || ""}`.trim()
                    : selectedTask.resident?.name || "Resident"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: 2 }}>Completion Date</span>
                <strong>
                  {selectedTask.resolvedAt
                    ? new Date(selectedTask.resolvedAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: 2 }}>Service Charge</span>
                <strong>{selectedTask.estimatedCost ? `₹${selectedTask.estimatedCost}` : "Free Community Service"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: 2 }}>Resident Rating</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {renderStarVisual(selectedTask.rating)}
                  <strong>{selectedTask.rating ? `${selectedTask.rating}/5` : "Unrated"}</strong>
                </div>
              </div>
            </div>

            {/* Resident Feedback Callout */}
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
                Resident Feedback
              </span>
              <div
                style={{
                  marginTop: 6,
                  padding: "12px 14px",
                  background: selectedTask.feedback ? "#f0fdf4" : "#f8fafc",
                  border: `1px solid ${selectedTask.feedback ? "#bbf7d0" : "#e2e8f0"}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: selectedTask.feedback ? "#166534" : "#64748b",
                  fontStyle: selectedTask.feedback ? "normal" : "italic",
                  lineHeight: 1.5,
                }}
              >
                {selectedTask.feedback ? `"${selectedTask.feedback}"` : "No written feedback was provided for this task."}
              </div>
            </div>

            {/* Task Description */}
            {selectedTask.description && (
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
                  Original Issue Description
                </span>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                  {selectedTask.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </ManagerPageShell>
  );
};

export default History;
