
export default function Tabs({ options, active, onChange }) {
  return (
    <div
      className="d-flex justify-content-center align-items-center w-100"
      style={{
        gap: "6px",
        background: "#f1f5f9",
        borderRadius: "8px",
        padding: "4px",
        height: "40px",
      }}
    >
      {options.map((option) => {
        const isActive = active === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className="btn"
            style={{
              flex: 1,
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "13px",
              padding: "6px 0",
              height: "32px",
              color: isActive ? "#ffffff" : "#475569",
              backgroundColor: isActive ? "#0f172a" : "transparent",
              boxShadow: isActive
                ? "0 1px 4px rgba(0,0,0,0.12)"
                : "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
