import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Mock data for the task cards
const tasksData = [
  { id: 1, title: 'Leaky Faucet - Apt. 101', flat: 'Flat: 101', assigned: '2023-10-26', priority: 'High', category: 'Plumbing', comment: 'Resident dripping constantly.', status: 'pending', image: 'task-image-1.jpg' },
  { id: 2, title: 'AC Not Faucet - Apt. 101', flat: 'Flat: 101', assigned: '2023-10-26', priority: 'High', category: 'HVAC', comment: 'Resident dripping warm air.', status: 'pending', image: 'task-image-2.jpg' },
  { id: 3, title: 'PENDING', flat: 'Flat: 101', assigned: '2023-10-26', priority: 'High', category: 'HVAC', comment: 'Resident dripping warm air.', status: 'pending', image: null },
  { id: 4, title: 'COMPLETED TODAY', flat: 'Flat: 101', assigned: '2023-10-26', priority: 'Medium', category: 'HVAC', comment: 'Resident Comment: blking zak.', status: 'completed', image: null },
  { id: 5, title: 'AC Not Cooling - Apt. 205', flat: 'Flat: 205', assigned: '2023-10-26', priority: 'High', category: 'HVAC', comment: 'Resident Comment: Unit blowing warm air.', status: 'inProgress', image: null },
  { id: 6, title: 'Lightbulb Replacent - Hallway', flat: 'Flat: 105', assigned: '2023-10-26', priority: 'Low', category: 'Electrical', comment: 'Resident Comment: Unit bhosmjq is.', status: 'inProgress', image: 'task-image-3.jpg' },
  { id: 7, title: 'Lightbulb Replacent - Hallway', flat: 'Flat Common', assigned: '2023-10-26', priority: 'Low', category: 'Electrical', comment: 'Resident Comment: Hallway dark.', status: 'completed', image: 'task-image-4.jpg' },
];

// Helper component for the Task Card
const TaskCard = ({ task, onComplete, onStart }) => {
  const cardStyles = {
    pending: { color: 'text-warning', border: 'border-warning' },
    inProgress: { color: 'text-info', border: 'border-info' },
    completed: { color: 'text-success', border: 'border-success' },
    default: { color: 'text-primary', border: 'border-primary' },
  };

  const statusStyle = cardStyles[task.status] || cardStyles.default;

  const renderActionButton = () => {
    if (task.status === 'completed') {
      return (
        <button className="btn btn-sm btn-outline-secondary">
          Archive
        </button>
      );
    }
    if (task.status === 'inProgress') {
      return (
        <button className="btn btn-sm btn-success" onClick={() => onComplete(task)}>
          Mark Complete
        </button>
      );
    }
    return (
      <button className="btn btn-sm btn-primary" onClick={() => onStart(task)}>
        Start Task
      </button>
    );
  };

  return (
    <div className={`card shadow-sm h-100 ${statusStyle.border}`} style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title fs-6 fw-bold mb-1 text-dark">{task.title}</h5>

        </div>
        <p className="card-text small text-muted mb-1">{task.flat}</p>
        <p className="card-text small text-muted mb-1">Assigned: {task.assigned}</p>
        {task.priority && <p className="card-text small text-danger fw-bold mb-1">Priority: {task.priority}</p>}
        {task.category && <p className="card-text small text-dark mb-1">Category: {task.category}</p>}
        <p className="card-text small text-secondary mb-3">Resident Comment: {task.comment}</p>

        <div className="d-flex justify-content-between">
          <button className="btn btn-sm btn-link p-0 text-decoration-none">
            View Details
          </button>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};



export const Tasks = () => {
  const [activeTab, setActiveTab] = useState('All Tasks');

  const handleStartTask = (task) => {
    // Modal removed: placeholder action for starting a task
    console.log('Start task:', task);
  };

  const handleCompleteTask = (task) => {
    // Modal removed: placeholder action for completing a task
    console.log('Complete task:', task);
  };

  const handleFilter = (task) => {
    if (activeTab === 'All Tasks') return true;
    if (activeTab === 'Pending' && task.status === 'pending') return true;
    if (activeTab === 'In Progress' && task.status === 'inProgress') return true;
    if (activeTab === 'Completed' && task.status === 'completed') return true;
    return false;
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header and Filter Controls */}
      <div className="d-flex align-items-center justify-content-between mb-4">

        <div className="d-flex w-100 align-items-center gap-3">
          <div className="d-flex w-100 justify-content-center">
            <input type="text" className="m-0 w-75" placeholder="Search" style={{ height: '100%', borderRadius: '20px 0 0 20px', borderRight: 'none' }} />
            <button className="btn btn-sm btn-light border" style={{ borderRadius: '0 20px 20px 0', borderLeft: 'none' }}>
              <i className="bi bi-search"></i>
            </button>
          </div>

        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {tasksData.filter(handleFilter).map((task) => (
          <div className="col" key={task.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TaskCard
                task={task}
                onComplete={handleCompleteTask}
                onStart={handleStartTask}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Modal removed */}
    </div>
  );
};