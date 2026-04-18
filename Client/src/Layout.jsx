import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import "./assets/css/Layout.css";

export const Layout = ({ userType }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const isUnifiedShellRoute = /^\/(manager|resident|worker|security)\//.test(location.pathname);

  return (
    <>
      <Navbar userType={userType} />

      <div className={`bodyContainer ${isUnifiedShellRoute ? "bodyContainer--shell" : ""}`}>

        <div className={`contentCon ${isUnifiedShellRoute ? "contentCon--shell" : ""}`}>
          <Outlet />
        </div>

      </div>
    </>
  );
};
