import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController.js';
import { authenticateUser } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/leaderboards
 * @desc    Get leaderboard rankings
 * @access  Authenticated (Student, Teacher, Admin)
 */
router.get('/', parseQuery, leaderboardController.getLeaderboard);

export default router;
