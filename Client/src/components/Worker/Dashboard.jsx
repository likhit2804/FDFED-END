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
  getAverageIssueRating,
  getRecentIssues,
  getStatusSplitData,
  getWorkerTaskSummary,
} from "../shared/nonAdmin/taskInsights";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "../shared/roleUI";

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

  const summary = useMemo(() => getWorkerTaskSummary(issues), [issues]);
  const workerRating = useMemo(() => getAverageIssueRating(issues), [issues]);
  const statusSplitData = useMemo(() => getStatusSplitData(issues), [issues]);
  const recentQueue = useMemo(() => getRecentIssues(issues, 4), [issues]);

  return (
    <>
      <LeaveApplyForm isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} />

      <ManagerPageShell
        eyebrow="Worker Desk"
        title="Track work progress and performance in one unified dashboard."
        description="Monitor assigned tasks, completion pace, and quality metrics using the same manager-style analytics layout."
        chips={[`${summary.total} tasks in scope`, `${summary.efficiency}% efficiency`]}
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
            <StatCard label="Total Tasks" value={summary.total} icon={<ClipboardList size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
            <StatCard label="Assigned" value={summary.assigned} icon={<CircleAlert size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
            <StatCard label="In Progress" value={summary.inProgress} icon={<CircleAlert size={22} />} iconColor="var(--info-600)" iconBg="var(--info-soft)" />
            <StatCard label="Completed" value={summary.completed} icon={<CircleCheck size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
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
                status={<span className="manager-ui-status-pill">{summary.efficiency}%</span>}
                meta={[
                  { label: "Completed", value: summary.completed },
                  { label: "Total tasks", value: summary.total },
                ]}
              />
              <ManagerRecordCard
                title="Quality rating"
                subtitle="Average resident feedback"
                status={<span className="manager-ui-status-pill">{workerRating}/5.0</span>}
                meta={[
                  { label: "Urgent tasks", value: summary.urgent },
                  { label: "In progress", value: summary.inProgress },
                ]}
              />
            </ManagerRecordGrid>
          </ManagerSection>
        </div>
      </ManagerPageShell>
    </>
  );
};


