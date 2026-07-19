import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { healthController } from '../controllers/healthController.js';
import questionRoutes from './questions.js';
import homeworkRoutes from './homework.js';
import contestRoutes from './contests.js';
import workspaceRoutes from './workspace.js';
import leaderboardRoutes from './leaderboard.js';
import certificateRoutes from './certificates.js';
import notificationRoutes from './notifications.js';
import dashboardRoutes from './dashboard.js';
import adminRoutes from './admin.js';
import aiRoutes from './ai.js';
import batchRoutes from './batches.js';
import usersRoutes from './users.js';

const router = Router();

// Health check route
router.get('/health', healthController.checkHealth);

// Authentication routes
router.post('/api/auth/signup', authController.signup);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', authController.logout);

// Question Bank routes
router.use('/api/questions', questionRoutes);

// Homework routes
router.use('/api/homework', homeworkRoutes);

// Contest routes
router.use('/api/contests', contestRoutes);

// Workspace routes
router.use('/api/workspace', workspaceRoutes);

// Leaderboard routes
router.use('/api/leaderboards', leaderboardRoutes);

// Certificate routes
router.use('/api/certificates', certificateRoutes);

// Notification routes
router.use('/api/notifications', notificationRoutes);

// Dashboard routes
router.use('/api/dashboard', dashboardRoutes);

// Admin routes
router.use('/api/admin', adminRoutes);

// AI features routes
router.use('/api/ai', aiRoutes);

// Batch management routes
router.use('/api/batches', batchRoutes);

// User profile and settings routes
router.use('/api/users', usersRoutes);

export default router;
