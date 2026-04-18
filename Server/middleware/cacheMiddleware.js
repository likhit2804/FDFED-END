import redis, { isRedisReady } from "../configs/redisClient.js";

function buildCacheKey(req) {
  const userId = req.user?.id || "anon";
  const communityId = req.user?.community || "none";
  return `cache:${userId}:${communityId}:${req.originalUrl}`;
}

export function cacheRoute(ttlSeconds = 30) {
  return async (req, res, next) => {
    if (req.method !== "GET") return next();
    if (!redis || !isRedisReady()) return next();

    const key = buildCacheKey(req);

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.warn("Redis cache read failed:", err?.message || err);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode === 200 && redis && isRedisReady()) {
        redis
          .set(key, JSON.stringify(payload), "EX", ttlSeconds)
          .catch((err) => {
            console.warn("Redis cache write failed:", err?.message || err);
          });
      }
      return originalJson(payload);
    };

    return next();
  };
}

export async function invalidateCache(pattern) {
  if (!redis || !isRedisReady()) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn("Redis cache invalidation failed:", err?.message || err);
  }
}
