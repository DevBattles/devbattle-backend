import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { healthController } from '../controllers/healthController.js';

const router = Router();

// Health check route
router.get('/health', healthController.checkHealth);

// Authentication routes
router.post('/api/auth/signup', authController.signup);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', authController.logout);

export default router;
