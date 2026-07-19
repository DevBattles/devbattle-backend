import { authService } from '../services/authService.js';
import { signupSchema, loginSchema, verifyOtpSchema, resendOtpSchema, googleAuthSchema } from '../validation/auth.js';
import { sendSuccess, sendFailure } from '../utils/response.js';
import { userRepository } from '../repositories/userRepository.js';

export const authController = {
  /**
   * Register a new user
   */
  async signup(req, res, next) {
    try {
      const validatedData = signupSchema.parse(req.body);
      const result = await authService.signup(validatedData);
      return sendSuccess(res, 201, result.message, result.user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify email OTP
   */
  async verifyOtp(req, res, next) {
    try {
      const validatedData = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(validatedData);
      return sendSuccess(res, 200, 'Email verified successfully and logged in.', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Resend email OTP
   */
  async resendOtp(req, res, next) {
    try {
      const validatedData = resendOtpSchema.parse(req.body);
      const result = await authService.resendOtp(validatedData);
      return sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log in an existing user
   */
  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      return sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log in / Register with Google Sign-In
   */
  async googleLogin(req, res, next) {
    try {
      const validatedData = googleAuthSchema.parse(req.body);
      const result = await authService.googleLogin(validatedData);
      return sendSuccess(res, 200, 'Google Authentication successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current authenticated user session details
   */
  async getMe(req, res, next) {
    try {
      const user = await userRepository.getFullUserProfile(req.user.id);
      if (!user) {
        return sendFailure(res, 404, 'User session not found');
      }
      const { passwordHash, otpCode, otpExpiresAt, ...safeUser } = user;
      return sendSuccess(res, 200, 'Current session fetched successfully', safeUser);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log out the current user
   */
  async logout(req, res, next) {
    try {
      return sendSuccess(res, 200, 'Logout successful. Please discard your JWT access token.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Switch authenticated user's role
   */
  async switchRole(req, res, next) {
    try {
      const result = await authService.switchRole(req.user.id);
      return sendSuccess(res, 200, 'User role switched successfully', result);
    } catch (error) {
      next(error);
    }
  }
};
