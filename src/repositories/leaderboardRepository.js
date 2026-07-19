import { db } from '../db/index.js';
import { leaderboards } from '../schema/analytics.js';
import { users } from '../schema/users.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const leaderboardRepository = {
  /**
   * Get leaderboard rankings with pagination
   */
  async getLeaderboard(type, contextId = null, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      
      let conditions = [eq(leaderboards.type, type)];
      if (contextId) {
        conditions.push(eq(leaderboards.contextId, contextId));
      }

      const list = await db.select({
        id: leaderboards.id,
        score: leaderboards.score,
        rank: leaderboards.rank,
        updatedAt: leaderboards.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
      .from(leaderboards)
      .innerJoin(users, eq(leaderboards.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(leaderboards.rank))
      .limit(take)
      .offset(skip);

      return list;
    } catch (error) {
      logger.error('Error fetching leaderboard', { type, contextId, error: error.message });
      throw error;
    }
  },

  /**
   * Update leaderboard score for a student
   */
  async updateScore(userId, type, contextId, scoreDiff) {
    try {
      return await db.transaction(async (tx) => {
        let conditions = [
          eq(leaderboards.userId, userId),
          eq(leaderboards.type, type)
        ];
        if (contextId) {
          conditions.push(eq(leaderboards.contextId, contextId));
        }

        const [existing] = await tx.select().from(leaderboards).where(and(...conditions));

        if (existing) {
          const newScore = existing.score + scoreDiff;
          const [updated] = await tx.update(leaderboards)
            .set({ score: newScore, updatedAt: new Date() })
            .where(eq(leaderboards.id, existing.id))
            .returning();
          return updated;
        } else {
          const [created] = await tx.insert(leaderboards).values({
            userId,
            type,
            contextId,
            score: scoreDiff,
            rank: 9999
          }).returning();
          return created;
        }
      });
    } catch (error) {
      logger.error('Error updating leaderboard score', { userId, type, error: error.message });
      throw error;
    }
  },

  /**
   * Refresh ranks inside a specific leaderboard type
   */
  async refreshRanks(type, contextId = null) {
    try {
      return await db.transaction(async (tx) => {
        let conditions = [eq(leaderboards.type, type)];
        if (contextId) {
          conditions.push(eq(leaderboards.contextId, contextId));
        }

        const records = await tx.select()
          .from(leaderboards)
          .where(and(...conditions))
          .orderBy(desc(leaderboards.score));

        for (let i = 0; i < records.length; i++) {
          await tx.update(leaderboards)
            .set({ rank: i + 1 })
            .where(eq(leaderboards.id, records[i].id));
        }
      });
    } catch (error) {
      logger.error('Error refreshing leaderboard ranks', { type, contextId, error: error.message });
      throw error;
    }
  }
};
