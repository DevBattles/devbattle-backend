import { contestService } from '../services/contestService.js';
import { createContestSchema, updateContestSchema } from '../validation/contest.js';
import { createSubmissionSchema, gradeSubmissionSchema } from '../validation/submission.js';
import { sendSuccess } from '../utils/response.js';

export const contestController = {
  /**
   * Create new contest with validator
   */
  async createContest(req, res, next) {
    try {
      const validated = createContestSchema.parse(req.body);
      const contest = await contestService.createContest(validated, req.user.id);
      return sendSuccess(res, 201, 'Contest created successfully', contest);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get contest by ID
   */
  async getContestById(req, res, next) {
    try {
      const { id } = req.params;
      const contest = await contestService.getContestById(id, req.user.id);
      return sendSuccess(res, 200, 'Contest retrieved successfully', contest);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all contests with filters
   */
  async getAllContests(req, res, next) {
    try {
      const filters = req.filters || {};
      const pagination = req.pagination || {};

      const result = await contestService.getAllContests(filters, pagination, req.user?.id);
      return sendSuccess(res, 200, 'Contests retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update contest metadata
   */
  async updateContest(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateContestSchema.parse(req.body);
      const updated = await contestService.updateContest(id, validated, req.user.id);
      return sendSuccess(res, 200, 'Contest updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete contest
   */
  async deleteContest(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await contestService.deleteContest(id, req.user.id);
      return sendSuccess(res, 200, 'Contest deleted successfully', deleted);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign questions to contest
   */
  async assignQuestions(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await contestService.updateContest(id, { questions: req.body.questions }, req.user.id);
      return sendSuccess(res, 200, 'Questions assigned successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List questions of contest
   */
  async getContestQuestions(req, res, next) {
    try {
      const { id } = req.params;
      const contest = await contestService.getContestById(id, req.user.id);
      return sendSuccess(res, 200, 'Questions retrieved successfully', contest.questions || []);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Participant registers to join contest
   */
  async joinContest(req, res, next) {
    try {
      const { id } = req.params;
      const participant = await contestService.joinContest(id, req.user.id);
      return sendSuccess(res, 200, 'Joined contest successfully', participant);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student clicks start to start contest timer
   */
  async startContest(req, res, next) {
    try {
      const { id } = req.params;
      const participant = await contestService.startContest(id, req.user.id);
      return sendSuccess(res, 200, 'Contest started successfully', participant);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student finishes contest
   */
  async completeContest(req, res, next) {
    try {
      const { id } = req.params;
      const participant = await contestService.completeContest(id, req.user.id);
      return sendSuccess(res, 200, 'Contest completed successfully', participant);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student submits contest question with AI evaluation
   */
  async submitContestAnswer(req, res, next) {
    try {
      const { contestId } = req.params;
      const validated = createSubmissionSchema.parse(req.body);

      const submission = await contestService.submitContestAnswer(contestId, req.user.id, validated);
      return sendSuccess(res, 201, 'Solution submitted and evaluated by AI successfully', submission);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher get all contest submissions
   */
  async getContestSubmissions(req, res, next) {
    try {
      const contestId = req.params.contestId || null;
      const filters = req.filters || {};
      const pagination = req.pagination || {};

      const submissions = await contestService.getContestSubmissions(contestId, filters, pagination);
      return sendSuccess(res, 200, 'Submissions retrieved successfully', submissions);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Grade / review contest submission
   */
  async updateContestSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const validated = gradeSubmissionSchema.parse(req.body);
      const updated = await contestService.updateContestSubmission(id, validated);
      return sendSuccess(res, 200, 'Contest submission graded successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all contest participants list
   */
  async getContestParticipants(req, res, next) {
    try {
      const { id } = req.params;
      const participants = await contestService.getContestParticipants(id);
      return sendSuccess(res, 200, 'Participants retrieved successfully', participants);
    } catch (error) {
      next(error);
    }
  }
};
