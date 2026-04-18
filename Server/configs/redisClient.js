import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redis = null;

try {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  client.on("ready", () => {
    console.log("Redis connected");
  });

  client.on("error", (err) => {
    console.warn("Redis error:", err?.message || err);
  });

  client.connect().catch((err) => {
    console.warn("Redis unavailable, continuing without cache:", err?.message || err);
  });

  redis = client;
} catch (err) {
  console.warn("Redis init failed, continuing without cache:", err?.message || err);
  redis = null;
}

export const isRedisReady = () => Boolean(redis && redis.status === "ready");

export default redis;
