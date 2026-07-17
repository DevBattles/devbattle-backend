import { questionService } from '../services/questionService.js';
import { createQuestionSchema, updateQuestionSchema } from '../validation/question.js';
import { sendSuccess } from '../utils/response.js';

export const questionController = {
  /**
   * Create new question bank entry
   */
  async createQuestion(req, res, next) {
    try {
      const validated = createQuestionSchema.parse(req.body);
      const question = await questionService.createQuestion(validated, req.user.id);
      return sendSuccess(res, 201, 'Question created successfully', question);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get question by ID
   */
  async getQuestionById(req, res, next) {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id);
      return sendSuccess(res, 200, 'Question retrieved successfully', question);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all questions with filters
   */
  async getAllQuestions(req, res, next) {
    try {
      const filters = req.filters || {};
      const pagination = req.pagination || {};
      const sorting = req.sorting || {};

      const result = await questionService.getAllQuestions(filters, pagination, sorting, req.user?.id);
      return sendSuccess(res, 200, 'Questions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update question bank entry
   */
  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateQuestionSchema.parse(req.body);
      const updated = await questionService.updateQuestion(id, validated, req.user.id);
      return sendSuccess(res, 200, 'Question updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a question
   */
  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await questionService.deleteQuestion(id, req.user.id);
      return sendSuccess(res, 200, 'Question deleted successfully', deleted);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish question to question bank
   */
  async publishQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const published = await questionService.publishQuestion(id, req.user.id);
      return sendSuccess(res, 200, 'Question published successfully', published);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unpublish question from question bank
   */
  async unpublishQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const unpublished = await questionService.unpublishQuestion(id, req.user.id);
      return sendSuccess(res, 200, 'Question unpublished successfully', unpublished);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get student's question progress
   */
  async getUserQuestionProgress(req, res, next) {
    try {
      const { questionId } = req.params;
      const progress = await questionService.getUserQuestionProgress(req.user.id, questionId);
      return sendSuccess(res, 200, 'Question progress retrieved successfully', progress);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update question progress manually
   */
  async updateQuestionProgress(req, res, next) {
    try {
      const { questionId } = req.params;
      const progress = await questionService.updateQuestionProgress(req.user.id, questionId, req.body);
      return sendSuccess(res, 200, 'Question progress updated successfully', progress);
    } catch (error) {
      next(error);
    }
  },

  async submitPracticeQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const result = await questionService.submitPracticeQuestion(req.user.id, questionId, req.body);
      return sendSuccess(res, 200, 'Practice question evaluated successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get questions created by the teacher
   */
  async getQuestionsByCreator(req, res, next) {
    try {
      const pagination = req.pagination || {};
      const result = await questionService.getQuestionsByCreator(req.user.id, pagination);
      return sendSuccess(res, 200, 'Questions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search question bank entries
   */
  async searchQuestions(req, res, next) {
    try {
      const { searchTerm } = req.params;
      const filters = req.filters || {};
      const pagination = req.pagination || {};

      const result = await questionService.searchQuestions(searchTerm, filters, pagination);
      return sendSuccess(res, 200, 'Questions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
};
