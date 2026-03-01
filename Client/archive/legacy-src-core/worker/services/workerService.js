const API_BASE_URL = /* import.meta.env.VITE_API_URL || */ 'http://localhost:3000';

const workerService = {
    // --------- DASHBOARD ---------
    getDashboardData: async () => {
        const response = await fetch(`${API_BASE_URL}/worker/getDashboardData`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        return response.json();
    },

    // --------- HISTORY ---------
    getHistory: async () => {
        const response = await fetch(`${API_BASE_URL}/worker/history`, {
            method: 'GET',
            credentials: 'include',
        });
        return response.json();
    },

    // --------- PROFILE ---------
    getUserData: async () => {
        const response = await fetch(`${API_BASE_URL}/worker/getUserData`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        return response.json();
    },

    updateProfile: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/worker/profile`, {
            method: 'POST',
            credentials: 'include',
            body: formData, // FormData doesn't need Content-Type header manually
        });
        return response.json();
    },

    changePassword: async (passwords) => {
        const response = await fetch(`${API_BASE_URL}/worker/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(passwords),
        });
        return response.json();
    },

    // --------- TASKS ---------
    getTasks: async () => {
        const response = await fetch(`${API_BASE_URL}/worker/api/tasks`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    flagMisassigned: async (id) => {
        const response = await fetch(`${API_BASE_URL}/worker/issue/misassigned/${id}`, {
            method: 'POST',
            credentials: 'include',
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },

    updateTaskStatus: async (taskId, endpoint, payload = null) => {
        const options = {
            method: 'POST',
            credentials: 'include',
        };

        if (payload) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(`${API_BASE_URL}/worker/issue/${endpoint}/${taskId}`, options);
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },
};

export default workerService;
