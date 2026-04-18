import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar, Dropdown, EmptyState } from '../shared';
import { ClipboardList } from 'lucide-react';
import { ManagerPageShell, ManagerSection } from '../Manager/ui';


const TaskCard = ({ task, onClick, isSelected }) => {
    const statusClasses = {
        Resolved: 'border-success-subtle',
        'Review Pending': 'border-warning-subtle'
    };

    const StarRating = ({
        rating,
        totalStars = 5
    }) => {
        const fullStars = Math.floor(rating);
        const emptyStars = totalStars - fullStars;

        return (
            <div className="d-flex px-1 flex-column align-items-center"
                style={
                    { backgroundColor: '#d9d9d971' }
                }>
                <div> {
                    [...Array(fullStars)].map((_, i) => (
                        <span key={
                            `full-${i}`
                        }
                            className="text-warning fs-5">&#9733;</span>
                    ))
                }
                    {
                        [...Array(emptyStars)].map((_, i) => (
                            <span key={
                                `empty-${i}`
                            }
                                className="text-secondary fs-5 opacity-50">&#9733;</span>
                        ))
                    } </div>
                <span className="ms-2 fw-semibold text-dark fs-6">
                    {
                        rating.toFixed(1)
                    }/10
                </span>
            </div>
        );
    };

    return (
        <div onClick={onClick}
            className={
                `task-card
        card border-4 border-start-0 border-end-0 border-top-0 rounded-3 shadow-sm 
        cursor-pointer transition
        ${statusClasses[task.status]
                }
        ${isSelected ? 'border-primary shadow-lg scale-up' : 'hover-shadow'
                }
      `
            }
            style={
                {
                    minWidth: '250px',
                    transition: 'all 0.3s ease-in-out'
                }
            }>
            <div className="card-body p-3 d-flex">
                <div className="d-flex flex-column align-items-center me-3 text-center">
                    <StarRating rating={
                        task?.rating
                    } />
                </div>

                <div>
                    <h3 className="fs-6 fw-bold mb-1 text-dark">
                        {
                            task.title
                        }</h3>
                    <p className="text-muted small mb-0">
                        {
                            task.resident?.name || 'Resident'
                        } </p>
                    <p className="text-muted small mb-0">
                        Status: {
                            task.status
                        } </p>
                </div>
            </div>
        </div>
    );
};

const TaskDetails = ({ task, onClose }) => {
    if (!task)
        return null;



    return (
        <motion.div initial={
            {
                x: '100%',
                opacity: 0
            }
        }
            animate={
                {
                    x: 0,
                    opacity: 1
                }
            }
            exit={
                {
                    x: '100%',
                    opacity: 0
                }
            }
            transition={
                {
                    type: 'spring',
                    stiffness: 200,
                    damping: 25
                }
            }
            className="p-4 bg-white rounded-3 shadow-lg h-100 overflow-auto"
            style={
                { minWidth: '300px' }
            }>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <h2 className="fs-4 fw-bold text-dark">TASK Details: {
                    task.title
                }</h2>
                <button onClick={onClose}
                    className="btn-close"
                    aria-label="Close"></button>
            </div>

            <div className="d-grid gap-3 text-secondary">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="fw-semibold">Resident:</span>
                    <span className="fw-medium text-dark">
                        {
                            task.resident?.name || 'N/A'
                        } </span>
                </div>

                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="fw-semibold">Resolved At:</span>
                    <span className="fw-medium text-dark">
                        {
                            task.resolvedAt ? new Date(task.resolvedAt).toLocaleString() : 'N/A'
                        } </span>
                </div>

                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="fw-semibold">Status:</span>
                    <span className="fw-medium text-dark">
                        {
                            task.status
                        }</span>
                </div>

                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="fw-semibold">Rating:</span>
                    <span className="fs-5 fw-bold text-danger">
                        {
                            task.rating ? `${task.rating
                                }/5` : 'N/A'
                        } </span>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="fs-5 fw-bold text-dark mb-3">Client Notes</h3>
                <div className="bg-light p-3 rounded border border-light-subtle"
                    style={
                        { minHeight: '100px' }
                    }>
                    {
                        task.feedback || '*No feedback provided yet*'
                    } </div>
            </div>
        </motion.div>
    );
};

