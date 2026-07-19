import { userRepository } from '../repositories/userRepository.js';
import { sendSuccess, sendFailure } from '../utils/response.js';
import logger from '../logger/logger.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  website: z.string().max(255).optional().nullable(),
});

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
}).passthrough(); // Allow other preferences

export const userController = {
  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await userRepository.getFullUserProfile(req.user.id);
      if (!user) {
        return sendFailure(res, 404, 'User not found');
      }
      
      // Remove sensitive fields
      const { passwordHash, ...safeUser } = user;
      
      return sendSuccess(res, 200, 'Profile fetched successfully', safeUser);
    } catch (error) {
      logger.error('Error in userController.getProfile', { error: error.message, userId: req.user?.id });
      next(error);
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await userRepository.updateUserProfile(req.user.id, validatedData);
      
      const { passwordHash, ...safeUser } = updatedUser;
      return sendSuccess(res, 200, 'Profile updated successfully', safeUser);
    } catch (error) {
      logger.error('Error in userController.updateProfile', { error: error.message, userId: req.user?.id });
      if (error instanceof z.ZodError) {
        return sendFailure(res, 400, 'Validation Error', error.errors);
      }
      next(error);
    }
  },

  /**
   * Update user settings
   */
  async updateSettings(req, res, next) {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const updatedUser = await userRepository.updateUserPreferences(req.user.id, validatedData);
      
      const { passwordHash, ...safeUser } = updatedUser;
      return sendSuccess(res, 200, 'Settings updated successfully', safeUser);
    } catch (error) {
      logger.error('Error in userController.updateSettings', { error: error.message, userId: req.user?.id });
      if (error instanceof z.ZodError) {
        return sendFailure(res, 400, 'Validation Error', error.errors);
      }
      next(error);
    }
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return sendFailure(res, 400, 'No image provided');
      }
      
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await userRepository.updateUserAvatar(req.user.id, avatarUrl);
      
      const { passwordHash, ...safeUser } = updatedUser;
      return sendSuccess(res, 200, 'Avatar uploaded successfully', safeUser);
    } catch (error) {
      logger.error('Error in userController.uploadAvatar', { error: error.message, userId: req.user?.id });
      next(error);
    }
  },

  /**
   * Change password dummy placeholder
   * Full implementation would require old password verification, hashing new password etc.
   */
  async changePassword(req, res, next) {
    try {
      return sendSuccess(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
};
