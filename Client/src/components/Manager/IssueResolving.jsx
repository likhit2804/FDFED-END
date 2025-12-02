import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/css/Manager/commonSpace.css';
import { ToastContainer, toast } from 'react-toastify';
// Import your issue actions here
// import { fetchIssues, resolveIssue, rejectIssue } from '../../Slices/IssueSlice';

export const IssueResolving = () => {
  const dispatch = useDispatch();
  // Replace with your actual selector
  const { issues = [] } = useSelector((state) => state.issues || {});

  const [isManagementVisible, setIsManagementVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  useEffect(() => {
    // dispatch(fetchIssues());
  }, [dispatch]);

  const handleToggleManagement = () => setIsManagementVisible((prev) => !prev);

  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

  const handleResolve = (issueId) => {
    // dispatch(resolveIssue(issueId));
    toast.success('Issue marked as resolved!');
    setIsIssueModalOpen(false);
  };

  const handleReject = (issueId) => {
    // dispatch(rejectIssue(issueId));
    toast.info('Issue rejected.');
    setIsIssueModalOpen(false);
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />
      <div className="management-section">
        <div className="management-header">
          <h3 style={{ color: 'rgba(0, 0, 0, 0.669)' }}>Manage Reported Issues</h3>
          <button className="toggle-management" onClick={handleToggleManagement}>
            {isManagementVisible ? 'Hide Management' : 'Show Management'}
          </button>
        </div>

        <AnimatePresence>
          {isManagementVisible && (
            <motion.div id="managementContent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="space-list"
                id="issuesList"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <motion.div key={issue._id} className="space-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="space-actions">
                        <button className="view-btn" onClick={() => handleViewIssue(issue)}>
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                      <h4>{issue.title}</h4>
                      <p><strong>Status:</strong> {issue.status}</p>
                      <p><strong>Reported By:</strong> {issue.reportedBy?.name || 'N/A'}</p>
                      <p><strong>Date:</strong> {new Date(issue.date).toLocaleDateString()}</p>
                      <p><strong>Description:</strong> {issue.description?.substring(0, 50)}...</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="bi bi-exclamation-triangle"></i>
                    <h3>No Issues Reported</h3>
                    <p>All clear! No issues to resolve.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isIssueModalOpen && selectedIssue && (
          <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <div className="popup-header">
                <h2><i className="bi bi-exclamation-circle me-2"></i>Issue Details</h2>
                <button className="close-btn" onClick={() => setIsIssueModalOpen(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="popup-body">
                <div className="details-grid">
                  <div className="detail-item"><div className="detail-label">Title</div><div className="detail-value">{selectedIssue.title}</div></div>
                  <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{selectedIssue.status}</div></div>
                  <div className="detail-item"><div className="detail-label">Reported By</div><div className="detail-value">{selectedIssue.reportedBy?.name}</div></div>
                  <div className="detail-item"><div className="detail-label">Date</div><div className="detail-value">{new Date(selectedIssue.date).toLocaleDateString()}</div></div>
                  <div className="detail-item col-span-2"><div className="detail-label">Description</div><div className="detail-value">{selectedIssue.description}</div></div>
                </div>
                <div className="popup-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button className="btn btn-success me-2" onClick={() => handleResolve(selectedIssue._id)}>Mark as Resolved</button>
                  <button className="btn btn-danger" onClick={() => handleReject(selectedIssue._id)}>Reject</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};