export const History = () => {
    const [issues, setIssues] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, rating_desc, rating_asc

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/worker/history', {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.issues)) {
                    setIssues(data.issues);
                } else {
                    console.error('Failed to fetch history:', data.message);
                }
            } catch (err) {
                console.error('Error fetching worker history:', err);
            }
        };

        fetchHistory();
    }, []);

    const handleCardClick = (task) => {
        setSelectedTask(prev => (prev && prev._id === task._id ? null : task));
    };

    const handleCloseDetails = () => {
        setSelectedTask(null);
    };

    const normalizedSearch = search.trim().toLowerCase();

    const filteredIssues = issues.filter((issue) => {
        if (issue.status !== 'Resolved')
            return false;



        if (!normalizedSearch)
            return true;



        const titleMatch = issue.title && issue.title.toLowerCase().includes(normalizedSearch);
        const residentNameMatch = issue.resident && issue.resident.name && issue.resident.name.toLowerCase().includes(normalizedSearch);
        const ratingMatch = issue.rating !== undefined && issue.rating !== null && issue.rating.toString().toLowerCase().includes(normalizedSearch);

        return titleMatch || residentNameMatch || ratingMatch;
    });

    const resolvedIssues = [...filteredIssues].sort((a, b) => { // Parse dates if present; fallback to createdAt
        const dateA = new Date(a.resolvedAt || a.createdAt || 0);
        const dateB = new Date(b.resolvedAt || b.createdAt || 0);
        const ratingA = typeof a.rating === 'number' ? a.rating : -Infinity;
        const ratingB = typeof b.rating === 'number' ? b.rating : -Infinity;

        switch (sortBy) {
            case 'date_asc':
                return dateA - dateB;
            case 'rating_desc':
                return ratingB - ratingA;
            case 'rating_asc':
                return ratingA - ratingB;
            case 'date_desc':
            default:
                return dateB - dateA;
        }
    });

    const taskGridCols = selectedTask ? 'row-cols-md-2' : 'row-cols-md-3';
    const leftColClasses = selectedTask ? 'col-lg-7 col-md-12' : 'col-12';
    const rightColClasses = selectedTask ? 'col-lg-5 col-md-12' : 'col-0';

    return (
        <ManagerPageShell
            eyebrow="Worker Desk"
            title="Review resolved task history and feedback."
            description="Search completed issues, inspect details, and check resident ratings."
        >
            <ManagerSection
                eyebrow="History"
                title="Resolved tasks"
                description="Browse completed tasks with status timeline and feedback."
            >
            <div className="row w-100 h-100 flex-nowrap">
                <div className={
                    `${leftColClasses} d-flex flex-column transition`
                }
                    style={
                        { transition: 'all 0.5s ease-in-out' }
                    }>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <SearchBar placeholder="Search by title, resident or rating..." value={search} onChange={setSearch} />
                        </div>
                        <Dropdown
                            options={[
                                { label: 'Newest first', value: 'date_desc' },
                                { label: 'Oldest first', value: 'date_asc' },
                                { label: 'Rating: high to low', value: 'rating_desc' },
                                { label: 'Rating: low to high', value: 'rating_asc' },
                            ]}
                            selected={sortBy}
                            onChange={setSortBy}
                            width="180px"
                        />
                    </div>


                    <div className={
                        `row ${taskGridCols} g-3 overflow-auto pe-2 hide-scrollbar flex-grow-1`
                    }
                        style={
                            { maxHeight: 'calc(100vh - 150px)' }
                        }>
                        {
                            resolvedIssues.length === 0 ? (
                                <p></p>
                            ) : (resolvedIssues.map((task) => (
                                <motion.div key={
                                    task._id
                                }
                                    className="col"
                                    initial={
                                        {
                                            opacity: 0,
                                            y: 40
                                        }
                                    }
                                    animate={
                                        {
                                            opacity: 1,
                                            y: 0
                                        }
                                    }
                                    transition={
                                        { duration: 0.8 }
                                    }>
                                    <TaskCard task={task}
                                        onClick={
                                            () => handleCardClick(task)
                                        }
                                        isSelected={
                                            selectedTask && selectedTask._id === task._id
                                        } />
                                </motion.div>
                            )))
                        } </div>

                    {resolvedIssues.length === 0 && (
                        <EmptyState
                            icon={<ClipboardList size={48} />}
                            title="No Issues to Show"
                            sub={issues.length === 0 ? "You haven't resolved any issues yet." : "No resolved issues match your search criteria."}
                        />
                    )}



                </div>

                <AnimatePresence> {
                    selectedTask && (
                        <motion.div key="task-details"
                            className={
                                `${rightColClasses} p-0`
                            }
                            style={
                                {
                                    minWidth: selectedTask ? '300px' : '0'
                                }
                            }>
                            <TaskDetails task={selectedTask}
                                onClose={handleCloseDetails} />
                        </motion.div>
                    )
                } </AnimatePresence>
            </div>
            </ManagerSection>
        </ManagerPageShell>
    );
};

