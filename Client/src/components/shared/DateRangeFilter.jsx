import React from "react";

const containerStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
};

const inputStyle = {
  minWidth: "150px",
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  padding: "0 10px",
  fontSize: "14px",
  background: "#fff",
};

const buttonBase = {
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  padding: "0 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#fff",
};

export default function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  onReset,
  loading = false,
}) {
  return (
    <div style={containerStyle}>
      <input
        type="date"
        value={fromDate || ""}
        onChange={(event) => onFromDateChange?.(event.target.value)}
        max={toDate || undefined}
        style={inputStyle}
        aria-label="From date"
      />
      <input
        type="date"
        value={toDate || ""}
        onChange={(event) => onToDateChange?.(event.target.value)}
        min={fromDate || undefined}
        style={inputStyle}
        aria-label="To date"
      />
      <button
        type="button"
        onClick={onApply}
        disabled={loading}
        style={{
          ...buttonBase,
          background: "#0f172a",
          borderColor: "#0f172a",
          color: "#fff",
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? "Applying..." : "Apply"}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={loading}
        style={buttonBase}
      >
        Reset
      </button>
    </div>
  );
}

