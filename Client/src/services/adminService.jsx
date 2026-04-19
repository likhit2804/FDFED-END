// src/Services/adminService.js
import { resolveApiBaseUrl } from "../utils/apiBaseUrl";

const API_BASE = resolveApiBaseUrl();

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/api/AdminLogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: "Network error" };
  }
};


export const adminVerifyOtp = async (otp, tempToken) => {
  try {
    const response = await fetch(`${API_BASE}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ otp, tempToken }),
    });
    return await response.json();
  } catch (error) {
    console.error("Admin OTP verify error:", error);
    return { success: false, message: "Network error" };
  }
};

export const adminResendOtp = async (tempToken) => {
  try {
    const response = await fetch(`${API_BASE}/api/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tempToken }),
    });
    return await response.json();
  } catch (error) {
    console.error("Admin resend OTP error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getSystemSettings = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin/api/settings`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, message: "Network error" };
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    const response = await fetch(`${API_BASE}/admin/api/settings/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      credentials: "include",
      body: JSON.stringify(settings),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating system settings:", error);
    return { success: false, message: "Network error" };
  }
};
