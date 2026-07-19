import { analyticsRepository } from '../repositories/analyticsRepository.js';

export const analyticsService = {
  /**
   * Log an event
   */
  async logEvent(userId, eventType, eventData = {}) {
    return await analyticsRepository.logEvent({
      userId,
      eventType,
      eventData
    });
  },

  /**
   * Fetch recent analytics logs
   */
  async getRecentEvents(userId = null, limit = 50) {
    return await analyticsRepository.getRecentEvents(userId, limit);
  },

  /**
   * Fetch aggregate count stats
   */
  async getAggregateStats() {
    return await analyticsRepository.getAggregateStats();
  }
};
