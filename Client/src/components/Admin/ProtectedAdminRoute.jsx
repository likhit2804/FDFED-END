import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../../slices/authSlice";

export default function ProtectedAdminRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  let activeUser = user;

  if (!activeUser) {
    try {
      const saved = localStorage.getItem("user") || localStorage.getItem("adminSession");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.userType === "admin" || parsed.role === "admin")) {
          activeUser = parsed;
          dispatch(setUser(parsed));
        }
      }
    } catch {
      activeUser = null;
    }
  }

  // If not logged in or not admin -> redirect to login
  if (!activeUser || (activeUser.userType !== "admin" && activeUser.role !== "admin")) {
    return <Navigate to="/adminLogin" replace />;
  }

  return children;
}
