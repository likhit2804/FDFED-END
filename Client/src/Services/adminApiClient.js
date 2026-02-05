// Centralized Admin API Client
class AdminApiClient {
  constructor() {
    this.baseURL =
      process.env.NODE_ENV === "production"
        ? `${window.location.origin}/admin/api`
        : "http://localhost:3000/admin/api";
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem("adminToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle 401 Unauthorized
  handleUnauthorized() {
    localStorage.removeItem("adminToken");
    window.location.href = "/adminLogin";
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: "include",
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error("Unauthorized");
      }

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
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
      body: JSON.stringify(body),
    });
  }

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  // PATCH request
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Dashboard API
  async getDashboard() {
    return this.get("/dashboard");
  }

  // Communities API
  async getCommunities() {
    return this.get("/communities/overview");
  }

  async getDeletePreview(communityId) {
    return this.get(`/communities/${communityId}/delete-preview`);
  }

  async deleteCommunity(communityId) {
    return this.delete(`/communities/${communityId}`);
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
}

// Create singleton instance
const adminApiClient = new AdminApiClient();

export default adminApiClient;
