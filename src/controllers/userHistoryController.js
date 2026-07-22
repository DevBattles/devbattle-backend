import { userHistoryService } from '../services/userHistoryService.js';
import { sendSuccess } from '../utils/response.js';

export const userHistoryController = {
  async getStudentHistory(req, res, next) {
    try {
      const history = await userHistoryService.getStudentHistory(req.user.id);
      return sendSuccess(res, 200, 'Student history retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }
};
