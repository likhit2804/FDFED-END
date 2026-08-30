import React from "react";
import { Edit, Trash } from "lucide-react";
import Status from "./Status"; // ✅ imported here

export default function AdminTable({ columns, data, actions }) {
  return (
    <div
      style={{
        overflowX: "auto",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        border: "1px solid #e2e8f0",
        fontFamily: "inherit",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#0f172a", color: "white" }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: "10px 14px",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                }}
              >
                {col.header.toUpperCase()}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th
                style={{
                  padding: "10px 14px",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                }}
              >
                ACTIONS
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f8fafc")}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "13px",
                    color: "#334151",
                  }}
                >
                  {col.accessor === "status" ? (
                    <Status status={row[col.accessor]} /> // ✅ new imported component
                  ) : (
                    row[col.accessor]
                  )}
                </td>
              ))}

              {actions && actions.length > 0 && (
                <td
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {actions.map((Action, index) => (
                      <Action.component key={index} row={row} />
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
