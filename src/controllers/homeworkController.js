import { homeworkService } from '../services/homeworkService.js';
import { createHomeworkSchema, updateHomeworkSchema, assignHomeworkSchema } from '../validation/homework.js';
import { createSubmissionSchema, gradeSubmissionSchema } from '../validation/submission.js';
import { sendSuccess } from '../utils/response.js';

export const homeworkController = {
  /**
   * Create a new homework with validation
   */
  async createHomework(req, res, next) {
    try {
      const validated = createHomeworkSchema.parse(req.body);
      const homework = await homeworkService.createHomework(validated, req.user.id);
      return sendSuccess(res, 201, 'Homework created successfully', homework);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch a homework by ID
   */
  async getHomeworkById(req, res, next) {
    try {
      const { id } = req.params;
      const homework = await homeworkService.getHomeworkById(id, req.user.id);
      return sendSuccess(res, 200, 'Homework retrieved successfully', homework);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all homeworks with pagination
   */
  async getAllHomework(req, res, next) {
    try {
      const filters = req.filters || {};
      const pagination = req.pagination || {};

      const result = await homeworkService.getAllHomework(filters, pagination);
      return sendSuccess(res, 200, 'Homework retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update homework attributes
   */
  async updateHomework(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateHomeworkSchema.parse(req.body);
      const updated = await homeworkService.updateHomework(id, validated, req.user.id);
      return sendSuccess(res, 200, 'Homework updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete homework
   */
  async deleteHomework(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await homeworkService.deleteHomework(id, req.user.id);
      return sendSuccess(res, 200, 'Homework deleted successfully', deleted);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign homework to student/batch
   */
  async assignHomework(req, res, next) {
    try {
      const { id } = req.params;
      const validated = assignHomeworkSchema.parse(req.body);
      const assignment = await homeworkService.assignHomework(id, validated, req.user.id);
      return sendSuccess(res, 200, 'Homework assigned successfully', assignment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student get assigned homework list
   */
  async getAssignedHomework(req, res, next) {
    try {
      const pagination = req.pagination || {};
      const batch = req.query.batch || null;
      const result = await homeworkService.getAssignedHomework(req.user.id, batch, pagination);
      return sendSuccess(res, 200, 'Assigned homework retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit homework question solution with AI evaluation
   */
  async submitHomework(req, res, next) {
    try {
      const { homeworkId } = req.params;
      const validated = createSubmissionSchema.parse(req.body);
      
      const submission = await homeworkService.submitHomework(homeworkId, req.user.id, validated);
      return sendSuccess(res, 201, 'Homework submitted and evaluated by AI successfully', submission);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher get all homework submissions
   */
  async getHomeworkSubmissions(req, res, next) {
    try {
      const { homeworkId } = req.params;
      const filters = req.filters || {};
      const pagination = req.pagination || {};

      const submissions = await homeworkService.getHomeworkSubmissions(homeworkId, filters, pagination);
      return sendSuccess(res, 200, 'Submissions retrieved successfully', submissions);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student get their own submission
   */
  async getStudentHomeworkSubmission(req, res, next) {
    try {
      const { homeworkId } = req.params;
      const { questionId } = req.query;
      
      const submission = await homeworkService.getStudentHomeworkSubmission(homeworkId, questionId, req.user.id);
      return sendSuccess(res, 200, 'Submission retrieved successfully', submission);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get submission detail by ID
   */
  async getHomeworkSubmissionById(req, res, next) {
    try {
      const { id } = req.params;
      const submission = await homeworkService.getHomeworkSubmissionById(id, req.user.id);
      return sendSuccess(res, 200, 'Submission retrieved successfully', submission);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Grade / review homework submission
   */
  async updateHomeworkSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const validated = gradeSubmissionSchema.parse(req.body);
      const updated = await homeworkService.updateHomeworkSubmission(id, validated);
      return sendSuccess(res, 200, 'Submission graded successfully', updated);
    } catch (error) {
      next(error);
    }
  }
};
