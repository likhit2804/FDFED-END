import express from "express";
import auth from "../controllers/shared/auth.js";
import { authorizeA } from "../controllers/shared/authorization.js";
import { isRedisReady } from "../configs/redisClient.js";
import { clearAllCache, getCacheStats } from "../middleware/cacheMiddleware.js";

const cacheRouter = express.Router();

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get Redis cache diagnostics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cache stats with redis readiness and hit rate
 */
cacheRouter.get("/stats", auth, authorizeA, (req, res) => {
  return res.json({
    success: true,
    redisReady: isRedisReady(),
    stats: getCacheStats(),
  });
});

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear all Redis response-cache keys
 *     tags: [Admin - Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared and metrics reset
 */
cacheRouter.post("/clear", auth, authorizeA, async (req, res) => {
  const deletedKeys = await clearAllCache();
  return res.json({
    success: true,
    redisReady: isRedisReady(),
    deletedKeys,
    message: "Cache cleared successfully",
  });
});

export default cacheRouter;
