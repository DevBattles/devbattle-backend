import { dashboardService } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

export const dashboardController = {
  /**
   * Get student's dashboard metrics
   */
  async getStudentDashboard(req, res, next) {
    try {
      const data = await dashboardService.getStudentDashboard(req.user.id);
      return sendSuccess(res, 200, 'Student dashboard retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get teacher's dashboard metrics
   */
  async getTeacherDashboard(req, res, next) {
    try {
      const data = await dashboardService.getTeacherDashboard(req.user.id);
      return sendSuccess(res, 200, 'Teacher dashboard retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get admin's dashboard metrics
   */
  async getAdminDashboard(req, res, next) {
    try {
      const data = await dashboardService.getAdminDashboard();
      return sendSuccess(res, 200, 'Admin dashboard retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }
};
