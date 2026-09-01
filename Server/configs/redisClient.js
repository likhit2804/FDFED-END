import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

// Load .env before Redis initializes — critical because server.js calls
// dotenv.config() AFTER imports are hoisted. This ensures REDIS_URL is
// always available when this module is first evaluated.
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true, quiet: true });

import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_URl ||
  "redis://127.0.0.1:6379";

let redis = null;
let hasLoggedStatus = false;

try {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 2) return null; // Give up after 2 retries — no spam
      return Math.min(times * 500, 2000);
    },
  });

  client.on("ready", () => {
    if (!hasLoggedStatus) {
      hasLoggedStatus = true;
      console.log("✅ Redis connected successfully");
    }
  });

  client.on("error", () => {
    if (!hasLoggedStatus) {
      hasLoggedStatus = true;
      console.warn("⚠️  Redis unavailable — running without cache (memory fallback).");
    }
  });

  redis = client;
} catch (err) {
  if (!hasLoggedStatus) {
    hasLoggedStatus = true;
    console.warn("⚠️  Redis init failed — running without cache:", err?.message || err);
  }
  redis = null;
}

export const isRedisReady = () => Boolean(redis && redis.status === "ready");

export default redis;
