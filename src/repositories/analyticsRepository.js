import { db } from '../db/index.js';
import { analyticsEvents, users, homeworks, contests, homeworkSubmissions, contestSubmissions } from '../schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const analyticsRepository = {
  /**
   * Log an event in the analytics_events table
   */
  async logEvent(data) {
    try {
      const [event] = await db.insert(analyticsEvents).values(data).returning();
      return event;
    } catch (error) {
      logger.error('Error logging analytics event', { error: error.message });
      throw error;
    }
  },

  /**
   * Get recent log events
   */
  async getRecentEvents(userId = null, limit = 50) {
    try {
      let query = db.select().from(analyticsEvents);
      if (userId) {
        query = query.where(eq(analyticsEvents.userId, userId));
      }
      return await query.orderBy(desc(analyticsEvents.timestamp)).limit(limit);
    } catch (error) {
      logger.error('Error fetching analytics events', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Get count stats aggregate for system dashboard reports
   */
  async getAggregateStats() {
    try {
      const [{ userCount }] = await db.select({ userCount: sql`count(*)` }).from(users);
      const [{ teacherCount }] = await db.select({ teacherCount: sql`count(*)` }).from(users).where(eq(users.role, 'teacher'));
      const [{ studentCount }] = await db.select({ studentCount: sql`count(*)` }).from(users).where(eq(users.role, 'student'));
      const [{ homeworkCount }] = await db.select({ homeworkCount: sql`count(*)` }).from(homeworks);
      const [{ contestCount }] = await db.select({ contestCount: sql`count(*)` }).from(contests);
      
      const [{ homeworkSubCount }] = await db.select({ homeworkSubCount: sql`count(*)` }).from(homeworkSubmissions);
      const [{ contestSubCount }] = await db.select({ contestSubCount: sql`count(*)` }).from(contestSubmissions);

      return {
        users: parseInt(userCount),
        teachers: parseInt(teacherCount),
        students: parseInt(studentCount),
        homeworks: parseInt(homeworkCount),
        contests: parseInt(contestCount),
        submissions: parseInt(homeworkSubCount) + parseInt(contestSubCount),
      };
    } catch (error) {
      logger.error('Error fetching aggregate analytics stats', { error: error.message });
      throw error;
    }
  }
};
