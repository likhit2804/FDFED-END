import express from 'express';
import { SearchService } from '../services/searchService.js';

const searchRouter = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Universal search across all UrbanEase entities safely scoped by role
 *     description: |
 *       Extremely optimized text search utilizing MongoDB native $text indexes 
 *       across 15 different entities evaluated concurrently. 
 *       Never uses Regex.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term 
 *         example: "plumbing"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [issues, communities, residents, workers, security, visitors, preapprovals, payments, bookings, leaves, ads, amenities, interest, auditlogs, managers, all]
 *           default: all
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results grouped by entity type
 */
searchRouter.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query (q) is required' });
    }

    const term = q.trim();
    const userType = req.user?.userType;
    
    const userContext = {
      userType,
      communityId: req.user?.community,
      userId: req.user?.id,
      isAdmin: userType === 'Admin',
      isManager: userType === 'CommunityManager',
      isResident: userType === 'Resident',
      isWorker: userType === 'Worker',
      isSecurity: userType === 'Security'
    };

    // Offload to concurrent Search Service layer
    const results = await SearchService.executeMultiSearch({
      term, type, limit, userContext
    });

    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    return res.json({
      success: true,
      query: term,
      userType,
      totalResults,
      resultsByType: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.length])
      ),
      results,
    });

  } catch (error) {
    console.error('Search router error:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

export default searchRouter;
