import { Router } from 'express';
import { homeworkController } from '../controllers/homeworkController.js';
import { authenticateUser, requireTeacherOrAdmin, requireStudent } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   POST /api/homework
 * @desc    Create a new homework
 * @access  Teacher, Admin
 */
router.post('/', requireTeacherOrAdmin, homeworkController.createHomework);

/**
 * @route   GET /api/homework
 * @desc    Get all homework with filters
 * @access  Teacher, Admin
 */
router.get('/', requireTeacherOrAdmin, parseQuery, homeworkController.getAllHomework);

/**
 * @route   GET /api/homework/assigned
 * @desc    Get homework assigned to current student
 * @access  Student
 */
router.get('/assigned', requireStudent, parseQuery, homeworkController.getAssignedHomework);

/**
 * @route   GET /api/homework/submissions
 * @desc    Get all homework submissions
 * @access  Teacher, Admin
 */
router.get('/submissions', requireTeacherOrAdmin, parseQuery, homeworkController.getHomeworkSubmissions);

/**
 * @route   GET /api/homework/:id
 * @desc    Get homework by ID
 * @access  Student, Teacher, Admin
 */
router.get('/:id', homeworkController.getHomeworkById);

/**
 * @route   PUT /api/homework/:id
 * @desc    Update homework
 * @access  Teacher (creator), Admin
 */
router.put('/:id', requireTeacherOrAdmin, homeworkController.updateHomework);

/**
 * @route   DELETE /api/homework/:id
 * @desc    Delete homework
 * @access  Teacher (creator), Admin
 */
router.delete('/:id', requireTeacherOrAdmin, homeworkController.deleteHomework);

/**
 * @route   POST /api/homework/:id/assign
 * @desc    Assign homework to students/batches
 * @access  Teacher (creator), Admin
 */
router.post('/:id/assign', requireTeacherOrAdmin, homeworkController.assignHomework);

/**
 * @route   POST /api/homework/:homeworkId/submit
 * @desc    Submit homework question solution
 * @access  Student
 */
router.post('/:homeworkId/submit', requireStudent, homeworkController.submitHomework);

/**
 * @route   GET /api/homework/:homeworkId/submissions
 * @desc    Get submissions for a homework
 * @access  Teacher, Admin
 */
router.get('/:homeworkId/submissions', requireTeacherOrAdmin, parseQuery, homeworkController.getHomeworkSubmissions);

/**
 * @route   GET /api/homework/:homeworkId/my-submission
 * @desc    Get student's submission for a homework
 * @access  Student
 */
router.get('/:homeworkId/my-submission', requireStudent, homeworkController.getStudentHomeworkSubmission);

/**
 * @route   GET /api/homework/submissions/:id
 * @desc    Get homework submission by ID
 * @access  Student (own), Teacher, Admin
 */
router.get('/submissions/:id', homeworkController.getHomeworkSubmissionById);

/**
 * @route   PUT /api/homework/submissions/:id
 * @desc    Update/Grade homework submission
 * @access  Teacher, Admin
 */
router.put('/submissions/:id', requireTeacherOrAdmin, homeworkController.updateHomeworkSubmission);

export default router;
