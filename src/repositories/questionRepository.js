import { db } from '../db/index.js';
import { questionBank, questionVersions, questionProgress } from '../schema/index.js';
import { eq, and, like, or, desc, asc, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const questionRepository = {
  /**
   * Create a new question and store version 1
   */
  async createQuestion(questionData) {
    try {
      const [question] = await db.insert(questionBank).values({
        ...questionData,
        version: 1
      }).returning();
      
      await db.insert(questionVersions).values({
        questionId: question.id,
        version: 1,
        title: question.title,
        description: question.description,
        techStack: question.techStack,
        starterFiles: question.starterFiles,
        expectedOutput: question.expectedOutput,
      });

      logger.info('Question created successfully', { questionId: question.id });
      return question;
    } catch (error) {
      logger.error('Error creating question', { error: error.message });
      throw error;
    }
  },

  /**
   * Get a question by ID
   */
  async getQuestionById(id) {
    try {
      const [question] = await db.select().from(questionBank).where(eq(questionBank.id, id));
      return question || null;
    } catch (error) {
      logger.error('Error fetching question by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Get a specific version of a question
   */
  async getQuestionVersion(questionId, version) {
    const [ver] = await db.select().from(questionVersions).where(
      and(eq(questionVersions.questionId, questionId), eq(questionVersions.version, version))
    );
    return ver || null;
  },

  /**
   * Get all questions with filters and pagination
   */
  async getAllQuestions(filters = {}, pagination = {}, sorting = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { sortBy = 'createdAt', sortOrder = 'desc' } = sorting;
      const { difficulty, published, createdBy, search } = filters;

      let conditions = [];

      if (difficulty) {
        conditions.push(eq(questionBank.difficulty, difficulty));
      }
      if (published !== undefined) {
        conditions.push(eq(questionBank.published, published));
      }
      if (createdBy) {
        conditions.push(eq(questionBank.createdBy, createdBy));
      }
      if (search) {
        conditions.push(
          or(
            like(questionBank.title, `%${search}%`),
            like(questionBank.description, `%${search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      let orderByColumn;
      if (sortBy === 'title') orderByColumn = questionBank.title;
      else if (sortBy === 'difficulty') orderByColumn = questionBank.difficulty;
      else orderByColumn = questionBank.createdAt;

      const orderDirection = sortOrder === 'asc' ? asc : desc;

      const questionsList = await db.select().from(questionBank)
        .where(whereClause)
        .orderBy(orderDirection(orderByColumn))
        .limit(take)
        .offset(skip);

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(questionBank).where(whereClause);

      return {
        data: questionsList,
        pagination: {
          page: Math.floor(skip / take) + 1,
          limit: take,
          total: parseInt(count),
          totalPages: Math.ceil(count / take)
        }
      };
    } catch (error) {
      logger.error('Error fetching questions', { error: error.message });
      throw error;
    }
  },

  /**
   * Update a question, auto-incrementing the version and archiving the new version
   */
  async updateQuestion(id, updateData) {
    try {
      const current = await this.getQuestionById(id);
      if (!current) throw new Error('Question not found');

      const newVersion = current.version + 1;

      const [updatedQuestion] = await db
        .update(questionBank)
        .set({ 
          ...updateData, 
          version: newVersion,
          updatedAt: new Date() 
        })
        .where(eq(questionBank.id, id))
        .returning();

      await db.insert(questionVersions).values({
        questionId: id,
        version: newVersion,
        title: updatedQuestion.title,
        description: updatedQuestion.description,
        techStack: updatedQuestion.techStack,
        starterFiles: updatedQuestion.starterFiles,
        expectedOutput: updatedQuestion.expectedOutput,
      });

      logger.info('Question updated successfully', { questionId: id, version: newVersion });
      return updatedQuestion;
    } catch (error) {
      logger.error('Error updating question', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete a question from the bank
   */
  async deleteQuestion(id) {
    try {
      const [deletedQuestion] = await db
        .delete(questionBank)
        .where(eq(questionBank.id, id))
        .returning();
      
      logger.info('Question deleted successfully', { questionId: id });
      return deletedQuestion;
    } catch (error) {
      logger.error('Error deleting question', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Publish question to the question bank
   */
  async publishQuestion(id) {
    const [updated] = await db.update(questionBank).set({ published: true, updatedAt: new Date() }).where(eq(questionBank.id, id)).returning();
    return updated;
  },

  /**
   * Unpublish question from the question bank
   */
  async unpublishQuestion(id) {
    const [updated] = await db.update(questionBank).set({ published: false, updatedAt: new Date() }).where(eq(questionBank.id, id)).returning();
    return updated;
  },

  /**
   * Get progress on a question for a user
   */
  async getUserQuestionProgress(userId, questionId) {
    try {
      const [progress] = await db
        .select()
        .from(questionProgress)
        .where(and(eq(questionProgress.userId, userId), eq(questionProgress.questionId, questionId)));
      
      return progress || null;
    } catch (error) {
      logger.error('Error fetching question progress', { error: error.message, userId, questionId });
      throw error;
    }
  },

  /**
   * Create or update student question progress
   */
  async updateQuestionProgress(userId, questionId, progressData) {
    try {
      const existingProgress = await this.getUserQuestionProgress(userId, questionId);
      
      if (existingProgress) {
        const [updated] = await db
          .update(questionProgress)
          .set({ 
            ...progressData, 
            updatedAt: new Date(),
            attempts: existingProgress.attempts + 1,
            lastAttemptAt: new Date()
          })
          .where(eq(questionProgress.id, existingProgress.id))
          .returning();
        
        return updated;
      } else {
        const [created] = await db
          .insert(questionProgress)
          .values({
            userId,
            questionId,
            ...progressData,
            attempts: 1,
            lastAttemptAt: new Date()
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      logger.error('Error updating question progress', { error: error.message, userId, questionId });
      throw error;
    }
  },

  async getQuestionsByCreator(creatorId, pagination = {}) {
    return this.getAllQuestions({ createdBy: creatorId }, pagination);
  },

  async searchQuestions(searchTerm, filters = {}, pagination = {}) {
    return this.getAllQuestions({ ...filters, search: searchTerm }, pagination);
  }
};
