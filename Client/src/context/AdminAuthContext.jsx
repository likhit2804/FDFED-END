// src/context/AdminAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load saved session (if exists)
  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminSession");
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    setLoading(false);
  }, []);

  // ✅ Login and persist session
  const login = (adminData) => {
    localStorage.setItem("adminSession", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  // ✅ Logout and clear session
  const logout = () => {
    localStorage.removeItem("adminSession");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
