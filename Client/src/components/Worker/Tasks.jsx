import React, { useEffect, useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSocket } from "../../hooks/useSocket";
import { ClipboardList, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { Loader } from "../Loader";
import { StatCard, SearchBar, Dropdown, EmptyState } from "../shared";
import { ManagerPageShell, ManagerSection } from "../Manager/ui";
import { STATUS_ASSIGNED, STATUS_IN_PROGRESS, STATUS_RESOLVED } from "./Tasks/taskUtils";
import { TaskCard } from "./Tasks/TaskCard";
import { TaskDetailsModal } from "./Tasks/TaskDetailsModal";

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
      const res = await axios.get("/worker/api/tasks");
      const data = res.data;
      setTasks(data.tasks || []);
    } catch (err) { toast.error(err.response?.data?.message || err.message || "Error loading tasks"); }
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
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (statusFilter !== "All" && task.status !== statusFilter) return false;
      if (priorityFilter !== "All" && task.priority !== priorityFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return task.title?.toLowerCase().includes(s) || task.location?.toLowerCase().includes(s) || task.category?.toLowerCase().includes(s);
      }
      return true;
    });
    const priorityOrder = { Urgent: 3, High: 2, Normal: 1 };
    filtered.sort((a, b) => {
      if (sortBy === "priority") return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });
    return filtered;
  }, [tasks, statusFilter, priorityFilter, searchTerm, sortBy]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    assigned: tasks.filter((t) => t.status === "Assigned").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    urgent: tasks.filter((t) => t.priority === "Urgent").length,
  }), [tasks]);

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
      const res = await axios.post(`/worker/issue/${endpoint}/${taskId}`, payload || undefined);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      toast.success(`Task ${newStatus === STATUS_IN_PROGRESS ? "Started" : "Completed"}`);
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus, estimatedCost: payload?.estimatedCost ?? t.estimatedCost } : t));
    } catch (err) { toast.error(err.response?.data?.message || err.message || "Failed to update task"); }
    setActionLoading(false);
  };

  const handleMisassigned = async (id) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/worker/issue/misassigned/${id}`);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      toast.success("Flagged as misassigned");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || err.message || "Failed to flag as misassigned"); }
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
            <StatCard label="Total Tasks" value={taskStats.total} icon={<ClipboardList size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
            <StatCard label="Assigned" value={taskStats.assigned} icon={<Play size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
            <StatCard label="In Progress" value={taskStats.inProgress} icon={<CheckCircle size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
            <StatCard label="Urgent" value={taskStats.urgent} icon={<AlertTriangle size={22} />} iconColor="#dc2626" iconBg="#fee2e2" />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBar placeholder="Search tasks by title, location, or category..." value={searchTerm} onChange={setSearchTerm} />
            </div>
            <Dropdown options={[{ label: "All Status", value: "All" }, { label: "Assigned", value: "Assigned" }, { label: "In Progress", value: "In Progress" }, { label: "Resolved", value: "Resolved (Awaiting Confirmation)" }]} selected={statusFilter} onChange={setStatusFilter} width="160px" />
            <Dropdown options={[{ label: "All Priority", value: "All" }, { label: "Urgent", value: "Urgent" }, { label: "High", value: "High" }, { label: "Normal", value: "Normal" }]} selected={priorityFilter} onChange={setPriorityFilter} width="150px" />
            <Dropdown options={[{ label: "Sort: Priority", value: "priority" }, { label: "Sort: Date", value: "date" }, { label: "Sort: Status", value: "status" }]} selected={sortBy} onChange={setSortBy} width="150px" />
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
