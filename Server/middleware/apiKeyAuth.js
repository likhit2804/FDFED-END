const API_KEYS = (process.env.API_KEYS || "ue-demo-api-key-2024")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

export function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "Missing x-api-key header. B2B endpoints require an API key.",
      docs: "/api-docs",
    });
  }

  if (!API_KEYS.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key.",
    });
  }

  req.apiClient = {
    key: apiKey,
    keyHint: apiKey.slice(-4),
  };

  return next();
}

export default apiKeyAuth;
