import { db } from '../db/index.js';
import { contests, contestQuestions, contestParticipants, contestSubmissions, questionBank, users } from '../schema/index.js';
import { eq, and, desc, asc, sql, or, isNull } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const contestRepository = {
  /**
   * Create a new contest with questions in a transaction
   */
  async createContest(contestData, questionsList = []) {
    try {
      return await db.transaction(async (tx) => {
        const [contest] = await tx.insert(contests).values({
          title: contestData.title,
          description: contestData.description,
          startTime: new Date(contestData.startTime),
          endTime: new Date(contestData.endTime),
          published: contestData.published || false,
          status: contestData.status || (contestData.published ? 'published' : 'draft'),
          createdBy: contestData.createdBy
        }).returning();

        if (questionsList.length > 0) {
          const links = questionsList.map((q, index) => ({
            contestId: contest.id,
            questionId: q.questionId,
            order: q.order || index + 1,
            points: q.points || 100
          }));
          await tx.insert(contestQuestions).values(links);
        }

        return contest;
      });
    } catch (error) {
      logger.error('Error creating contest', { error: error.message });
      throw error;
    }
  },

  /**
   * Get contest by ID and load associated questions
   */
  async getContestById(id) {
    try {
      const [contest] = await db.select().from(contests).where(eq(contests.id, id));
      if (!contest) return null;

      const qList = await db.select({
        question: questionBank,
        order: contestQuestions.order,
        points: contestQuestions.points
      })
      .from(contestQuestions)
      .innerJoin(questionBank, eq(contestQuestions.questionId, questionBank.id))
      .where(eq(contestQuestions.contestId, id))
      .orderBy(asc(contestQuestions.order));

      return {
        ...contest,
        questions: qList
      };
    } catch (error) {
      logger.error('Error getting contest by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Get all contests with filters
   */
  async getAllContests(filters = {}, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { published, status, createdBy, batch } = filters;

      let conditions = [];
      if (published !== undefined) conditions.push(eq(contests.published, published));
      if (status) conditions.push(eq(contests.status, status));
      if (createdBy) conditions.push(eq(contests.createdBy, createdBy));
      if (batch) {
        conditions.push(
          or(
            eq(contests.batch, batch),
            isNull(contests.batch),
            eq(contests.batch, '')
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const list = await db.select().from(contests)
        .where(whereClause)
        .orderBy(desc(contests.startTime))
        .limit(take)
        .offset(skip);

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(contests).where(whereClause);

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
      logger.error('Error getting all contests', { error: error.message });
      throw error;
    }
  },

  /**
   * Update contest metadata and update question assignments
   */
  async updateContest(id, updateData, questionsList = null) {
    try {
      return await db.transaction(async (tx) => {
        const [updated] = await tx.update(contests)
          .set({
            title: updateData.title,
            description: updateData.description,
            startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
            endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
            published: updateData.published,
            status: updateData.status,
            updatedAt: new Date()
          })
          .where(eq(contests.id, id))
          .returning();

        if (questionsList !== null) {
          await tx.delete(contestQuestions).where(eq(contestQuestions.contestId, id));
          if (questionsList.length > 0) {
            const links = questionsList.map((q, index) => ({
              contestId: id,
              questionId: q.questionId,
              order: q.order || index + 1,
              points: q.points || 100
            }));
            await tx.insert(contestQuestions).values(links);
          }
        }

        return updated;
      });
    } catch (error) {
      logger.error('Error updating contest', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete contest
   */
  async deleteContest(id) {
    try {
      const [deleted] = await db.delete(contests).where(eq(contests.id, id)).returning();
      return deleted;
    } catch (error) {
      logger.error('Error deleting contest', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Register a user to join a contest
   */
  async joinContest(contestId, userId) {
    try {
      const [participant] = await db.insert(contestParticipants).values({
        contestId,
        userId
      }).returning();
      return participant;
    } catch (error) {
      logger.error('Error joining contest', { error: error.message, contestId, userId });
      throw error;
    }
  },

  /**
   * Student starts the contest (timer tracking starts)
   */
  async startContest(contestId, userId) {
    const [updated] = await db.update(contestParticipants)
      .set({ startedAt: new Date() })
      .where(and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.userId, userId)))
      .returning();
    return updated;
  },

  /**
   * Student completes/submits the entire contest
   */
  async completeContest(contestId, userId) {
    const [updated] = await db.update(contestParticipants)
      .set({ completedAt: new Date() })
      .where(and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.userId, userId)))
      .returning();
    return updated;
  },

  /**
   * Check if a user is a participant of a contest
   */
  async isParticipant(contestId, userId) {
    const [participant] = await db.select().from(contestParticipants)
      .where(and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.userId, userId)));
    return participant || null;
  },

  /**
   * Submit contest question solution
   */
  async submitContestAnswer(submissionData) {
    try {
      const [submission] = await db.insert(contestSubmissions)
        .values({
          contestId: submissionData.contestId,
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
      logger.error('Error submitting contest answer', { error: error.message });
      throw error;
    }
  },

  /**
   * Get contest submissions with filters and pagination
   */
  async getContestSubmissions(contestId, filters = {}, pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { studentId, questionId, teacherId } = filters;

      let conditions = [];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (contestId && uuidRegex.test(contestId)) {
        conditions.push(eq(contestSubmissions.contestId, contestId));
      }

      if (studentId) conditions.push(eq(contestSubmissions.studentId, studentId));
      if (questionId) conditions.push(eq(contestSubmissions.questionId, questionId));
      if (teacherId) conditions.push(eq(contests.createdBy, teacherId));

      const list = await db.select({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
        studentId: contestSubmissions.studentId,
        questionId: contestSubmissions.questionId,
        questionVersion: contestSubmissions.questionVersion,
        files: contestSubmissions.files,
        githubRepo: contestSubmissions.githubRepo,
        livePreview: contestSubmissions.livePreview,
        submittedAt: contestSubmissions.submittedAt,
        status: contestSubmissions.status,
        score: contestSubmissions.score,
        grade: contestSubmissions.grade,
        feedback: contestSubmissions.feedback,
        report: contestSubmissions.report,
        createdAt: contestSubmissions.createdAt,
        student: {
          username: users.username,
          email: users.email
        },
        contest: {
          title: contests.title
        }
      })
      .from(contestSubmissions)
      .leftJoin(users, eq(contestSubmissions.studentId, users.id))
      .leftJoin(contests, eq(contestSubmissions.contestId, contests.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contestSubmissions.submittedAt))
      .limit(take)
      .offset(skip);

      return list;
    } catch (error) {
      logger.error('Error getting contest submissions', { error: error.message, contestId });
      throw error;
    }
  },

  /**
   * Get specific submission for a question in a contest by student
   */
  async getStudentContestSubmission(contestId, questionId, studentId) {
    const [submission] = await db.select().from(contestSubmissions).where(
      and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.questionId, questionId),
        eq(contestSubmissions.studentId, studentId)
      )
    );
    return submission || null;
  },

  /**
   * Get contest submission by its ID
   */
  async getContestSubmissionById(id) {
    const [submission] = await db.select().from(contestSubmissions).where(eq(contestSubmissions.id, id));
    return submission || null;
  },

  /**
   * Update contest submission feedback/report details
   */
  async updateContestSubmission(id, updateData) {
    const [updated] = await db.update(contestSubmissions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(contestSubmissions.id, id))
      .returning();
    return updated;
  },

  /**
   * Get list of all registered participants
   */
  async getContestParticipants(contestId) {
    return db.select().from(contestParticipants).where(eq(contestParticipants.contestId, contestId));
  }
};
