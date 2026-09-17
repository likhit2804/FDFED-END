import { useRouteError } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const isChunkError =
    error?.message?.includes("dynamically imported module") ||
    error?.message?.includes("Failed to fetch") ||
    error?.name === "TypeError";

  useEffect(() => {
    if (isChunkError) {
      const key = "chunk_error_reload_" + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "true");
        window.location.reload();
      }
    }
  }, [isChunkError]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "var(--surface-0, #fff)",
          padding: "36px 28px",
          borderRadius: "18px",
          border: "1px solid var(--border-subtle, #e2e8f0)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 18px",
            borderRadius: "50%",
            background: "var(--danger-soft, #fee2e2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger-500, #ef4444)",
          }}
        >
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "8px" }}>
          {isChunkError ? "New update available" : "Something went wrong"}
        </h2>
        <p
          style={{
            color: "var(--text-muted, #64748b)",
            fontSize: "0.92rem",
            lineHeight: "1.5",
            marginBottom: "22px",
          }}
        >
          {isChunkError
            ? "A newer version of the application has been deployed. Reloading will fetch the latest updates."
            : (error?.message || "An unexpected error occurred while loading this section.")}
        </p>
        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.reload();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "10px",
            background: "var(--brand-500, #0f766e)",
            color: "#ffffff",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} />
          Reload Application
        </button>
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
