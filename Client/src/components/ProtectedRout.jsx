import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export const ProtectedRoute = ({ allowedUserType }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const [subChecked, setSubChecked] = useState(false);
  const [subActive, setSubActive] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access this page");
    } else if (user.userType !== allowedUserType) {
      toast.warning("Unauthorized access — redirecting to your dashboard");
    }
  }, [user, allowedUserType, location]);

  useEffect(() => {
    const checkSub = async () => {
      if (user && user.userType === "CommunityManager") {
        try {
          const res = await fetch("http://localhost:3000/manager/subscription-status", { credentials: "include" });
          if (!res.ok) {
            setSubActive(false);
          } else {
            const json = await res.json();
            const status = json?.community?.subscriptionStatus;
            const isExpired = json?.community?.isExpired || false;
            setSubActive(status === "active" && !isExpired);
          }
        } catch (e) {
          setSubActive(true);
        } finally {
          setSubChecked(true);
        }
      } else {
        setSubChecked(true);
      }
    };
    checkSub();
  }, [user, location.pathname]);

  // Allow cookie-based auth: only require user object
  if (!user) {
    return <Navigate to="/SignIn" replace />;
  }

  const userTypeNorm = String(user.userType || '').toLowerCase();
  const allowedNorm = String(allowedUserType || '').toLowerCase();
  if (userTypeNorm !== allowedNorm) {
    if (userTypeNorm === "communitymanager")
      return <Navigate to="/manager/dashboard" replace />;
    if (userTypeNorm === "resident")
      return <Navigate to="/resident/dashboard" replace />;
    if (userTypeNorm === "worker")
      return <Navigate to="/worker/dashboard" replace />;
    if (userTypeNorm === "security")
      return <Navigate to="/security/dashboard" replace />;
  }

  if (userTypeNorm === "communitymanager") {
    if (!subChecked) return null; // prevent flicker until checked
    if (!subActive && location.pathname !== "/manager/subscription") {
   
      return <Navigate to="/manager/subscription" replace />;
    }
  }

  return <Outlet />;
};