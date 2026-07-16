import { Router } from 'express';
import { certificateController } from '../controllers/certificateController.js';
import { authenticateUser, requireTeacherOrAdmin, requireStudent } from '../middleware/auth.js';

const router = Router();

// Public endpoints for sharing certificates
router.get('/verify/:code', certificateController.verifyCertificate);
router.get('/download/:code', certificateController.downloadCertificate);

// Authenticated endpoints
router.use(authenticateUser);

/**
 * @route   POST /api/certificates
 * @desc    Generate/issue certificate to a student
 * @access  Teacher, Admin
 */
router.post('/', requireTeacherOrAdmin, certificateController.generateCertificate);

/**
 * @route   GET /api/certificates
 * @desc    Get certificates for the current student
 * @access  Student
 */
router.get('/', requireStudent, certificateController.getUserCertificates);

export default router;
