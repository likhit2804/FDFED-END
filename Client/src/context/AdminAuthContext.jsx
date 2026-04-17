// src/context/AdminAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE = "";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load saved session (if exists)
  useEffect(() => {
    const savedAdmin = localStorage.getItem("user");
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    setLoading(false);
  }, []);

  // ✅ Login and persist session
  const login = (adminData) => {
    localStorage.setItem("user", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  // ✅ Logout and clear session (also clear server cookie)
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Admin logout error:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setAdmin(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
