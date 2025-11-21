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

    </div>
  );
}
