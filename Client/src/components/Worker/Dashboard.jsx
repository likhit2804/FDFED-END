/**
 * @license Proprietary
 * @fileoverview Worker Dashboard Component
 * @copyright All rights reserved
 */

import '../../assets/css/Worker/Dashboard.css';
import {CircularProgressbar, buildStyles} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {motion} from 'framer-motion';
import {setDashboardData, setIssues} from '../../slices/workerSlice';
import {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import LeaveApplyForm from '../LeaveApplyForm';
import { StatCard } from '../shared';
import { ClipboardList, CircleAlert, CircleCheck } from 'lucide-react';
import { ManagerActionButton, ManagerPageShell, ManagerSection } from '../Manager/ui';

export const WorkerDashboard = () => {
    const dispatch = useDispatch();
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/worker/getDashboardData", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                dispatch(setDashboardData(data.worker));
                dispatch(setIssues(data.issues));
            }
        };

        fetchData();
    }, []);

    const issues = useSelector((state) => state ?. worker ?. Issues);


    // ---------- CALCULATIONS ----------
    const calculateRating = (issues) => {
        if (! issues || issues.length === 0) 
            return 0;
        


        let total = 0;
        issues.forEach((issue) => {
            total += issue.rating || 0;
        });

        return total / issues.length;
    };

    const tasksCompleted = issues ?. filter((issue) => issue.status === "Resolved" || issue.status === "Payment Pending") ?. length || 0;

    const newTasks = issues ?. filter((issue) => issue.status === "Pending") ?. length || 0;

    const totalTasks = issues ?. length || 0;

    const workerRating = calculateRating(issues);

    const efficiency = totalTasks === 0 ? 0 : Math.round((tasksCompleted / totalTasks) * 100);


    return (
        <>
            <LeaveApplyForm isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} />
            <ManagerPageShell
                eyebrow="Worker Desk"
                title="Track work progress and performance in one view."
                description="Monitor assigned tasks, completion pace, and reminders without switching between disconnected cards."
            >
                <ManagerSection
                    eyebrow="Snapshot"
                    title="Task dashboard"
                    description="Current work summary for the logged-in worker."
                    actions={
                        <ManagerActionButton variant="primary" onClick={() => setShowLeaveModal(true)}>
                            <i className="bi bi-calendar-check" /> Apply for Leave
                        </ManagerActionButton>
                    }
                >
                    <div className="ue-stat-grid" style={{ marginBottom: 12 }}>
                        <StatCard label="Total Tasks" value={totalTasks} icon={<ClipboardList size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
                        <StatCard label="New Tasks" value={newTasks} icon={<CircleAlert size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
                        <StatCard label="Completed" value={tasksCompleted} icon={<CircleCheck size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
                    </div>
                </ManagerSection>

                <div className="manager-ui-two-column">
                    <ManagerSection eyebrow="Performance" title="Performance indicators" description="Efficiency, completion ratio, and current worker rating.">
                        <motion.div className="performance-stats d-flex justify-content-around align-items-center py-4 rounded-3 bg-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            <motion.div className="stat-circle" style={{ width: 150 }} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300 }}>
                                <div className="position-relative chart-hover">
                                    <CircularProgressbar
                                        value={efficiency}
                                        text={`${efficiency}%`}
                                        styles={buildStyles({ pathColor: "#007bff", textColor: "#000", trailColor: "#007bff40", textSize: "16px" })}
                                    />
                                    <i className="bi bi-lightning-charge-fill position-absolute bottom-0 end-0 text-primary fs-5" />
                                </div>
                                <div className="text-center mt-2 fw-semibold">Efficiency</div>
                            </motion.div>

                            <motion.div className="stat-circle" style={{ width: 150 }} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300 }}>
                                <div className="position-relative chart-hover">
                                    <CircularProgressbar
                                        value={totalTasks === 0 ? 0 : (tasksCompleted / totalTasks) * 100}
                                        text={`${tasksCompleted}/${totalTasks}`}
                                        styles={buildStyles({ pathColor: "#28a745", textColor: "#000", trailColor: "#28a7465e", textSize: "16px" })}
                                    />
                                    <i className="bi bi-check-circle-fill position-absolute bottom-0 end-0 text-success fs-5" />
                                </div>
                                <div className="text-center mt-2 fw-semibold">Tasks Completed</div>
                            </motion.div>

                            <motion.div className="stat-circle" style={{ width: 150 }} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300 }}>
                                <div className="position-relative chart-hover">
                                    <CircularProgressbar
                                        value={(workerRating / 5) * 100}
                                        text={`${workerRating.toFixed(1)}/5.0`}
                                        styles={buildStyles({ pathColor: "#ff8c00", textColor: "#000", trailColor: "#ff8c0040", textSize: "16px" })}
                                    />
                                    <i className="bi bi-star-fill position-absolute bottom-0 end-0 text-warning fs-5" />
                                </div>
                                <div className="text-center mt-2 fw-semibold">Worker Rating</div>
                            </motion.div>
                        </motion.div>
                    </ManagerSection>

                    <ManagerSection eyebrow="Alerts" title="Notifications" description="Recent reminders and desk notices.">
                        <div className="manager-ui-record-card">
                            <div className="d-flex gap-2 align-items-start">
                                <div className="rounded-circle border px-2 d-flex align-items-center bg-danger">
                                    <i className="bi bi-bell-fill text-white" />
                                </div>
                                <div className="d-flex flex-column">
                                    <strong>Reminder: Complete task</strong>
                                    <small className="text-muted">5 min ago</small>
                                </div>
                            </div>
                        </div>
                    </ManagerSection>
                </div>
            </ManagerPageShell>
        </>
    );
};
