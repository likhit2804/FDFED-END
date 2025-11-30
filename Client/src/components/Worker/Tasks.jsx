import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/worker/api/tasks", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        toast.error(err.message || "Error loading tasks");
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  // Start issue
  const handleStart = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/worker/issue/start/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Marked as In Progress");
      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "In Progress" } : t
        )
      );
    } catch (err) {
      toast.error(err.message || "Failed to start");
    }
    setActionLoading(false);
  };

  // Resolve issue
  const handleResolve = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/worker/issue/resolve/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Marked as Resolved (Awaiting Confirmation)");
      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "Resolved (Awaiting Confirmation)" } : t
        )
      );
    } catch (err) {
      toast.error(err.message || "Failed to resolve");
    }
    setActionLoading(false);
  };

  // Flag as misassigned
  const handleMisassigned = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/worker/issue/misassigned/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Flagged as misassigned");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to flag as misassigned");
    }
    setActionLoading(false);
  };

  return (
    <div className="container py-3">
      <ToastContainer position="top-center" />
      <h3 className="mb-4">Assigned Tasks</h3>
      {loading ? (
        <div>Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-muted">No assigned tasks.</div>
      ) : (
        <div className="row g-3">
          {tasks.map((task) => (
            <div key={task._id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{task.title}</h5>
                  <p className="card-text mb-1">
                    <b>Status:</b> {task.status}
                  </p>
                  <p className="card-text mb-1">
                    <b>Location:</b> {task.location}
                  </p>
                  <p className="card-text mb-1">
                    <b>Priority:</b> {task.priority}
                  </p>
                  <p className="card-text mb-1">
                    <b>Resident:</b> {task.resident?.name || "-"}
                  </p>
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    {task.status === "Assigned" && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleStart(task._id)}
                        >
                          Start
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleMisassigned(task._id)}
                        >
                          Wrongly Assigned
                        </button>
                      </>
                    )}
                    {task.status === "In Progress" && (
                      <button
                        className="btn btn-success btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleResolve(task._id)}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};