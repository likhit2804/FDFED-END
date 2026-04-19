import { useState, useEffect } from 'react';
import axios from 'axios';

export function useApplicationsData() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/admin/api/interests', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const json = response.data;
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((app) => ({
          id: app._id,
          name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown',
          email: app.email,
          phone: app.phone,
          communityName: app.communityName || 'N/A',
          location: app.location || 'Unknown',
          description: app.description || '',
          appliedOn: new Date(app.createdAt).toLocaleDateString('en-IN'),
          status: app.status?.toUpperCase() || 'PENDING',
          photos: app.photos || [],
          approvedBy: app.approvedBy?.name || null,
          rejectedBy: app.rejectedBy?.name || null,
          rejectionReason: app.rejectionReason || null,
          approvedAt: app.approvedAt
            ? new Date(app.approvedAt).toLocaleDateString('en-IN')
            : null,
          rejectedAt: app.rejectedAt
            ? new Date(app.rejectedAt).toLocaleDateString('en-IN')
            : null,
          paymentStatus: app.paymentStatus || 'pending',
          // Computed status for UI
          uiStatus:
            app.status?.toUpperCase() === 'APPROVED' &&
            (!app.paymentStatus || app.paymentStatus === 'pending')
              ? 'AWAITING PAYMENT'
              : app.paymentStatus === 'completed'
              ? 'COMPLETED'
              : app.status?.toUpperCase() || 'PENDING',
        }));
        setApplications(formatted);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/adminLogin';
        return;
      }
      console.error('Error fetching manager applications:', err);
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      await axios.post(`/admin/interests/${appId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? { ...app, status: 'APPROVED', uiStatus: 'AWAITING PAYMENT', paymentStatus: 'pending' }
            : app
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Approval error:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const handleReject = async (appId, reason) => {
    try {
      await axios.post(`/admin/interests/${appId}/reject`, { reason }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? { ...app, status: 'REJECTED', uiStatus: 'REJECTED', rejectionReason: reason }
            : app
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Rejection error:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    handleApprove,
    handleReject,
  };
}
