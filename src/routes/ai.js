import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All AI endpoints require login authentication
router.use(authenticateUser);

/**
 * @route   POST /api/ai/mentor/chat
 * @desc    Get AI coding mentor response
 * @access  Student, Teacher
 */
router.post('/mentor/chat', aiController.mentorChat);

export default router;
