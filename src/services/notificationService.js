import { notificationRepository } from '../repositories/notificationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import logger from '../logger/logger.js';

export const notificationService = {
  /**
   * Create an individual notification
   */
  async createNotification(data) {
    try {
      return await notificationRepository.createNotification(data);
    } catch (error) {
      logger.error('Failed to create notification', { error: error.message });
    }
  },

  /**
   * Fetch a user's notifications
   */
  async getUserNotifications(userId, unreadOnly = false) {
    return await notificationRepository.getUserNotifications(userId, unreadOnly);
  },

  /**
   * Mark an individual notification read
   */
  async markAsRead(id, userId) {
    return await notificationRepository.markAsRead(id, userId);
  },

  /**
   * Mark all notifications read
   */
  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  },

  /**
   * Broadcast a notification to all registered student users
   */
  async notifyAllStudents({ title, message, type, metadata = {} }) {
    try {
      logger.info('notifyAllStudents called', { title, type });
      const students = await userRepository.getAllStudents(0, 500);
      
      for (const student of students) {
        await notificationRepository.createNotification({
          userId: student.id,
          title,
          message,
          type,
          metadata
        });
      }
    } catch (error) {
      logger.error('Failed to notify all students', { error: error.message });
    }
  }
};
