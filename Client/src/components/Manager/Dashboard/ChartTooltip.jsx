import React from "react";

/**
 * Unified chart tooltip — used by both PieChart (revenue) and LineChart (trends).
 * @param {"pie"|"line"} variant
 * @param {number} [totalAmount] — for pie variant only, to calculate percentage
 */
export const ChartTooltip = ({ variant = "line", totalAmount = 0 }) => {
    const TooltipInner = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;

        if (variant === "pie") {
            const d = payload[0];
            return (
                <div style={{ backgroundColor: "white", padding: "12px 16px", border: `2px solid ${d.payload.color}`, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                    <p style={{ margin: 0, fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>{d.name}</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: d.payload.color }}>₹{(d.value / 1000).toFixed(1)}K</p>
                    {totalAmount > 0 && <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{((d.value / totalAmount) * 100).toFixed(1)}% of total</p>}
                </div>
            );
        }

        // Line variant
        return (
            <div style={{ backgroundColor: "white", padding: "12px 16px", border: "2px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <p style={{ margin: 0, fontWeight: "700", color: "#1f2937", marginBottom: "8px" }}>{label}</p>
                {payload.map((entry, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: entry.color }} />
                        <span style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{entry.name}: <strong style={{ color: entry.color }}>{entry.value}</strong></span>
                    </div>
                ))}
            </div>
        );
    };

    return TooltipInner;
};
