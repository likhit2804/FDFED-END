// src/Services/adminService.js
import axios from "axios";

export const adminLogin = async (email, password) => {
  try {
    const response = await axios.post("/api/AdminLogin", { email, password });
    return response.data;
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: error.response?.data?.message || "Network error" };
  }
};


export const adminVerifyOtp = async (otp, tempToken) => {
  try {
    const response = await axios.post("/api/verify-otp", { otp, tempToken });
    return response.data;
  } catch (error) {
    console.error("Admin OTP verify error:", error);
    return { success: false, message: error.response?.data?.message || "Network error" };
  }
};

export const adminResendOtp = async (tempToken) => {
  try {
    const response = await axios.post("/api/resend-otp", { tempToken });
    return response.data;
  } catch (error) {
    console.error("Admin resend OTP error:", error);
    return { success: false, message: error.response?.data?.message || "Network error" };
  }
};

export const getSystemSettings = async () => {
  try {
    const response = await axios.get("/admin/api/settings", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, message: error.response?.data?.message || "Network error" };
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    const response = await axios.post("/admin/api/settings/update", settings, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating system settings:", error);
    return { success: false, message: error.response?.data?.message || "Network error" };
  }
};
