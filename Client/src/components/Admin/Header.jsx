import React from "react";
import { RefreshCw } from "lucide-react";

export default function Header({ title = "Communities" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: "8px",
        width: "100%",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.5px",
          margin: 0,
          flexShrink: 0,
        }}
      >
        {title}
      </h2>

      <button
        style={{
          backgroundColor: "#0f172a",
          color: "white",
          border: "none",
          borderRadius: "12px",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          transition: "transform 0.2s",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <RefreshCw size={16} /> Refresh
      </button>
    </div>
  );
}
