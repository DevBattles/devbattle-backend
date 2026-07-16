import { leaderboardRepository } from '../repositories/leaderboardRepository.js';
import logger from '../logger/logger.js';

export const leaderboardService = {
  /**
   * Get leaderboard rankings
   */
  async getLeaderboard(type, contextId = null, pagination = {}) {
    return await leaderboardRepository.getLeaderboard(type, contextId, pagination);
  },

  /**
   * Award points on submission grading and refresh ranking orders
   */
  async awardPoints(userId, type, contextId, points) {
    try {
      logger.info('leaderboardService.awardPoints called', { userId, type, contextId, points });
      
      await leaderboardRepository.updateScore(userId, type, contextId, points);
      await leaderboardRepository.refreshRanks(type, contextId);

      if (type !== 'global') {
        await leaderboardRepository.updateScore(userId, 'global', null, points);
        await leaderboardRepository.refreshRanks('global', null);
      }
    } catch (error) {
      logger.error('Failed to award leaderboard points', { userId, error: error.message });
    }
  }
};
