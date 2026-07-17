import { Router } from 'express';
import { batchController } from '../controllers/batchController.js';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, requireTeacherOrAdmin } from '../middleware/auth.js';
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

export default router;
