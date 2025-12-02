import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tasks = [
  { id: 1, title: 'Fix Leaky Faucet', time: '1h 130', status: 'completed', duration: '4 h 8 b. 0' },
  { id: 2, title: 'Install New Outlet', time: '1h 130', status: 'pending', duration: '5 h 9 b. 2 0' },
  { id: 3, title: 'Fix Leaky Faucet', time: '1h 130', status: 'completed', duration: '5 h 4 b. 3 0' },
  { id: 4, title: 'Install New Outlet', time: '20 : > 80', status: 'pending', duration: '5 h 4 b. 2 5' },
  { id: 5, title: 'Fiom Cancecled', time: '20 : > 80', status: 'completed', duration: '5 h 6 b. 3 0' },
  { id: 6, title: 'Axta Ptaitg Womeet', time: '18:00 1pm', status: 'pending', duration: '13 h 8 b. 0 5' },
  { id: 7, title: 'Enstail Now lit', time: '1h 1:00', status: 'pending', duration: '5 h 6 b. 5 0' },
  { id: 8, title: 'Rotded Flat Llonved', time: '18:50 1pm', status: 'completed', duration: '6 h 6 b. 2 5' },
];

const TaskCard = ({ task, onClick, isSelected }) => {
  const statusClasses = {
    completed: 'border-warning-subtle',
    pending: 'border-warning-subtle',
  };

  const StarRating = ({ rating, totalStars = 5 }) => {
    const fullStars = Math.floor(rating);
    const emptyStars = totalStars - fullStars;

    return (
      <div className="d-flex px-1 flex-column align-items-center" style={{ backgroundColor: '#d9d9d971' }}>
        <div>
          {[...Array(fullStars)].map((_, i) => (
            <span key={`full-${i}`} className="text-warning fs-5">&#9733;</span>
          ))}
          {[...Array(emptyStars)].map((_, i) => (
            <span key={`empty-${i}`} className="text-secondary fs-5 opacity-50">&#9733;</span>
          ))}
        </div>
        <span className="ms-2 fw-semibold text-dark fs-6">
          {rating.toFixed(1)}/10
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`
        card border-4 border-start-0 border-end-0 border-top-0 rounded-3 shadow-sm 
        cursor-pointer transition
        ${statusClasses[task.status]}
        ${isSelected ? 'border-primary shadow-lg scale-up' : 'hover-shadow'}
      `}
      style={{ minWidth: '250px', transition: 'all 0.3s ease-in-out' }}
    >
      <div className="card-body p-3 d-flex">
        <div className="d-flex flex-column align-items-center me-3 text-center">
          <StarRating rating={4.8} />
        </div>

        <div>
          <h3 className="fs-6 fw-bold mb-1 text-dark">{task.title}</h3>
          <p className="text-muted small mb-0">"Very was feniratiod!"</p>
          <p className="text-muted small mb-0">"Very prompt service!"</p>
        </div>
      </div>
    </div>
  );
};

const TaskDetails = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="p-4 bg-white rounded-3 shadow-lg h-100 overflow-auto"
      style={{ minWidth: '300px' }}
    >
      <div className="d-flex justify-content-between align-items-start mb-4">
        <h2 className="fs-4 fw-bold text-dark">TASK Details: {task.title}</h2>
        <button onClick={onClose} className="btn-close" aria-label="Close"></button>
      </div>

      <div className="d-grid gap-3 text-secondary">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
          <span className="fw-semibold">Client:</span>
          <span className="fw-medium text-dark">Jane D.</span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
          <span className="fw-semibold">Date:</span>
          <span className="fw-medium text-dark">Oct 26 2023</span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
          <span className="fw-semibold">Duration:</span>
          <span className="fw-medium text-dark">{task.duration}</span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
          <span className="fw-semibold">Rating:</span>
          <span className="fs-5 fw-bold text-danger">5/5</span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="fs-5 fw-bold text-dark mb-3">Client Notes</h3>
        <div className="bg-light p-3 rounded border border-light-subtle" style={{ minHeight: '100px' }}>
          *Client notes will go here for task ID: {task.id}*
        </div>
      </div>
    </motion.div>
  );
};

export const History = () => {
  const [selectedTask, setSelectedTask] = useState(null);

  const handleCardClick = (task) => {
    setSelectedTask(prev => (prev && prev.id === task.id ? null : task));
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const taskGridCols = selectedTask ? 'row-cols-md-2' : 'row-cols-md-3';
  const leftColClasses = selectedTask ? 'col-lg-7 col-md-12' : 'col-12';
  const rightColClasses = selectedTask ? 'col-lg-5 col-md-12' : 'col-0';

  return (
    <div className="container-fluid p-4" style={{ height: '100vh', width: '100%' }}>
      <div className="row w-100 h-100 flex-nowrap">
        <div
          className={`${leftColClasses} d-flex flex-column transition`}
          style={{ transition: 'all 0.5s ease-in-out' }}
        >
          <div className="w-100 d-flex justify-content-center mb-4">
            <input
              type="text"
              placeholder="Search here"
              className="form-control m-0 w-75 form-control-sm"
              style={{ borderRadius: '20px 0 0 20px ' }}
            />
            <button className="btn-primary py-2 px-3" style={{ borderRadius: '0 20px 20px 0' }}>
              <i className="bi bi-search"></i>
            </button>
          </div>

          <div
            className={`row ${taskGridCols} g-3 overflow-auto pe-2 hide-scrollbar flex-grow-1`}
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                className="col"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <TaskCard
                  task={task}
                  onClick={() => handleCardClick(task)}
                  isSelected={selectedTask && selectedTask.id === task.id}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button className="btn btn-lg btn-primary fw-bold rounded-pill shadow-lg">
              EXPORT AS PDF
            </button>
          </div>
        </div>

        <AnimatePresence>
          {selectedTask && (
            <motion.div
              key="task-details"
              className={`${rightColClasses} p-0`}
              style={{ minWidth: selectedTask ? '300px' : '0' }}
            >
              <TaskDetails task={selectedTask} onClose={handleCloseDetails} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx="true">{`
        .transition {
          transition: width 0.5s ease-in-out, margin 0.5s ease-in-out;
        }
        .scale-up {
          transform: scale(1.02);
          transition: transform 0.3s ease-in-out;
        }
        .hover-shadow:hover {
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        .h-100 {
          height: 100% !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        body::-webkit-scrollbar,
        html::-webkit-scrollbar {
          display: none;
        }
        body, html {
          -ms-overflow-style: none; 
          scrollbar-width: none; 
        }
      `}</style>
    </div>
  );
};
