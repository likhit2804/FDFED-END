import React, { useEffect, useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import { useSocket } from "../../hooks/useSocket";
import { ClipboardList, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { Loader } from "../Loader";
import { StatCard, SearchBar, Dropdown, EmptyState } from "../shared";
import { ManagerPageShell, ManagerSection } from "../shared/roleUI";
import { STATUS_ASSIGNED, STATUS_IN_PROGRESS, STATUS_RESOLVED } from "./Tasks/taskUtils";
import { TaskCard } from "./Tasks/TaskCard";
import { TaskDetailsModal } from "./Tasks/TaskDetailsModal";
import {
  filterTasks,
  getWorkerTaskSummary,
  sortTasks,
  TASK_PRIORITY_FILTER_OPTIONS,
  TASK_SORT_OPTIONS,
  TASK_STATUS_FILTER_OPTIONS,
} from "../shared/nonAdmin/taskInsights";

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("");
  const socket = useSocket("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Data fetching
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/worker/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) { toast.error(err.message || "Error loading tasks"); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchTasks();
    socket.on("issue:updated", refresh);
    return () => socket.off("issue:updated", refresh);
  }, [socket]);

  // Filter and sort
  const filteredTasks = useMemo(
    () =>
      sortTasks(
        filterTasks(tasks, {
          statusFilter,
          priorityFilter,
          searchTerm,
        }),
        sortBy,
      ),
    [tasks, statusFilter, priorityFilter, searchTerm, sortBy],
  );

  const taskStats = useMemo(() => getWorkerTaskSummary(tasks), [tasks]);

  // Actions
  const openTaskModal = (task) => { setSelectedTask(task); setEstimatedCost(task?.estimatedCost ?? ""); setIsDetailModalOpen(true); };
  const closeTaskModal = () => { setIsDetailModalOpen(false); setSelectedTask(null); setEstimatedCost(""); };

  const updateTaskStatus = async (taskId, newStatus, costValue = estimatedCost) => {
    setActionLoading(true);
    try {
      const endpoint = newStatus === STATUS_IN_PROGRESS ? "start" : "resolve";
      const payload = newStatus === STATUS_RESOLVED ? { estimatedCost: Number(costValue) } : null;
      if (payload && (!Number.isFinite(payload.estimatedCost) || payload.estimatedCost <= 0)) {
        setActionLoading(false); toast.error("Enter a positive estimated cost before completing."); return;
      }
      const res = await fetch(`/worker/issue/${endpoint}/${taskId}`, {
        method: "POST", credentials: "include",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Task ${newStatus === STATUS_IN_PROGRESS ? "Started" : "Completed"}`);
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus, estimatedCost: payload?.estimatedCost ?? t.estimatedCost } : t));
    } catch (err) { toast.error(err.message || "Failed to update task"); }
    setActionLoading(false);
  };

  const handleMisassigned = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/worker/issue/misassigned/${id}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Flagged as misassigned");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) { toast.error(err.message || "Failed to flag as misassigned"); }
    setActionLoading(false);
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />
      <ManagerPageShell
        eyebrow="Worker Desk"
        title="Execute assigned tasks with clean status control."
        description="Filter tasks, update status quickly, and keep progress visible from one task workbench."
      >
        <ManagerSection
          eyebrow="Queue"
          title="My assigned tasks"
          description="Manage and complete assigned maintenance tasks."
          className="worker-tasks-section"
        >
          <div className="ue-stat-grid" style={{ marginBottom: 14 }}>
            <StatCard label="Total Tasks" value={taskStats.total} icon={<ClipboardList size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
            <StatCard label="Assigned" value={taskStats.assigned} icon={<Play size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
            <StatCard label="In Progress" value={taskStats.inProgress} icon={<CheckCircle size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
            <StatCard label="Urgent" value={taskStats.urgent} icon={<AlertTriangle size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBar placeholder="Search tasks by title, location, or category..." value={searchTerm} onChange={setSearchTerm} />
            </div>
            <Dropdown options={TASK_STATUS_FILTER_OPTIONS} selected={statusFilter} onChange={setStatusFilter} width="160px" />
            <Dropdown options={TASK_PRIORITY_FILTER_OPTIONS} selected={priorityFilter} onChange={setPriorityFilter} width="150px" />
            <Dropdown options={TASK_SORT_OPTIONS} selected={sortBy} onChange={setSortBy} width="150px" />
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 2 }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "6px 12px", border: "none", borderRadius: 6, background: viewMode === "grid" ? "#0b1220" : "transparent", color: viewMode === "grid" ? "#fff" : "#374151", cursor: "pointer" }}>Grid</button>
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 12px", border: "none", borderRadius: 6, background: viewMode === "list" ? "#0b1220" : "transparent", color: viewMode === "list" ? "#fff" : "#374151", cursor: "pointer" }}>List</button>
            </div>
          </div>

          {loading ? (
            <div className="manager-ui-empty"><Loader label="Loading your tasks..." /></div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState icon={<ClipboardList size={48} />} title="No Tasks Found" sub={tasks.length === 0 ? "You don't have any assigned tasks yet." : "No tasks match your current filters."} />
          ) : (
            <div className={viewMode === "grid" ? "tasks-grid" : "tasks-list"}>
              <AnimatePresence>
                {filteredTasks.map((task, index) => (
                  <TaskCard key={task._id} task={task} index={index} viewMode={viewMode} onOpenModal={openTaskModal} onUpdateStatus={updateTaskStatus} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ManagerSection>

        <TaskDetailsModal task={selectedTask} isOpen={isDetailModalOpen} onClose={closeTaskModal} estimatedCost={estimatedCost} setEstimatedCost={setEstimatedCost} actionLoading={actionLoading} onUpdateStatus={updateTaskStatus} onMisassigned={handleMisassigned} />
      </ManagerPageShell>
    </>
  );
};


