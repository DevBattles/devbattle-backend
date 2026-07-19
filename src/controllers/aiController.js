import { aiService } from '../services/aiService.js';
import { sendSuccess } from '../utils/response.js';
import logger from '../logger/logger.js';

export const aiController = {
  /**
   * AI Mentor Chat Request Handler
   */
  async mentorChat(req, res, next) {
    try {
      const payload = { ...req.body, userId: req.user?.id };
      logger.info('aiController.mentorChat called', { role: req.user?.role });

      // Forward request to AI Service
      const result = await aiService.mentorChat(payload);

      return sendSuccess(res, 200, 'AI Mentor response generated successfully', result);
    } catch (error) {
      next(error);
    }
  }
};
