import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ManagerTour } from "./components/Manager/ManagerTour";
import { ResidentTour } from "./components/Resident/ResidentTour";
import { SecurityTour } from "./components/security/SecurityTour";
import { WorkerTour } from "./components/Worker/WorkerTour";
import "./assets/css/Layout.css";

export const Layout = ({ userType }) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  const isUnifiedShellRoute = /^\/(manager|resident|worker|security)\//.test(location.pathname);
  const isManager = userType === "manager" || userType === "CommunityManager";
  const isResident = userType === "Resident" || userType === "resident";
  const isSecurity = userType === "security" || userType === "Security";
  const isWorker = userType === "Worker" || userType === "worker";

  return (
    <>
      <Navbar userType={userType} />
      <div className={`bodyContainer ${isUnifiedShellRoute ? "bodyContainer--shell" : ""}`}>
        <div className={`contentCon ${isUnifiedShellRoute ? "contentCon--shell" : ""}`}>
          <Outlet />
        </div>
      </div>
      {isManager && <ManagerTour />}
      {isResident && <ResidentTour />}
      {isSecurity && <SecurityTour />}
      {isWorker && <WorkerTour />}
    </>
  );
};
