import { homeworkRepository } from '../repositories/homeworkRepository.js';
import { questionRepository } from '../repositories/questionRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { aiService } from './aiService.js';
import { notificationService } from './notificationService.js';
import { leaderboardService } from './leaderboardService.js';
import { analyticsService } from './analyticsService.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import { HomeworkDTO, SubmissionDTO } from '../dto/index.js';
import { db } from '../db/index.js';
import { homeworkSubmissions } from '../schema/index.js';
import { and, eq, sql } from 'drizzle-orm';

export const homeworkService = {
  /**
   * Create new homework assignment linking questions
   */
  async createHomework(homeworkData, userId) {
    try {
      // Verify user exists in database
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new AppError('User not found in database', 404);
      }

      homeworkData.createdBy = userId;
      const questionIds = homeworkData.questions || [];
      const homework = await homeworkRepository.createHomework(homeworkData, questionIds);

      await analyticsService.logEvent(userId, 'homework_created', {
        homeworkId: homework.id,
        title: homework.title,
        questionCount: questionIds.length
      });

      return HomeworkDTO.toResponse(homework);
    } catch (error) {
      logger.error('Error in homeworkService.createHomework', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Fetch homework details
   */
  async getHomeworkById(id, userId = null) {
    const homework = await homeworkRepository.getHomeworkById(id);
    if (!homework) throw new AppError('Homework not found', 404);
    return homework;
  },

  /**
   * Get all homework with filters
   */
  async getAllHomework(filters = {}, pagination = {}) {
    const result = await homeworkRepository.getAllHomework(filters, pagination);
    return result;
  },

  /**
   * Update homework attributes
   */
  async updateHomework(id, updateData, userId) {
    const existing = await homeworkRepository.getHomeworkById(id);
    if (!existing) throw new AppError('Homework not found', 404);
    if (existing.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this homework', 403);
    }

    const questionIds = updateData.questions || null;
    const updated = await homeworkRepository.updateHomework(id, updateData, questionIds);
    return HomeworkDTO.toResponse(updated);
  },

  /**
   * Delete homework
   */
  async deleteHomework(id, userId) {
    const existing = await homeworkRepository.getHomeworkById(id);
    if (!existing) throw new AppError('Homework not found', 404);
    if (existing.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this homework', 403);
    }

    const deleted = await homeworkRepository.deleteHomework(id);
    return HomeworkDTO.toResponse(deleted);
  },

  /**
   * Assign homework to student/batch and dispatch notifications
   */
  async assignHomework(homeworkId, assignData, userId) {
    try {
      const existing = await homeworkRepository.getHomeworkById(homeworkId);
      if (!existing) throw new AppError('Homework not found', 404);
      if (existing.createdBy !== userId) {
        throw new AppError('Forbidden: You are not the creator of this homework', 403);
      }

      const assignment = await homeworkRepository.assignHomework(homeworkId, assignData, userId);

      if (assignData.studentId) {
        await notificationService.createNotification({
          userId: assignData.studentId,
          title: 'New Homework Assigned',
          message: `You have been assigned a new homework: ${existing.title}. Due date: ${new Date(existing.dueDate).toLocaleDateString()}`,
          type: 'homework_assigned'
        });
      }

      return assignment;
    } catch (error) {
      logger.error('Error in homeworkService.assignHomework', { error: error.message, homeworkId });
      throw error;
    }
  },

  /**
   * Get assigned homeworks list
   */
  async getAssignedHomework(studentId, batch = null, pagination = {}) {
    if (!batch) {
      const profile = await userRepository.getStudentProfileByUserId(studentId);
      if (profile && profile.batch) {
        batch = profile.batch;
      }
    }
    const homeworksList = await homeworkRepository.getAssignedHomework(studentId, batch, pagination);

    const enrichedList = [];
    for (const hw of homeworksList) {
      const [submissionsCountResult] = await db.select({
        count: sql`count(*)`
      })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.homeworkId, hw.id),
          eq(homeworkSubmissions.studentId, studentId)
        )
      );

      const count = parseInt(submissionsCountResult?.count || 0);

      enrichedList.push({
        ...hw,
        submissionsCount: count,
        status: count > 0 ? 'Completed' : 'Pending'
      });
    }

    return enrichedList;
  },

  /**
   * Submit homework, evaluates via AI (Situation 2), adds points to leaderboard, dispatches reviews
   */
  async submitHomework(homeworkId, studentId, submissionData) {
    try {
      const homework = await homeworkRepository.getHomeworkById(homeworkId);
      if (!homework) throw new AppError('Homework not found', 404);

      const questionId = submissionData.questionId;
      const question = await questionRepository.getQuestionById(questionId);
      if (!question) throw new AppError('Question not found in question bank', 404);

      const existingSubmission = await homeworkRepository.getStudentHomeworkSubmission(homeworkId, questionId, studentId);
      if (existingSubmission) {
        throw new AppError('You have already submitted this question for this homework', 400);
      }

      const submission = await homeworkRepository.submitHomework({
        homeworkId,
        studentId,
        questionId,
        questionVersion: submissionData.questionVersion || question.version || 1,
        files: submissionData.files,
        githubRepo: submissionData.githubRepo,
        livePreview: submissionData.livePreview,
        status: 'pending'
      });

      await analyticsService.logEvent(studentId, 'homework_submitted', {
        homeworkId,
        questionId,
        submissionId: submission.id
      });

      let aiReport;
      try {
        aiReport = await aiService.evaluateSubmission(submission, question);
      } catch (aiError) {
        logger.error('AI submission evaluation failed, using fallback mock evaluation', { error: aiError.message });
        aiReport = aiService._generateMockEvaluation(submission, question);
      }

      const updatedSubmission = await homeworkRepository.updateHomeworkSubmission(submission.id, {
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

      await leaderboardService.awardPoints(studentId, 'homework', homeworkId, aiReport.score || 0);

      await analyticsService.logEvent(studentId, 'homework_graded', {
        homeworkId,
        questionId,
        submissionId: submission.id,
        score: aiReport.score,
        grade: aiReport.grade
      });

      await notificationService.createNotification({
        userId: studentId,
        title: 'Submission Reviewed by AI',
        message: `Your submission for homework "${homework.title}" question "${question.title}" has been graded. Score: ${aiReport.score} (${aiReport.grade})`,
        type: 'submission_reviewed',
        metadata: { submissionId: submission.id }
      });

      return SubmissionDTO.toResponse(updatedSubmission);
    } catch (error) {
      logger.error('Error in homeworkService.submitHomework', { error: error.message, homeworkId, studentId });
      throw error;
    }
  },

  async getHomeworkSubmissions(homeworkId, filters = {}, pagination = {}) {
    return await homeworkRepository.getHomeworkSubmissions(homeworkId, filters, pagination);
  },

  async getStudentHomeworkSubmission(homeworkId, questionId, studentId) {
    const submission = await homeworkRepository.getStudentHomeworkSubmission(homeworkId, questionId, studentId);
    return SubmissionDTO.toResponse(submission);
  },

  async getHomeworkSubmissionById(id, userId = null) {
    const submission = await homeworkRepository.getHomeworkSubmissionById(id);
    if (!submission) throw new AppError('Submission not found', 404);
    if (userId && submission.studentId !== userId) {
      throw new AppError('Forbidden: You are not authorized to view this submission', 403);
    }
    return SubmissionDTO.toResponse(submission);
  },

  async updateHomeworkSubmission(id, updateData) {
    const updated = await homeworkRepository.updateHomeworkSubmission(id, updateData);
    return SubmissionDTO.toResponse(updated);
  }
};
