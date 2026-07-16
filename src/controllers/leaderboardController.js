import { leaderboardService } from '../services/leaderboardService.js';
import { sendSuccess } from '../utils/response.js';

export const leaderboardController = {
  /**
   * Get rankings for global, weekly, monthly, contest, homework, dept, or college
   */
  async getLeaderboard(req, res, next) {
    try {
      const type = req.query.type || 'global';
      const contextId = req.query.contextId || null;
      const pagination = req.pagination || {};

      const list = await leaderboardService.getLeaderboard(type, contextId, pagination);
      return sendSuccess(res, 200, 'Leaderboard retrieved successfully', list);
    } catch (error) {
      next(error);
    }
  }
};
