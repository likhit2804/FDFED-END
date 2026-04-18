/**
 * @license Proprietary
 * @fileoverview Worker Dashboard Component
 * @copyright All rights reserved
 */

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, ClipboardList } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import LeaveApplyForm from "../LeaveApplyForm";
import { Loader } from "../Loader";
import { EmptyState, GraphPie, StatCard } from "../shared";
import { setDashboardData, setIssues } from "../../slices/workerSlice";
import { UE_CHART_PALETTE } from "../shared/chartPalette";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "../Manager/ui";

export const WorkerDashboard = () => {
  const dispatch = useDispatch();
  const issues = useSelector((state) => state?.worker?.Issues) || [];
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/worker/getDashboardData");
        const data = response.data;
        if (!data.success) return;

        dispatch(setDashboardData(data.worker));
        dispatch(setIssues(data.issues || []));
      } catch (error) {
        console.error("Worker dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const tasksCompleted = useMemo(
    () => issues.filter((issue) => issue.status === "Resolved" || issue.status === "Payment Pending").length,
    [issues]
  );

  const inProgressTasks = useMemo(
    () => issues.filter((issue) => issue.status === "In Progress").length,
    [issues]
  );

  const assignedTasks = useMemo(
    () => issues.filter((issue) => issue.status === "Assigned").length,
    [issues]
  );

  const urgentTasks = useMemo(
    () => issues.filter((issue) => issue.priority === "Urgent").length,
    [issues]
  );

  const workerRating = useMemo(() => {
    if (issues.length === 0) return 0;
    const total = issues.reduce((sum, issue) => sum + (issue.rating || 0), 0);
    return Number((total / issues.length).toFixed(1));
  }, [issues]);

  const efficiency = useMemo(() => {
    if (issues.length === 0) return 0;
    return Math.round((tasksCompleted / issues.length) * 100);
  }, [issues, tasksCompleted]);

  const statusSplitData = useMemo(() => {
    const bucket = issues.reduce((accumulator, issue) => {
      const status = issue?.status || "Unknown";
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(bucket).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const recentQueue = useMemo(
    () =>
      [...issues]
        .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
        .slice(0, 4),
    [issues]
  );

  return (
    <>
      <LeaveApplyForm isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} />

      <ManagerPageShell
        eyebrow="Worker Desk"
        title="Track work progress and performance in one unified dashboard."
        description="Monitor assigned tasks, completion pace, and quality metrics using the same manager-style analytics layout."
        chips={[`${issues.length} tasks in scope`, `${efficiency}% efficiency`]}
      >
        <ManagerSection
          eyebrow="Snapshot"
          title="Task dashboard"
          description="Current work summary for the logged-in worker."
          actions={(
            <ManagerActionButton variant="primary" onClick={() => setShowLeaveModal(true)}>
              <i className="bi bi-calendar-check" /> Apply for Leave
            </ManagerActionButton>
          )}
        >
          <div className="ue-stat-grid">
            <StatCard label="Total Tasks" value={issues.length} icon={<ClipboardList size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
            <StatCard label="Assigned" value={assignedTasks} icon={<CircleAlert size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
            <StatCard label="In Progress" value={inProgressTasks} icon={<CircleAlert size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
            <StatCard label="Completed" value={tasksCompleted} icon={<CircleCheck size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
          </div>
        </ManagerSection>

        <ManagerSection
          eyebrow="Insights"
          title="Performance analytics"
          description="Live chart for current task status distribution."
        >
          {loading ? (
            <div className="manager-ui-empty">
              <Loader label="Preparing worker charts..." />
            </div>
          ) : issues.length === 0 ? (
            <EmptyState title="No task data yet" sub="Charts appear once tasks are assigned." />
          ) : (
            <GraphPie
              title="Status split"
              subtitle="Current state of assigned work"
              data={statusSplitData}
              colors={UE_CHART_PALETTE}
            />
          )}
        </ManagerSection>

        <div className="manager-ui-two-column">
          <ManagerSection
            eyebrow="Queue"
            title="Recent task queue"
            description="Most recent tasks on your desk."
          >
            {recentQueue.length === 0 ? (
              <EmptyState title="No task queue available" />
            ) : (
              <ManagerRecordGrid>
                {recentQueue.map((issue) => (
                  <ManagerRecordCard
                    key={issue._id}
                    title={issue.title || "Untitled task"}
                    subtitle={issue.location || issue.category || "Task update"}
                    status={<span className="manager-ui-status-pill">{issue.status || "Unknown"}</span>}
                    meta={[
                      { label: "Priority", value: issue.priority || "Normal" },
                      { label: "Category", value: issue.category || "-" },
                    ]}
                  />
                ))}
              </ManagerRecordGrid>
            )}
          </ManagerSection>

          <ManagerSection
            eyebrow="Score"
            title="Worker performance score"
            description="Summary of output and quality."
          >
            <ManagerRecordGrid>
              <ManagerRecordCard
                title="Efficiency"
                subtitle="Completion percentage"
                status={<span className="manager-ui-status-pill">{efficiency}%</span>}
                meta={[
                  { label: "Completed", value: tasksCompleted },
                  { label: "Total tasks", value: issues.length },
                ]}
              />
              <ManagerRecordCard
                title="Quality rating"
                subtitle="Average resident feedback"
                status={<span className="manager-ui-status-pill">{workerRating}/5.0</span>}
                meta={[
                  { label: "Urgent tasks", value: urgentTasks },
                  { label: "In progress", value: inProgressTasks },
                ]}
              />
            </ManagerRecordGrid>
          </ManagerSection>
        </div>
      </ManagerPageShell>
    </>
  );
};
