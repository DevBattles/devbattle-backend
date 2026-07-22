import { Router } from 'express';
import { batchController } from '../controllers/batchController.js';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, requireTeacherOrAdmin, requireStudent } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/batches/colleges-departments
 * @desc    Get colleges and departments
 * @access  Teacher, Admin
 */
router.get('/colleges-departments', requireTeacherOrAdmin, adminController.getCollegesAndDepartments);

/**
 * @route   GET /api/batches
 * @desc    Get all student batches
 * @access  Teacher, Admin
 */
router.get('/', requireTeacherOrAdmin, parseQuery, batchController.getAllBatches);

/**
 * @route   POST /api/batches
 * @desc    Create a new batch
 * @access  Teacher, Admin
 */
router.post('/', requireTeacherOrAdmin, batchController.createBatch);

/**
 * @route   DELETE /api/batches/:id
 * @desc    Delete a batch
 * @access  Teacher, Admin
 */
router.delete('/:id', requireTeacherOrAdmin, batchController.deleteBatch);

/**
 * @route   GET /api/batches/students/pending
 * @desc    Get registered student accounts pending batch assignment (no profile yet)
 * @access  Teacher, Admin
 */
router.get('/students/pending', requireTeacherOrAdmin, batchController.getPendingStudents);

/**
 * @route   POST /api/batches/:batchId/enroll
 * @desc    Enroll student in a batch (create/update student profile)
 * @access  Teacher, Admin
 */
router.post('/:batchId/enroll', requireTeacherOrAdmin, batchController.enrollStudent);

/**
 * @route   POST /api/batches/:batchId/unenroll
 * @desc    Remove student from a batch (delete student profile)
 * @access  Teacher, Admin
 */
router.post('/:batchId/unenroll', requireTeacherOrAdmin, batchController.unenrollStudent);

/**
 * @route   GET /api/batches/join-requests
 * @desc    Get pending join requests for teacher's batches
 * @access  Teacher, Admin
 */
router.get('/join-requests', requireTeacherOrAdmin, batchController.getJoinRequests);

/**
 * @route   POST /api/batches/join-requests/:requestId/accept
 * @desc    Accept a student's batch join request
 * @access  Teacher, Admin
 */
router.post('/join-requests/:requestId/accept', requireTeacherOrAdmin, batchController.acceptJoinRequest);

/**
 * @route   POST /api/batches/join-requests/:requestId/reject
 * @desc    Reject a student's batch join request
 * @access  Teacher, Admin
 */
router.post('/join-requests/:requestId/reject', requireTeacherOrAdmin, batchController.rejectJoinRequest);

/**
 * @route   GET /api/batches/my-join-requests
 * @desc    Get current student's pending join requests
 * @access  Student
 */
router.get('/my-join-requests', requireStudent, batchController.getStudentJoinRequests);

/**
 * @route   POST /api/batches/join
 * @desc    Student submits join batch request using a join code
 * @access  Student
 */
router.post('/join', requireStudent, batchController.joinBatchByCode);

/**
 * @route   POST /api/batches/:id/regenerate-code
 * @desc    Regenerate batch join code
 * @access  Teacher, Admin
 */
router.post('/:id/regenerate-code', requireTeacherOrAdmin, batchController.regenerateJoinCode);

/**
 * @route   GET /api/batches/:batchId/students
 * @desc    Get all students enrolled in a batch
 * @access  Teacher, Admin
 */
router.get('/:batchId/students', requireTeacherOrAdmin, batchController.getStudentsInBatch);

export default router;
