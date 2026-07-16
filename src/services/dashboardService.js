import { homeworkRepository } from '../repositories/homeworkRepository.js';
import { contestRepository } from '../repositories/contestRepository.js';
import { questionRepository } from '../repositories/questionRepository.js';
import { leaderboardRepository } from '../repositories/leaderboardRepository.js';
import { certificateRepository } from '../repositories/certificateRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { analyticsRepository } from '../repositories/analyticsRepository.js';
import { db } from '../db/index.js';
import { users, homeworkSubmissions, contestSubmissions, questionBank } from '../schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const dashboardService = {
  /**
   * Aggregate metrics and notifications for student dashboard
   */
  async getStudentDashboard(studentId) {
    try {
      const homeworks = await homeworkRepository.getAssignedHomework(studentId, null, { take: 5 });
      const upcomingHomeworks = homeworks.filter(h => new Date(h.dueDate) > new Date());

      const contestsResult = await contestRepository.getAllContests({ published: true, status: 'published' }, { take: 5 });
      const upcomingContests = contestsResult.data.filter(c => new Date(c.startTime) > new Date());

      const [{ totalQuestions }] = await db.select({ totalQuestions: sql`count(*)` }).from(questionBank);
      const completedProgress = await db.select({ completed: sql`count(*)` }).from(sql`question_progress`).where(
        and(eq(sql`user_id`, studentId), eq(sql`status`, 'completed'))
      );
      const solvedCount = completedProgress[0] ? parseInt(completedProgress[0].completed) : 0;

      const recentHomeworkSubmission = await db.select().from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.studentId, studentId))
        .orderBy(sql`submitted_at desc`)
        .limit(1);

      const studentCertificates = await certificateRepository.getUserCertificates(studentId);

      const unreadNotifications = await notificationRepository.getUserNotifications(studentId, true);

      const globalLeaderboard = await leaderboardRepository.getLeaderboard('global', null, { take: 1000 });
      const userRankRecord = globalLeaderboard.find(item => item.user.id === studentId);
      const rank = userRankRecord ? userRankRecord.rank : 'Unranked';

      return {
        upcomingHomework: upcomingHomeworks,
        upcomingContests: upcomingContests,
        questionBankProgress: {
          solved: solvedCount,
          total: parseInt(totalQuestions || 0),
          percentage: totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0
        },
        recentSubmission: recentHomeworkSubmission[0] || null,
        certificatesCount: studentCertificates.length,
        unreadNotificationsCount: unreadNotifications.length,
        leaderboardPosition: rank
      };
    } catch (error) {
      logger.error('Error fetching student dashboard data', { studentId, error: error.message });
      throw error;
    }
  },

  /**
   * Aggregate metrics, student charts, and review counters for teacher dashboard
   */
  async getTeacherDashboard(teacherId) {
    try {
      const students = await userRepository.getAllStudents(0, 1000);
      const totalStudentsCount = students.length;

      const hwResult = await homeworkRepository.getAllHomework({ createdBy: teacherId }, { take: 1000 });
      const totalHomeworkCreated = hwResult.data.length;

      const contestResult = await contestRepository.getAllContests({ createdBy: teacherId }, { take: 1000 });
      const totalContestsCreated = contestResult.data.length;

      const [{ pendingHwCount }] = await db.select({ pendingHwCount: sql`count(*)` }).from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.status, 'pending'));
      const [{ pendingContestCount }] = await db.select({ pendingContestCount: sql`count(*)` }).from(contestSubmissions)
        .where(eq(contestSubmissions.status, 'pending'));
      const totalPendingReviews = parseInt(pendingHwCount || 0) + parseInt(pendingContestCount || 0);

      const qResult = await questionRepository.getAllQuestions({ createdBy: teacherId }, { take: 1000 });
      const questionsInBank = qResult.data.length;

      const topStudents = await leaderboardRepository.getLeaderboard('global', null, { take: 5 });

      const aggregateStats = await analyticsRepository.getAggregateStats();

      return {
        totalStudents: totalStudentsCount,
        homeworkCreated: totalHomeworkCreated,
        contestsCreated: totalContestsCreated,
        pendingReviews: totalPendingReviews,
        questionBankCount: questionsInBank,
        leaderboard: topStudents,
        analytics: aggregateStats
      };
    } catch (error) {
      logger.error('Error fetching teacher dashboard data', { teacherId, error: error.message });
      throw error;
    }
  },

  /**
   * Aggregate metrics and unapproved teachers for admin dashboard
   */
  async getAdminDashboard() {
    try {
      const aggregateStats = await analyticsRepository.getAggregateStats();
      
      const pendingTeachers = await db.select().from(users).where(
        and(eq(users.role, 'teacher'), eq(users.isApproved, false))
      );

      return {
        analytics: aggregateStats,
        pendingTeachersApprovalCount: pendingTeachers.length,
        pendingTeachersList: pendingTeachers.map(u => ({ id: u.id, username: u.username, email: u.email }))
      };
    } catch (error) {
      logger.error('Error fetching admin dashboard data', { error: error.message });
      throw error;
    }
  }
};
