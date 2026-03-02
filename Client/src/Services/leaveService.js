import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3000' });
API.defaults.withCredentials = true; // send cookies for auth

export const applyLeave = (payload) => API.post('/leaves', payload);
export const listLeaves = (params) => API.get('/leaves', { params });
export const getLeave = (id) => API.get(`/leaves/${id}`);
export const approveLeave = (id, data) => API.put(`/leaves/${id}/approve`, data);
export const rejectLeave = (id, data) => API.put(`/leaves/${id}/reject`, data);

export default { applyLeave, listLeaves, getLeave, approveLeave, rejectLeave };
