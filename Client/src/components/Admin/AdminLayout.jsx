import React from "react";
import SidebarAdmin from "../partials/SidebarAdmin";
import { Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminLayout() {
  const styles = {
    layout: {
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #e0f2fe, #ffffff)",
      fontFamily: "Poppins, sans-serif",
      overflowX: "hidden",
    },
    main: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      marginLeft: "280px",
      transition: "margin-left 0.3s ease-in-out",
      padding: "32px 40px",
    },
    contentWrapper: {
      flexGrow: 1,
      overflowY: "auto",
      paddingBottom: "32px",
      scrollbarWidth: "thin",
      scrollbarColor: "#cbd5e1 transparent", // Firefox
    },
    transparentCard: {
      background: "rgba(255, 255, 255, 0.75)",
      backdropFilter: "blur(10px)",
      borderRadius: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.35)",
      minHeight: "80vh",
      padding: "36px 40px",
      transition: "all 0.3s ease-in-out",
    },
  };

  return (
    <>
      {/* 🌿 Refined, minimal scrollbar */}
      <style>
        {`
          /* Base scrollbar track */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(241, 245, 249, 0.6);
            border-radius: 10px;
          }

          /* Thumb — clean, semi-transparent slate tone */
          ::-webkit-scrollbar-thumb {
            background-color: rgba(100, 116, 139, 0.6); /* slate-500ish */
            border-radius: 10px;
            border: 3px solid rgba(241, 245, 249, 0.6);
            transition: background-color 0.3s ease;
          }

          /* Hover state — darker slate with more opacity */
          ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(71, 85, 105, 0.75);
          }

          /* Corner cleanup */
          ::-webkit-scrollbar-corner {
            background: transparent;
          }

          /* Firefox fallback */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(100,116,139,0.6) rgba(241,245,249,0.6);
          }
        `}
      </style>

      <div style={styles.layout}>
        <SidebarAdmin />
        <div style={styles.main}>
          <main style={styles.contentWrapper}>
            <div style={styles.transparentCard}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
