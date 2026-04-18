const PRIORITY_ORDER = { Urgent: 3, High: 2, Normal: 1 };

const toTime = (value) => new Date(value || 0).getTime() || 0;

export const getWorkerTaskSummary = (issues = []) => {
  const total = issues.length;
  const assigned = issues.filter((issue) => issue.status === "Assigned").length;
  const inProgress = issues.filter((issue) => issue.status === "In Progress").length;
  const completed = issues.filter(
    (issue) => issue.status === "Resolved" || issue.status === "Payment Pending",
  ).length;
  const urgent = issues.filter((issue) => issue.priority === "Urgent").length;

  return {
    total,
    assigned,
    inProgress,
    completed,
    urgent,
    efficiency: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

export const getAverageIssueRating = (issues = []) => {
  if (!issues.length) return 0;
  const total = issues.reduce((sum, issue) => sum + (Number(issue.rating) || 0), 0);
  return Number((total / issues.length).toFixed(1));
};

export const getStatusSplitData = (issues = []) => {
  const bucket = issues.reduce((accumulator, issue) => {
    const status = issue?.status || "Unknown";
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(bucket).map(([name, value]) => ({ name, value }));
};

export const getRecentIssues = (issues = [], limit = 4) =>
  [...issues]
    .sort((left, right) => toTime(right.updatedAt || right.createdAt) - toTime(left.updatedAt || left.createdAt))
    .slice(0, limit);

export const filterTasks = (
  tasks = [],
  { statusFilter = "All", priorityFilter = "All", searchTerm = "" } = {},
) => {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  return tasks.filter((task) => {
    if (statusFilter !== "All" && task.status !== statusFilter) return false;
    if (priorityFilter !== "All" && task.priority !== priorityFilter) return false;

    if (!normalizedSearch) return true;

    return (
      task.title?.toLowerCase().includes(normalizedSearch) ||
      task.location?.toLowerCase().includes(normalizedSearch) ||
      task.category?.toLowerCase().includes(normalizedSearch)
    );
  });
};

export const sortTasks = (tasks = [], sortBy = "priority") =>
  [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      return (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1);
    }
    if (sortBy === "date") {
      return toTime(b.createdAt) - toTime(a.createdAt);
    }
    if (sortBy === "status") {
      return String(a.status || "").localeCompare(String(b.status || ""));
    }
    return 0;
  });

export const getResolvedIssues = (issues = [], search = "", sortBy = "date_desc") => {
  const normalizedSearch = String(search || "").trim().toLowerCase();

  const filtered = issues.filter((issue) => {
    if (issue.status !== "Resolved") return false;
    if (!normalizedSearch) return true;

    const titleMatch = issue.title?.toLowerCase().includes(normalizedSearch);
    const residentNameMatch = issue.resident?.name?.toLowerCase().includes(normalizedSearch);
    const ratingMatch = issue.rating !== undefined && issue.rating !== null
      ? String(issue.rating).toLowerCase().includes(normalizedSearch)
      : false;

    return titleMatch || residentNameMatch || ratingMatch;
  });

  return filtered.sort((a, b) => {
    const dateA = toTime(a.resolvedAt || a.createdAt);
    const dateB = toTime(b.resolvedAt || b.createdAt);
    const ratingA = typeof a.rating === "number" ? a.rating : -Infinity;
    const ratingB = typeof b.rating === "number" ? b.rating : -Infinity;

    switch (sortBy) {
      case "date_asc":
        return dateA - dateB;
      case "rating_desc":
        return ratingB - ratingA;
      case "rating_asc":
        return ratingA - ratingB;
      case "date_desc":
      default:
        return dateB - dateA;
    }
  });
};

export const TASK_STATUS_FILTER_OPTIONS = [
  { label: "All Status", value: "All" },
  { label: "Assigned", value: "Assigned" },
  { label: "In Progress", value: "In Progress" },
  { label: "Resolved", value: "Resolved (Awaiting Confirmation)" },
];

export const TASK_PRIORITY_FILTER_OPTIONS = [
  { label: "All Priority", value: "All" },
  { label: "Urgent", value: "Urgent" },
  { label: "High", value: "High" },
  { label: "Normal", value: "Normal" },
];

export const TASK_SORT_OPTIONS = [
  { label: "Sort: Priority", value: "priority" },
  { label: "Sort: Date", value: "date" },
  { label: "Sort: Status", value: "status" },
];

export const HISTORY_SORT_OPTIONS = [
  { label: "Newest first", value: "date_desc" },
  { label: "Oldest first", value: "date_asc" },
  { label: "Rating: high to low", value: "rating_desc" },
  { label: "Rating: low to high", value: "rating_asc" },
];
