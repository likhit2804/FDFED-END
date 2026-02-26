const API_BASE_URL = /* import.meta.env.VITE_API_URL || */ "http://localhost:3000";

const managerService = {
    // --------- DASHBOARD ---------
    getDashboardData: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/api/dashboard`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        return response;
    },

    // --------- PROFILE ---------
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/profile/api`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.json();
    },

    updateProfile: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/profile`, {
            method: "POST",
            credentials: "include",
            body: formData, // FormData
        });
        return response.json();
    },

    changePassword: async (passwords) => {
        const response = await fetch(`${API_BASE_URL}/manager/profile/changePassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(passwords),
        });
        return response.json();
    },

    // --------- SUBSCRIPTIONS ---------
    getSubscriptionStatus: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-status`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.json();
    },

    getSubscriptionPlans: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-plans`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.json();
    },

    updateSubscriptionPlan: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // --------- COMMUNITY ---------
    rotateCommunityCode: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/community/rotate-code`, {
            method: "POST",
            credentials: "include",
        });
        return response.json();
    },

    // --------- USER MANAGEMENT ---------
    getUserLists: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/userManagement`, {
            credentials: "include",
        });
        return response;
    },

    getUserDetails: async (endpoint, id) => {
        const response = await fetch(`${API_BASE_URL}/manager/userManagement/${endpoint}/${id}`, {
            credentials: "include",
        });
        return response;
    },

    saveUser: async (endpoint, payload) => {
        const response = await fetch(`${API_BASE_URL}/manager/userManagement/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    deleteUser: async (endpoint, id) => {
        const response = await fetch(`${API_BASE_URL}/manager/userManagement/${endpoint}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return response.json();
    },

    // --------- REGISTRATION CODES ---------
    getRegistrationCodes: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/registration-codes`, {
            credentials: "include",
        });
        return response.json();
    },

    regenerateRegistrationCodes: async (body) => {
        const response = await fetch(`${API_BASE_URL}/manager/registration-codes/regenerate`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return response.json();
    },

    // --------- PAYMENTS ---------
    getPayments: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/api/payments`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.json();
    },

    // --------- ADVERTISEMENTS ---------
    getAds: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        return response;
    },

    createAd: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        return response;
    },

    updateAd: async (id, formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad/${id}`, {
            method: "PUT",
            credentials: "include",
            body: formData,
        });
        return response;
    },

    deleteAd: async (id) => {
        const response = await fetch(`${API_BASE_URL}/manager/ad/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return response;
    },
};

export default managerService;
