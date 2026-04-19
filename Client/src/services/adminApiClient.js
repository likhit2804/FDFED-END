import axios from "axios";

// Centralized Admin API Client with retry logic and better error handling
class AdminApiClient {
  constructor() {
    this.baseURL =
      process.env.NODE_ENV === "production"
        ? `${window.location.origin}/admin/api`
        : "/admin/api";
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle 401 Unauthorized
  handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/adminLogin";
  }

  // Better error messages based on status code
  getErrorMessage(status, defaultMessage) {
    const errorMap = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Resource already exists or conflict detected.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
    };
    return errorMap[status] || defaultMessage || 'An error occurred';
  }

  // Sleep utility for retry delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if error is retryable
  isRetryableError(status) {
    // Retry on network errors (no status) or server errors (5xx)
    return !status || status >= 500;
  }

  // Generic request method with retry logic
  async request(endpoint, options = {}, retries = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      withCredentials: true,
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await axios({
        url,
        ...config,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        this.handleUnauthorized();
      }

      if (this.isRetryableError(status) && retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries);
        console.warn(`Retrying request to ${endpoint} in ${delay}ms (attempt ${retries + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.request(endpoint, options, retries + 1);
      }

      const errorData = error.response?.data || {};
      const errorMessage =
        errorData.message ||
        this.getErrorMessage(status, error.message || "An error occurred");

      const normalizedError = new Error(errorMessage);
      normalizedError.status = status;
      normalizedError.data = errorData;

      console.error(`API Error [${endpoint}]:`, normalizedError);
      throw normalizedError;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      data: body,
    });
  }

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      data: body,
    });
  }

  // PATCH request
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      data: body,
    });
  }

  // DELETE request
  async delete(endpoint, body = null) {
    const options = { method: "DELETE" };
    if (body) {
      options.data = body;
    }
    return this.request(endpoint, options);
  }

  // Dashboard API
  async getDashboard() {
    return this.get("/dashboard");
  }

  // Communities API
  async getCommunities() {
    return this.get("/communities/overview");
  }

  async getCommunityDetail(communityId) {
    return this.get(`/communities/${communityId}/detail`);
  }

  async getDeletePreview(communityId) {
    return this.get(`/communities/${communityId}/delete-preview`);
  }

  async deleteCommunity(communityId, reason = '') {
    return this.delete(`/communities/${communityId}`, { reason });
  }

  async restoreCommunity(backupId) {
    return this.post(`/communities/${backupId}/restore`);
  }

  // Community Managers API
  async getCommunityManagers() {
    return this.get("/community-managers");
  }

  // Applications API
  async getApplications() {
    return this.get("/interests");
  }

  async approveApplication(id) {
    return this.post(`/interests/${id}/approve`);
  }

  async rejectApplication(id, reason) {
    return this.post(`/interests/${id}/reject`, { reason });
  }

  async resendPaymentLink(id) {
    return this.post(`/interests/${id}/resend-link`);
  }

  // Payments API
  async getPayments() {
    return this.get("/payments");
  }

  // Admin Activity API
  async getAdminActivity(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/admin/activity${query ? `?${query}` : ''}`);
  }

  async getFailedLogins(hours = 24) {
    return this.get(`/admin/security/failed-logins?hours=${hours}`);
  }
}

// Create singleton instance
const adminApiClient = new AdminApiClient();

export default adminApiClient;
