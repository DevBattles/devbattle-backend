import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser, requireAdmin);

/**
 * @route   PUT /api/admin/teachers/:id/approve
 * @desc    Approve/Unapprove teacher accounts
 * @access  Admin
 */
router.put('/teachers/:id/approve', adminController.approveTeacherAccount);

/**
 * @route   POST /api/admin/colleges
 * @desc    Create new college
 * @access  Admin
 */
router.post('/colleges', adminController.createCollege);

/**
 * @route   POST /api/admin/departments
 * @desc    Create new department in college
 * @access  Admin
 */
router.post('/departments', adminController.createDepartment);

/**
 * @route   GET /api/admin/colleges-departments
 * @desc    Get all colleges and departments list
 * @access  Admin
 */
router.get('/colleges-departments', adminController.getCollegesAndDepartments);

/**
 * @route   GET /api/admin/pending-teachers
 * @desc    List pending teacher approvals
 * @access  Admin
 */
router.get('/pending-teachers', adminController.getPendingTeachers);

/**
 * @route   GET /api/admin/teachers
 * @desc    List all teachers
 * @access  Admin
 */
router.get('/teachers', parseQuery, adminController.getAllTeachers);

/**
 * @route   GET /api/admin/students/without-batch
 * @desc    List registered students who have not joined any batch
 * @access  Admin
 */
router.get('/students/without-batch', adminController.getStudentsWithoutBatch);

/**
 * @route   GET /api/admin/students
 * @desc    List all students
 * @access  Admin
 */
router.get('/students', parseQuery, adminController.getAllStudents);

export default router;
