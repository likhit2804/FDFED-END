import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedAdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth);

  // If not logged in or not admin -> redirect to login
  if (!user || user.userType !== "admin") return <Navigate to="/adminLogin" replace />;

  return children;
}
