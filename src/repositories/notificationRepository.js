import { db } from '../db/index.js';
import { notifications } from '../schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const notificationRepository = {
  /**
   * Create a notification record
   */
  async createNotification(data) {
    try {
      const [notif] = await db.insert(notifications).values(data).returning();
      return notif;
    } catch (error) {
      logger.error('Error creating notification', { error: error.message });
      throw error;
    }
  },

  /**
   * Get all notifications for a user, optionally filter by unread status
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      let conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      return await db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      logger.error('Error getting user notifications', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Mark notification read
   */
  async markAsRead(id, userId) {
    try {
      const [updated] = await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
      return updated || null;
    } catch (error) {
      logger.error('Error marking notification as read', { id, userId, error: error.message });
      throw error;
    }
  },

  /**
   * Mark all unread notifications read
   */
  async markAllAsRead(userId) {
    try {
      return await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId))
        .returning();
    } catch (error) {
      logger.error('Error marking all notifications as read', { userId, error: error.message });
      throw error;
    }
  }
};
