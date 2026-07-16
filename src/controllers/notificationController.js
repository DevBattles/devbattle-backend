import { notificationService } from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export const notificationController = {
  /**
   * Get user's notifications
   */
  async getUserNotifications(req, res, next) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const list = await notificationService.getUserNotifications(req.user.id, unreadOnly);
      return sendSuccess(res, 200, 'Notifications retrieved successfully', list);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark individual notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await notificationService.markAsRead(id, req.user.id);
      return sendSuccess(res, 200, 'Notification marked as read successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all unread user notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, 200, 'All notifications marked as read successfully', updated);
    } catch (error) {
      next(error);
    }
  }
};
