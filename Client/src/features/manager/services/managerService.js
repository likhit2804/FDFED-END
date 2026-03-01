const API_BASE_URL = /* import.meta.env.VITE_API_URL || */ "http://localhost:3000";

const parseResponse = async (response) => {
    let json = {};
    try {
        json = await response.json();
    } catch (_) {
        json = {};
    }
    return { status: response.status, ok: response.ok, ...json };
};

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
        return parseResponse(response);
    },

    updateProfile: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/profile`, {
            method: "POST",
            credentials: "include",
            body: formData, // FormData
        });
        return parseResponse(response);
    },

    changePassword: async (passwords) => {
        const response = await fetch(`${API_BASE_URL}/manager/profile/changePassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(passwords),
        });
        return parseResponse(response);
    },

    // --------- SUBSCRIPTIONS ---------
    getSubscriptionStatus: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-status`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return parseResponse(response);
    },

    getSubscriptionPlans: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-plans`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return parseResponse(response);
    },

    updateSubscriptionPlan: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/manager/subscription-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return parseResponse(response);
    },

    // --------- COMMUNITY ---------
    rotateCommunityCode: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/community/rotate-code`, {
            method: "POST",
            credentials: "include",
        });
        return parseResponse(response);
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
        return parseResponse(response);
    },

    deleteUser: async (endpoint, id) => {
        const response = await fetch(`${API_BASE_URL}/manager/userManagement/${endpoint}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return parseResponse(response);
    },

    // --------- REGISTRATION CODES ---------
    getRegistrationCodes: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/registration-codes`, {
            credentials: "include",
        });
        return parseResponse(response);
    },

    regenerateRegistrationCodes: async (body) => {
        const response = await fetch(`${API_BASE_URL}/manager/registration-codes/regenerate`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return parseResponse(response);
    },

    // --------- PAYMENTS ---------
    getPayments: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/api/payments`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return parseResponse(response);
    },

    // --------- ADVERTISEMENTS ---------
    getAds: async () => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        return parseResponse(response);
    },

    createAd: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        return parseResponse(response);
    },

    updateAd: async (id, formData) => {
        const response = await fetch(`${API_BASE_URL}/manager/api/ad/${id}`, {
            method: "PUT",
            credentials: "include",
            body: formData,
        });
        return parseResponse(response);
    },

    deleteAd: async (id) => {
        const response = await fetch(`${API_BASE_URL}/manager/ad/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return parseResponse(response);
    },
};

export default managerService;
