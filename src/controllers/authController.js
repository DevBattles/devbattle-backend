import { authService } from '../services/authService.js';
import { signupSchema, loginSchema } from '../validation/auth.js';
import { sendSuccess } from '../utils/response.js';

export const authController = {
  /**
   * Register a new user
   */
  async signup(req, res, next) {
    try {
      // Validate request body
      const validatedData = signupSchema.parse(req.body);

      // Call auth service
      const result = await authService.signup(validatedData);

      return sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log in an existing user
   */
  async login(req, res, next) {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Call auth service
      const result = await authService.login(validatedData);

      return sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log out the current user
   */
  async logout(req, res, next) {
    try {
      // Prepare for refresh-token implementation later.
      // E.g., when refresh token logic is added, we would clear cookies/database records here.
      // const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      // if (refreshToken) { await authService.revokeRefreshToken(refreshToken); }
      // res.clearCookie('refreshToken');

      return sendSuccess(res, 200, 'Logout successful. Please discard your JWT access token.');
    } catch (error) {
      next(error);
    }
  }
};
