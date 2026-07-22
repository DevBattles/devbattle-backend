import { db } from '../db/index.js';
import { contestSubmissions, homeworkSubmissions, questionProgress, contests, homeworks, questionBank } from '../schema/index.js';
import { eq, desc } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const userHistoryService = {
  async getStudentHistory(studentId) {
    try {
      // 1. Contest Submissions
      const contestSubs = await db.select({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
        contestTitle: contests.title,
        score: contestSubmissions.score,
        grade: contestSubmissions.grade,
        status: contestSubmissions.status,
        submittedAt: contestSubmissions.submittedAt
      })
      .from(contestSubmissions)
      .leftJoin(contests, eq(contestSubmissions.contestId, contests.id))
      .where(eq(contestSubmissions.studentId, studentId))
      .orderBy(desc(contestSubmissions.submittedAt));

      // 2. Homework Submissions
      const hwSubs = await db.select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        homeworkTitle: homeworks.title,
        score: homeworkSubmissions.score,
        grade: homeworkSubmissions.grade,
        status: homeworkSubmissions.status,
        feedback: homeworkSubmissions.feedback,
        submittedAt: homeworkSubmissions.submittedAt
      })
      .from(homeworkSubmissions)
      .leftJoin(homeworks, eq(homeworkSubmissions.homeworkId, homeworks.id))
      .where(eq(homeworkSubmissions.studentId, studentId))
      .orderBy(desc(homeworkSubmissions.submittedAt));

      // 3. Question Bank History
      const qProgress = await db.select({
        id: questionProgress.id,
        questionId: questionProgress.questionId,
        questionTitle: questionBank.title,
        status: questionProgress.status,
        attempts: questionProgress.attempts,
        score: questionProgress.score,
        completedAt: questionProgress.updatedAt
      })
      .from(questionProgress)
      .leftJoin(questionBank, eq(questionProgress.questionId, questionBank.id))
      .where(eq(questionProgress.userId, studentId))
      .orderBy(desc(questionProgress.updatedAt));

      // 4. Calculate Aggregate Statistics
      const allScores = [...contestSubs, ...hwSubs].map(s => s.score).filter(sc => typeof sc === 'number' && !isNaN(sc));
      const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

      return {
        stats: {
          totalContests: contestSubs.length,
          totalHomeworks: hwSubs.length,
          totalQuestionsSolved: qProgress.filter(q => q.status === 'completed').length,
          averageScore: avgScore,
          highestScore: highestScore,
        },
        contests: contestSubs,
        homeworks: hwSubs,
        questionProgress: qProgress
      };
    } catch (error) {
      logger.error('Error fetching student history', { studentId, error: error.message });
      throw error;
    }
  }
};
