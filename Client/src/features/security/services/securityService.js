const API_BASE_URL = /* import.meta.env.VITE_API_URL || */ 'http://localhost:3000';

const securityService = {
    // --------- DASHBOARD ---------
    getDashboardData: async () => {
        const response = await fetch(`${API_BASE_URL}/security/dashboard/api`, {
            method: "GET",
            credentials: "include"
        });
        return response.json();
    },

    // --------- PRE-APPROVAL ---------
    verifyQR: async (token) => {
        const response = await fetch(`${API_BASE_URL}/security/verify-qr`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        return response.json();
    },

    getPreApprovals: async () => {
        const response = await fetch(`${API_BASE_URL}/security/preApproval`, {
            method: "GET",
            credentials: "include",
        });
        return response.json();
    },

    updatePreApprovalStatus: async (id, status) => {
        const response = await fetch(`${API_BASE_URL}/security/preApproval/action`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ID: id, status }),
        });
        return response.json();
    },

    // --------- PROFILE ---------
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/security/profile`, {
            method: "GET",
            credentials: "include",
        });
        return response.json();
    },

    updateProfile: async (profileData) => {
        const response = await fetch(`${API_BASE_URL}/security/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(profileData),
        });
        return response.json();
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/security/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return response.json();
    }
};

export default securityService;
