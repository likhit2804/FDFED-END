import redis, { isRedisReady } from "../configs/redisClient.js";

const cacheStats = {
  hits: 0,
  misses: 0,
  bypasses: 0,
  writes: 0,
  readErrors: 0,
  writeErrors: 0,
  lastResetAt: new Date().toISOString(),
};

function buildCacheKey(req) {
  const userId = req.user?.id || "anon";
  const communityId = req.user?.community || "none";
  return `cache:${userId}:${communityId}:${req.originalUrl}`;
}

function markBypass(res) {
  cacheStats.bypasses += 1;
  res.setHeader("X-Cache", "BYPASS");
}

function markMiss(res) {
  cacheStats.misses += 1;
  res.setHeader("X-Cache", "MISS");
}

function markHit(res) {
  cacheStats.hits += 1;
  res.setHeader("X-Cache", "HIT");
}

export function cacheRoute(ttlSeconds = 30) {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      markBypass(res);
      return next();
    }
    if (!redis || !isRedisReady()) {
      markBypass(res);
      return next();
    }

    const key = buildCacheKey(req);

    try {
      const cached = await redis.get(key);
      if (cached) {
        try {
          markHit(res);
          return res.json(JSON.parse(cached));
        } catch {
          markMiss(res);
        }
      }
    } catch (err) {
      cacheStats.readErrors += 1;
      console.warn("Redis cache read failed:", err?.message || err);
    }

    if (!res.getHeader("X-Cache")) {
      markMiss(res);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode === 200 && redis && isRedisReady()) {
        redis
          .set(key, JSON.stringify(payload), "EX", ttlSeconds)
          .then(() => {
            cacheStats.writes += 1;
          })
          .catch((err) => {
            cacheStats.writeErrors += 1;
            console.warn("Redis cache write failed:", err?.message || err);
          });
      }
      return originalJson(payload);
    };

    return next();
  };
}

export async function invalidateCache(pattern) {
  if (!redis || !isRedisReady()) return 0;

  try {
    let cursor = "0";
    let deleted = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length) {
        deleted += await redis.del(...keys);
      }
    } while (cursor !== "0");

    return deleted;
  } catch (err) {
    cacheStats.writeErrors += 1;
    console.warn("Redis cache invalidation failed:", err?.message || err);
    return 0;
  }
}

export function getCacheStats() {
  const totalReads = cacheStats.hits + cacheStats.misses;
  const hitRate = totalReads ? Number(((cacheStats.hits / totalReads) * 100).toFixed(2)) : 0;

  return {
    ...cacheStats,
    hitRate,
    totalReads,
  };
}

export function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.bypasses = 0;
  cacheStats.writes = 0;
  cacheStats.readErrors = 0;
  cacheStats.writeErrors = 0;
  cacheStats.lastResetAt = new Date().toISOString();
}

export async function clearAllCache() {
  if (!redis || !isRedisReady()) {
    resetCacheStats();
    return 0;
  }

  const deleted = await invalidateCache("cache:*");
  resetCacheStats();
  return deleted || 0;
}

export function buildBenchmarkCacheKey(scope = "default") {
  return `cache:benchmark:${scope}`;
}

export async function readCacheKey(key) {
  if (!redis || !isRedisReady()) return null;

  try {
    return await redis.get(key);
  } catch (err) {
    cacheStats.readErrors += 1;
    console.warn("Redis cache read failed:", err?.message || err);
    return null;
  }
}

export async function writeCacheKey(key, value, ttlSeconds = 60) {
  if (!redis || !isRedisReady()) return false;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    cacheStats.writes += 1;
    return true;
  } catch (err) {
    cacheStats.writeErrors += 1;
    console.warn("Redis cache write failed:", err?.message || err);
    return false;
  }
}
