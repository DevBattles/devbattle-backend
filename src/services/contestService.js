import { contestRepository } from '../repositories/contestRepository.js';
import { questionRepository } from '../repositories/questionRepository.js';
import { aiService } from './aiService.js';
import { notificationService } from './notificationService.js';
import { leaderboardService } from './leaderboardService.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import { ContestDTO, SubmissionDTO } from '../dto/index.js';

export const contestService = {
  /**
   * Create a new contest with questions
   */
  async createContest(contestData, userId) {
    try {
      contestData.createdBy = userId;
      const questionsList = contestData.questions || [];
      const contest = await contestRepository.createContest(contestData, questionsList);

      if (contest.published || contest.status === 'published') {
        await notificationService.notifyAllStudents({
          title: 'New Contest Published',
          message: `A new contest "${contest.title}" has been published. Start time: ${new Date(contest.startTime).toLocaleString()}`,
          type: 'contest_published'
        });
      }

      return ContestDTO.toResponse(contest);
    } catch (error) {
      logger.error('Error in contestService.createContest', { error: error.message });
      throw error;
    }
  },

  /**
   * Get contest by ID
   */
  async getContestById(id, userId = null) {
    const contest = await contestRepository.getContestById(id);
    if (!contest) throw new AppError('Contest not found', 404);
    return contest;
  },

  /**
   * Get all contests with filters
   */
  async getAllContests(filters = {}, pagination = {}) {
    return await contestRepository.getAllContests(filters, pagination);
  },

  /**
   * Update contest and send status change notifications
   */
  async updateContest(id, updateData, userId) {
    const existing = await contestRepository.getContestById(id);
    if (!existing) throw new AppError('Contest not found', 404);
    if (existing.createdBy !== userId) {
      throw new AppError('Forbidden: You do not own this contest', 403);
    }

    const questionsList = updateData.questions || null;
    const updated = await contestRepository.updateContest(id, updateData, questionsList);

    if (updateData.status === 'published' && existing.status !== 'published') {
      await notificationService.notifyAllStudents({
        title: 'Contest Published',
        message: `The contest "${updated.title}" has been published! Join now! Start time: ${new Date(updated.startTime).toLocaleString()}`,
        type: 'contest_published'
      });
    }

    if (updateData.status === 'started' && existing.status !== 'started') {
      await notificationService.notifyAllStudents({
        title: 'Contest Started',
        message: `The contest "${updated.title}" has started! Start solving questions!`,
        type: 'contest_started'
      });
    }

    return ContestDTO.toResponse(updated);
  },

  /**
   * Delete contest
   */
  async deleteContest(id, userId) {
    const existing = await contestRepository.getContestById(id);
    if (!existing) throw new AppError('Contest not found', 404);
    if (existing.createdBy !== userId) {
      throw new AppError('Forbidden: You do not own this contest', 403);
    }

    const deleted = await contestRepository.deleteContest(id);
    return ContestDTO.toResponse(deleted);
  },

  /**
   * Join a contest as participant
   */
  async joinContest(contestId, userId) {
    const participant = await contestRepository.joinContest(contestId, userId);
    return participant;
  },

  /**
   * Student starts contest timer
   */
  async startContest(contestId, userId) {
    return await contestRepository.startContest(contestId, userId);
  },

  /**
   * Student completes contest
   */
  async completeContest(contestId, userId) {
    return await contestRepository.completeContest(contestId, userId);
  },

  /**
   * Submit contest answer, evaluates via AI (Situation 2), logs leaderboard points
   */
  async submitContestAnswer(contestId, studentId, submissionData) {
    try {
      const contest = await contestRepository.getContestById(contestId);
      if (!contest) throw new AppError('Contest not found', 404);

      const questionId = submissionData.questionId;
      const question = await questionRepository.getQuestionById(questionId);
      if (!question) throw new AppError('Question not found', 404);

      const existingSubmission = await contestRepository.getStudentContestSubmission(contestId, questionId, studentId);
      if (existingSubmission) {
        throw new AppError('You have already submitted this question for this contest', 400);
      }

      const submission = await contestRepository.submitContestAnswer({
        contestId,
        studentId,
        questionId,
        questionVersion: submissionData.questionVersion || question.version || 1,
        files: submissionData.files,
        githubRepo: submissionData.githubRepo,
        livePreview: submissionData.livePreview,
        status: 'pending'
      });

      let aiReport;
      try {
        aiReport = await aiService.evaluateSubmission(submission, question);
      } catch (aiError) {
        logger.error('AI contest submission evaluation failed, using fallback mock evaluation', { error: aiError.message });
        aiReport = aiService._generateMockEvaluation(submission, question);
      }

      const updatedSubmission = await contestRepository.updateContestSubmission(submission.id, {
        status: 'graded',
        score: aiReport.score,
        grade: aiReport.grade,
        feedback: aiReport.feedback,
        report: aiReport.report
      });

      await questionRepository.updateQuestionProgress(studentId, questionId, {
        status: 'completed',
        score: aiReport.score
      });

      await leaderboardService.awardPoints(studentId, 'contest', contestId, aiReport.score || 0);
      await leaderboardService.awardPoints(studentId, 'global', null, aiReport.score || 0);

      await notificationService.createNotification({
        userId: studentId,
        title: 'Contest Submission Evaluated',
        message: `Your solution for contest "${contest.title}" question "${question.title}" has been graded: ${aiReport.score} points.`,
        type: 'submission_reviewed',
        metadata: { submissionId: submission.id }
      });

      return SubmissionDTO.toResponse(updatedSubmission);
    } catch (error) {
      logger.error('Error in contestService.submitContestAnswer', { error: error.message, contestId, studentId });
      throw error;
    }
  },

  async getContestSubmissions(contestId, filters = {}, pagination = {}) {
    return await contestRepository.getContestSubmissions(contestId, filters, pagination);
  },

  async getContestParticipants(contestId) {
    return await contestRepository.getContestParticipants(contestId);
  }
};
