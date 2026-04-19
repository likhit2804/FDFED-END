const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const PRODUCTION_HOST_FALLBACKS = {
  "urbanease-client.onrender.com": "https://urbanease-backend-6gff.onrender.com",
};

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

export function resolveApiBaseUrl() {
  if (typeof window === "undefined") return "";

  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envBase) return envBase;

  const host = String(window.location.hostname || "").toLowerCase();
  if (LOCAL_HOSTS.has(host)) return "http://localhost:3000";

  if (host.includes("urbanease-client")) {
    return PRODUCTION_HOST_FALLBACKS["urbanease-client.onrender.com"];
  }

  return PRODUCTION_HOST_FALLBACKS[host] || "";
}

export function withApiBase(pathname = "") {
  const base = resolveApiBaseUrl();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return base ? `${base}${path}` : path;
}
