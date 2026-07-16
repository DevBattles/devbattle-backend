import { questionRepository } from '../repositories/questionRepository.js';
import { aiService } from './aiService.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import { QuestionDTO } from '../dto/index.js';

export const questionService = {
  /**
   * Create a new question, generates solutions via AI, and stores AI reference
   */
  async createQuestion(questionData, userId) {
    try {
      questionData.createdBy = userId;
      const question = await questionRepository.createQuestion(questionData);

      // Situation 1: Call AI to generate valid solutions and update question record
      try {
        const aiSolutions = await aiService.generateSolutions(question);
        if (aiSolutions && aiSolutions.referenceId) {
          await questionRepository.updateQuestion(question.id, {
            expectedOutput: JSON.stringify({
              aiReferenceId: aiSolutions.referenceId,
              solutions: aiSolutions.solutions
            })
          });
        }
      } catch (aiError) {
        logger.error('Failed to generate AI solutions during question creation, continuing...', {
          questionId: question.id,
          error: aiError.message
        });
      }

      const finalQuestion = await questionRepository.getQuestionById(question.id);
      return QuestionDTO.toResponse(finalQuestion);
    } catch (error) {
      logger.error('Error in questionService.createQuestion', { error: error.message });
      throw error;
    }
  },

  /**
   * Fetch a question by ID
   */
  async getQuestionById(id) {
    const question = await questionRepository.getQuestionById(id);
    if (!question) throw new AppError('Question not found', 404);
    return QuestionDTO.toResponse(question);
  },

  /**
   * Fetch a specific question version archive
   */
  async getQuestionVersion(questionId, version) {
    const ver = await questionRepository.getQuestionVersion(questionId, version);
    if (!ver) throw new AppError('Question version not found', 404);
    return ver;
  },

  /**
   * Get all questions with filters
   */
  async getAllQuestions(filters = {}, pagination = {}, sorting = {}) {
    const result = await questionRepository.getAllQuestions(filters, pagination, sorting);
    result.data = QuestionDTO.toResponseList(result.data);
    return result;
  },

  /**
   * Update question bank details
   */
  async updateQuestion(id, updateData, userId) {
    const question = await questionRepository.getQuestionById(id);
    if (!question) throw new AppError('Question not found', 404);

    if (question.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this question', 403);
    }

    const updated = await questionRepository.updateQuestion(id, updateData);
    return QuestionDTO.toResponse(updated);
  },

  /**
   * Delete a question from the question bank
   */
  async deleteQuestion(id, userId) {
    const question = await questionRepository.getQuestionById(id);
    if (!question) throw new AppError('Question not found', 404);

    if (question.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this question', 403);
    }

    const deleted = await questionRepository.deleteQuestion(id);
    return QuestionDTO.toResponse(deleted);
  },

  /**
   * Publish question to the bank
   */
  async publishQuestion(id, userId) {
    const question = await questionRepository.getQuestionById(id);
    if (!question) throw new AppError('Question not found', 404);

    if (question.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this question', 403);
    }

    const published = await questionRepository.publishQuestion(id);
    return QuestionDTO.toResponse(published);
  },

  /**
   * Unpublish question from the bank
   */
  async unpublishQuestion(id, userId) {
    const question = await questionRepository.getQuestionById(id);
    if (!question) throw new AppError('Question not found', 404);

    if (question.createdBy !== userId) {
      throw new AppError('Forbidden: You are not the creator of this question', 403);
    }

    const unpublished = await questionRepository.unpublishQuestion(id);
    return QuestionDTO.toResponse(unpublished);
  },

  /**
   * Get user question bank progress
   */
  async getUserQuestionProgress(userId, questionId) {
    const progress = await questionRepository.getUserQuestionProgress(userId, questionId);
    if (!progress) {
      return { status: 'not_started', score: null, attempts: 0 };
    }
    return progress;
  },

  /**
   * Update user question bank progress
   */
  async updateQuestionProgress(userId, questionId, progressData) {
    const updated = await questionRepository.updateQuestionProgress(userId, questionId, progressData);
    return updated;
  },

  /**
   * Get questions created by a teacher
   */
  async getQuestionsByCreator(userId, pagination = {}) {
    const result = await questionRepository.getQuestionsByCreator(userId, pagination);
    result.data = QuestionDTO.toResponseList(result.data);
    return result;
  },

  /**
   * Search within the question bank
   */
  async searchQuestions(searchTerm, filters = {}, pagination = {}) {
    const result = await questionRepository.searchQuestions(searchTerm, filters, pagination);
    result.data = QuestionDTO.toResponseList(result.data);
    return result;
  }
};
