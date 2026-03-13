/**
 * Utility functions for Worker Tasks — extracted from Tasks.jsx
 */

export const getPriorityColor = (priority) => {
    switch (priority) {
        case "Urgent": return "#dc3545";
        case "High": return "#fd7e14";
        case "Normal": return "#28a745";
        default: return "#6c757d";
    }
};

export const getStatusColor = (status) => {
    switch (status) {
        case "Assigned": return "#007bff";
        case "In Progress": return "#ffc107";
        case "Resolved (Awaiting Confirmation)": return "#28a745";
        default: return "#6c757d";
    }
};

export const getPriorityIcon = (priority) => {
    switch (priority) {
        case "Urgent": return "";
        case "High": return "";
        case "Normal": return "";
        default: return "";
    }
};

export const getCategoryIcon = (category) => {
    switch (category) {
        case "Plumbing": return "";
        case "Electrical": return "";
        case "Security": return "";
        case "Maintenance": return "";
        case "Pest Control": return "";
        case "Waste Management": return "";
        default: return "";
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
};

export const STATUS_ASSIGNED = "Assigned";
export const STATUS_IN_PROGRESS = "In Progress";
export const STATUS_RESOLVED = "Resolved (Awaiting Confirmation)";
