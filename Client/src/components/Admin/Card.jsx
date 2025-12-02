import React from "react";

export default function Card({ icon, value, label, borderColor }) {
  const styles = {
    card: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "20px 28px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      borderTop: `4px solid ${borderColor}`,
      minWidth: "260px",
      flex: "1 1 220px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      color: borderColor,
      fontSize: "24px",
    },
    value: {
      fontWeight: 700,
      fontSize: "28px",
      color: "#0f172a",
      margin: "12px 0 2px",
    },
    label: {
      fontSize: "14px",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
      fontWeight: 500,
    },
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
      }}
    >
      <div style={styles.header}>{icon}</div>
      <div>
        <h3 style={styles.value}>{value}</h3>
        <p style={styles.label}>{label}</p>
      </div>
    </div>
  );
}
