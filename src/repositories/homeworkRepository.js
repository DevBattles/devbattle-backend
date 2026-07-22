import { db } from '../db/index.js';
import { homeworks, homeworkQuestions, homeworkAssignments, homeworkSubmissions, questionBank, users } from '../schema/index.js';
import { eq, and, desc, asc, sql, or } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const homeworkRepository = {
  /**
   * Create a new homework with a list of linked questions
   */
  async createHomework(homeworkData, questionIds = []) {
    try {
      return await db.transaction(async (tx) => {
        const [homework] = await tx.insert(homeworks).values({
          title: homeworkData.title,
          description: homeworkData.description,
          dueDate: new Date(homeworkData.dueDate),
          createdBy: homeworkData.createdBy,
          published: homeworkData.published || false
        }).returning();

        if (questionIds.length > 0) {
          const links = questionIds.map((qId, index) => ({
            homeworkId: homework.id,
            questionId: qId,
            order: index + 1
          }));
          await tx.insert(homeworkQuestions).values(links);
        }

        return homework;
      });
    } catch (error) {
      logger.error('Error creating homework', { error: error.message });
      throw error;
    }
  },

  /**
   * Get homework details, including linked questions
   */
  async getHomeworkById(id) {
    try {
      const [homework] = await db.select().from(homeworks).where(eq(homeworks.id, id));
      if (!homework) return null;

      const questionsList = await db.select({
        question: questionBank,
        order: homeworkQuestions.order
      })
      .from(homeworkQuestions)
      .innerJoin(questionBank, eq(homeworkQuestions.questionId, questionBank.id))
      .where(eq(homeworkQuestions.homeworkId, id))
      .orderBy(asc(homeworkQuestions.order));

      return {
        ...homework,
        questions: questionsList.map(item => item.question)
      };
    } catch (error) {
      logger.error('Error getting homework by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Get list of all homework with filtering and pagination
   */
  async getAllHomework(filters = {}, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { createdBy, published } = filters;

      let conditions = [];
      if (createdBy) conditions.push(eq(homeworks.createdBy, createdBy));
      if (published !== undefined) conditions.push(eq(homeworks.published, published));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const list = await db.select().from(homeworks)
        .where(whereClause)
        .orderBy(desc(homeworks.createdAt))
        .limit(take)
        .offset(skip);

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(homeworks).where(whereClause);

      return {
        data: list,
        pagination: {
          page: Math.floor(skip / take) + 1,
          limit: take,
          total: parseInt(count),
          totalPages: Math.ceil(count / take)
        }
      };
    } catch (error) {
      logger.error('Error getting all homework', { error: error.message });
      throw error;
    }
  },

  /**
   * Update homework attributes and questions
   */
  async updateHomework(id, updateData, questionIds = null) {
    try {
      return await db.transaction(async (tx) => {
        const [updated] = await tx.update(homeworks)
          .set({
            title: updateData.title,
            description: updateData.description,
            dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
            published: updateData.published,
            updatedAt: new Date()
          })
          .where(eq(homeworks.id, id))
          .returning();

        if (questionIds !== null) {
          await tx.delete(homeworkQuestions).where(eq(homeworkQuestions.homeworkId, id));

          if (questionIds.length > 0) {
            const links = questionIds.map((qId, index) => ({
              homeworkId: id,
              questionId: qId,
              order: index + 1
            }));
            await tx.insert(homeworkQuestions).values(links);
          }
        }

        return updated;
      });
    } catch (error) {
      logger.error('Error updating homework', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete homework and related links
   */
  async deleteHomework(id) {
    try {
      const [deleted] = await db.delete(homeworks).where(eq(homeworks.id, id)).returning();
      return deleted;
    } catch (error) {
      logger.error('Error deleting homework', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Assign homework to an individual student or batch
   */
  async assignHomework(homeworkId, assignData, assignedBy) {
    try {
      const value = {
        homeworkId,
        assignedBy,
        studentId: assignData.studentId || null,
        batch: assignData.batch || null,
      };

      const [assignment] = await db.insert(homeworkAssignments).values(value).returning();
      return assignment;
    } catch (error) {
      logger.error('Error assigning homework', { error: error.message, homeworkId });
      throw error;
    }
  },

  /**
   * Get list of homework assigned to student
   */
  async getAssignedHomework(studentId, batch = null, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      
      let queryConditions = [eq(homeworkAssignments.studentId, studentId)];
      if (batch) {
        queryConditions.push(eq(homeworkAssignments.batch, batch));
      }

      const assignedList = await db.select({
        homework: homeworks
      })
      .from(homeworkAssignments)
      .innerJoin(homeworks, eq(homeworkAssignments.homeworkId, homeworks.id))
      .where(or(...queryConditions))
      .orderBy(desc(homeworks.dueDate))
      .limit(take)
      .offset(skip);

      return assignedList.map(item => item.homework);
    } catch (error) {
      logger.error('Error getting assigned homework', { error: error.message, studentId });
      throw error;
    }
  },

  /**
   * Submit homework question solution
   */
  async submitHomework(submissionData) {
    try {
      const [submission] = await db.insert(homeworkSubmissions)
        .values({
          homeworkId: submissionData.homeworkId,
          studentId: submissionData.studentId,
          questionId: submissionData.questionId,
          questionVersion: submissionData.questionVersion,
          files: submissionData.files,
          githubRepo: submissionData.githubRepo,
          livePreview: submissionData.livePreview,
          status: submissionData.status || 'pending',
          score: submissionData.score,
          grade: submissionData.grade,
          feedback: submissionData.feedback,
          report: submissionData.report
        })
        .returning();
      return submission;
    } catch (error) {
      logger.error('Error submitting homework', { error: error.message });
      throw error;
    }
  },

  /**
   * Get all submissions for a homework with filters and pagination
   */
  async getHomeworkSubmissions(homeworkId, filters = {}, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { studentId, questionId, teacherId } = filters;

      let conditions = [];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (homeworkId && uuidRegex.test(homeworkId)) {
        conditions.push(eq(homeworkSubmissions.homeworkId, homeworkId));
      }

      if (studentId) conditions.push(eq(homeworkSubmissions.studentId, studentId));
      if (questionId) conditions.push(eq(homeworkSubmissions.questionId, questionId));
      if (teacherId) conditions.push(eq(homeworks.createdBy, teacherId));

      const list = await db.select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        studentId: homeworkSubmissions.studentId,
        questionId: homeworkSubmissions.questionId,
        questionVersion: homeworkSubmissions.questionVersion,
        files: homeworkSubmissions.files,
        githubRepo: homeworkSubmissions.githubRepo,
        livePreview: homeworkSubmissions.livePreview,
        submittedAt: homeworkSubmissions.submittedAt,
        status: homeworkSubmissions.status,
        score: homeworkSubmissions.score,
        grade: homeworkSubmissions.grade,
        feedback: homeworkSubmissions.feedback,
        report: homeworkSubmissions.report,
        createdAt: homeworkSubmissions.createdAt,
        student: {
          username: users.username,
          email: users.email
        },
        homework: {
          title: homeworks.title
        }
      })
      .from(homeworkSubmissions)
      .leftJoin(users, eq(homeworkSubmissions.studentId, users.id))
      .leftJoin(homeworks, eq(homeworkSubmissions.homeworkId, homeworks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(homeworkSubmissions.submittedAt))
      .limit(take)
      .offset(skip);

      return list;
    } catch (error) {
      logger.error('Error fetching homework submissions', { error: error.message, homeworkId });
      throw error;
    }
  },

  /**
   * Get a student's solution for a specific homework question
   */
  async getStudentHomeworkSubmission(homeworkId, questionId, studentId) {
    try {
      const [submission] = await db.select()
        .from(homeworkSubmissions)
        .where(
          and(
            eq(homeworkSubmissions.homeworkId, homeworkId),
            eq(homeworkSubmissions.questionId, questionId),
            eq(homeworkSubmissions.studentId, studentId)
          )
        );
      return submission || null;
    } catch (error) {
      logger.error('Error fetching student homework submission', { error: error.message, homeworkId, questionId, studentId });
      throw error;
    }
  },

  /**
   * Get submission by ID
   */
  async getHomeworkSubmissionById(id) {
    try {
      const [submission] = await db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.id, id));
      return submission || null;
    } catch (error) {
      logger.error('Error fetching submission by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Update homework submission grading/feedback details
   */
  async updateHomeworkSubmission(id, updateData) {
    try {
      const [updated] = await db.update(homeworkSubmissions)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(homeworkSubmissions.id, id))
        .returning();
      return updated;
    } catch (error) {
      logger.error('Error updating homework submission', { error: error.message, id });
      throw error;
    }
  }
};
