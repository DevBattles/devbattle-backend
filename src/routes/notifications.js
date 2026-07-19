import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Authenticated
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all user notifications read
 * @access  Authenticated
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification read by ID
 * @access  Authenticated
 */
router.put('/:id/read', notificationController.markAsRead);

export default router;
