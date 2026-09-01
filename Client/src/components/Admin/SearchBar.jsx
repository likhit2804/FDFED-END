import { useRef } from "react";
import { Search } from "lucide-react";
export default function SearchBar({ placeholder, value, onChange }) {
  const containerRef = useRef(null);
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "0 12px",
        height: "38px",
        width: "100%",
        transition: "border-color 0.2s ease",
        outline: "none",
        boxShadow: "none",
      }}
    >
      <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.target.style.outline = "none";
          e.target.style.boxShadow = "none";
          containerRef.current.style.boxShadow = "none";
          containerRef.current.style.outline = "none";
          containerRef.current.style.borderColor = "#0f172a";
        }}
        onBlur={(e) => {
          e.target.style.outline = "none";
          e.target.style.boxShadow = "none";
          containerRef.current.style.boxShadow = "none";
          containerRef.current.style.borderColor = "#e2e8f0";
        }}
        style={{
          border: "none",
          outline: "none",
          boxShadow: "none",
          flex: 1,
          fontSize: "13px",
          color: "#334155",
          fontWeight: 500,
          backgroundColor: "transparent",
          height: "100%",
          lineHeight: "38px",
          marginBottom: 0,
        }}
      />
    </div>
  );
}
