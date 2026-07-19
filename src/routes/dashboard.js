import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticateUser, requireStudent, requireTeacher, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/dashboard/student
 * @desc    Get student dashboard details
 * @access  Student
 */
router.get('/student', requireStudent, dashboardController.getStudentDashboard);

/**
 * @route   GET /api/dashboard/teacher
 * @desc    Get teacher dashboard details
 * @access  Teacher
 */
router.get('/teacher', requireTeacher, dashboardController.getTeacherDashboard);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard details
 * @access  Admin
 */
router.get('/admin', requireAdmin, dashboardController.getAdminDashboard);

export default router;
