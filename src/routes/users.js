import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { userController } from '../controllers/userController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/avatars';
    // Ensure directory exists
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

import { userHistoryController } from '../controllers/userHistoryController.js';

router.use(authenticateUser);

/**
 * @route   GET /api/users/history
 * @desc    Get student aggregated performance and submission history
 * @access  Private (Student)
 */
router.get('/history', userHistoryController.getStudentHistory);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getProfile);

/**
 * @route   PUT /api/users/me/profile
 * @desc    Update current user profile (bio, location, website)
 * @access  Private
 */
router.put('/me/profile', userController.updateProfile);

/**
 * @route   PUT /api/users/me/settings
 * @desc    Update user preferences/settings
 * @access  Private
 */
router.put('/me/settings', userController.updateSettings);

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

/**
 * @route   POST /api/users/me/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/me/change-password', userController.changePassword);

export default router;
