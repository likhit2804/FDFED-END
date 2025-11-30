import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export const ProtectedRoute = ({ allowedUserType }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (!token || !user) {
      toast.error("Please login to access this page");
    } else if (user.userType !== allowedUserType) {
      toast.warning("Unauthorized access — redirecting to your dashboard");
    }
  }, [token, user, allowedUserType, location]);

  if (!token || !user) {
    return <Navigate to="/SignIn" replace />;
  }

  if (user.userType !== allowedUserType) {
    if (user.userType === "CommunityManager")
      return <Navigate to="/manager/dashboard" replace />;
    if (user.userType === "Resident")
      return <Navigate to="/resident/dashboard" replace />;
    if (user.userType === "Worker")
      return <Navigate to="/worker/dashboard" replace />;
    if (user.userType === "Security")
      return <Navigate to="/security/dashboard" replace />;
  }

  return <Outlet />;
};