import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { generateToken } from '../auth/jwt.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import { emailService } from './emailService.js';
import { env } from '../config/env.js';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { batches, studentProfiles } from '../schema/index.js';
import { eq } from 'drizzle-orm';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authService = {
  /**
   * Helper to verify Google OAuth ID Token
   * @param {string} token - Google ID Token
   */
  async verifyGoogleIdToken(token) {
    try {
      if (!env.GOOGLE_CLIENT_ID) {
        logger.warn('GOOGLE_CLIENT_ID not configured in .env. Falling back to mock Google token parsing.');
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          return {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            sub: payload.sub || 'mock-google-id-' + Date.now(),
          };
        }
        throw new Error('Invalid token structure in mock mode.');
      }
      
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
      };
    } catch (error) {
      logger.error('Google ID token verification failed', { error: error.message });
      throw new AppError('Google token verification failed', 401);
    }
  },

  /**
   * Register a new user and send OTP
   * @param {object} userData - { username, email, password, role }
   * @returns {object} { user, message }
   */
  async signup(userData) {
    const { username, email, password, role, joinCode } = userData;

    // Check optional join code for student registration
    let targetBatch = null;
    if (joinCode) {
      if (role !== 'student') {
        throw new AppError('Only students can register with a batch join code', 400);
      }
      const [batch] = await db.select().from(batches).where(eq(batches.joinCode, joinCode.toUpperCase().trim()));
      if (!batch) {
        throw new AppError('Invalid join code: Batch not found', 400);
      }
      targetBatch = batch;
    }

    // Check email uniqueness
    const existingEmail = await userRepository.findByEmail(email);
    
    // Check username uniqueness
    const existingUsername = await userRepository.findByUsername(username);

    if (existingEmail) {
      // If the email is already registered and verified, block signup
      if (existingEmail.isEmailVerified) {
        logger.warn('Signup attempt failed: Email already exists', { email });
        throw new AppError('Email is already registered', 400);
      }

      // If the email is registered but NOT verified, we can reuse it!
      logger.info('Reusing unverified email for signup registration', { email });

      // Check if username is taken by ANOTHER user
      if (existingUsername && existingUsername.email !== email) {
        logger.warn('Signup attempt failed: Username already exists for another user', { username });
        throw new AppError('Username is already taken', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Update user details
      const updatedUser = await userRepository.updateUserProfile(existingEmail.id, {
        username,
        passwordHash,
        role,
        otpCode,
        otpExpiresAt,
        otpLastSentAt: new Date(),
      });

      // Handle student batch join pre-enrollment updates if joinCode is provided
      if (role === 'student' && targetBatch) {
        // Delete old profile if exists
        await db.delete(studentProfiles).where(eq(studentProfiles.userId, updatedUser.id));
        // Insert new profile linked to batch
        await db.insert(studentProfiles).values({
          userId: updatedUser.id,
          batch: targetBatch.name,
          collegeId: targetBatch.collegeId,
          departmentId: targetBatch.departmentId,
        });
      }

      // Try sending OTP
      try {
        await emailService.sendOtpEmail(email, otpCode);
      } catch (err) {
        logger.error('Failed to send OTP to unverified user on retry', { email, error: err.message });
        throw new AppError(`Failed to send email: ${err.message}. (Developers: check backend console for OTP code)`, 500);
      }

      const { passwordHash: _, otpCode: __, otpExpiresAt: ___, ...safeUser } = updatedUser;
      return {
        user: safeUser,
        message: 'Verification OTP has been resent. Please verify your email within 5 minutes.'
      };
    }

    // If new email, check username uniqueness
    if (existingUsername) {
      logger.warn('Signup attempt failed: Username already exists', { username });
      throw new AppError('Username is already taken', 400);
    }

    // Hash password with salt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save user (as unverified)
    const newUser = await userRepository.createUser({
      username,
      email,
      passwordHash,
      role,
      isEmailVerified: false,
      otpCode,
      otpExpiresAt,
      otpLastSentAt: new Date(),
    });

    // Enroll student in batch if targetBatch is resolved
    if (targetBatch) {
      await db.insert(studentProfiles).values({
        userId: newUser.id,
        batch: targetBatch.name,
        collegeId: targetBatch.collegeId,
        departmentId: targetBatch.departmentId,
      });
      logger.info('Student pre-enrolled in batch via registration join code', { userId: newUser.id, batch: targetBatch.name });
    }

    // Send OTP email
    try {
      await emailService.sendOtpEmail(email, otpCode);
    } catch (err) {
      logger.error('Failed to send OTP to new user on signup', { email, error: err.message });
      // Delete the created unverified user so they can start clean
      await db.delete(users).where(eq(users.id, newUser.id));
      throw new AppError(`Failed to send email: ${err.message}. (Developers: check backend console for OTP code)`, 500);
    }

    logger.info('User signed up successfully, OTP verification email triggered', { userId: newUser.id, username, role });
    
    // Remove password and OTP details from returned user object
    const { passwordHash: _, otpCode: __, otpExpiresAt: ___, ...safeUser } = newUser;

    return {
      user: safeUser,
      message: 'Verification OTP has been sent to your email. Please verify your email within 5 minutes.'
    };
  },

  /**
   * Verify registration OTP
   * @param {object} params - { email, otp }
   * @returns {object} { user, token }
   */
  async verifyOtp({ email, otp }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new AppError('Invalid OTP code', 400);
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new AppError('OTP has expired', 400);
    }

    // Mark email as verified and clear OTP
    const updatedUser = await userRepository.updateUserProfile(user.id, {
      isEmailVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    // Generate JWT
    const token = generateToken(updatedUser);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    logger.info('User verified email and logged in successfully', { userId: updatedUser.id, email });
    return {
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * Resend verification OTP
   * @param {object} params - { email }
   * @returns {object} { message }
   */
  async resendOtp({ email }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Enforce 60 seconds cooldown limit
    if (user.otpLastSentAt) {
      const timeDiff = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (timeDiff < 60 * 1000) {
        const secondsLeft = Math.ceil((60 * 1000 - timeDiff) / 1000);
        throw new AppError(`Please wait ${secondsLeft} seconds before requesting a new OTP.`, 429);
      }
    }

    // Generate a new secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update DB
    await userRepository.updateUserProfile(user.id, {
      otpCode,
      otpExpiresAt,
      otpLastSentAt: new Date(),
    });

    // Send new email
    await emailService.sendOtpEmail(email, otpCode);

    logger.info('OTP resent successfully', { userId: user.id, email });
    return { message: 'A new OTP has been successfully sent to your email.' };
  },

  /**
   * Log in an existing user
   * @param {object} credentials - { email, password }
   * @returns {object} { user, token }
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn('Login attempt failed: Email not found', { email });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account was registered via Google Sign-In (no password set)
    if (!user.passwordHash) {
      logger.warn('Login attempt failed: Email registered via Google Auth', { email });
      throw new AppError('This account was created using Google Sign-In. Please click Continue with Google.', 400);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt failed: Incorrect password', { email, userId: user.id });
      throw new AppError('Invalid email or password', 401);
    }

    // Check email verification status
    if (!user.isEmailVerified) {
      logger.warn('Login attempt failed: Email not verified', { email, userId: user.id });
      throw new AppError('Email is not verified. Please verify your email first.', 403);
    }

    // Generate JWT
    const token = generateToken(user);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', { userId: user.id, email, role: user.role });
    return {
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * Authenticate / Create user via Google OAuth 2.0
   * @param {object} params - { token }
   * @returns {object} { user, token }
   */
  async googleLogin({ token }) {
    const googlePayload = await this.verifyGoogleIdToken(token);
    const { email, name, sub: googleId } = googlePayload;

    // 1. Search by Google ID
    let user = await userRepository.findByGoogleId(googleId);
    
    // 2. If not found by googleId, search by email
    if (!user) {
      user = await userRepository.findByEmail(email);
      if (user) {
        // Link Google ID to existing user account and auto-verify
        user = await userRepository.updateUserProfile(user.id, {
          googleId,
          isEmailVerified: true,
        });
        logger.info('Linked Google Sign-In with existing email', { userId: user.id, email });
      }
    }

    // 3. Create a new user if it does not exist
    if (!user) {
      // Make unique username from google name or email prefix
      let baseUsername = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : email.split('@')[0];
      if (baseUsername.length < 3) baseUsername += 'user';
      
      let username = baseUsername;
      let suffix = 1;
      while (await userRepository.findByUsername(username)) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = await userRepository.createUser({
        username,
        email,
        passwordHash: null,
        role: 'student', // Default role
        isEmailVerified: true, // Google emails are pre-verified
        googleId,
      });
      logger.info('Created new account via Google Sign-In', { userId: user.id, email, username });
    }

    // Generate standard authentication JWT
    const jwtToken = generateToken(user);

    // Strip secrets from user response
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      token: jwtToken,
    };
  },

  /**
   * Switch user role between student and teacher
   */
  async switchRole(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.role === 'admin') {
        throw new AppError('Admin role cannot be switched', 403);
      }

      const newRole = user.role === 'student' ? 'teacher' : 'student';

      // Update role in DB
      const updatedUser = await userRepository.updateUserProfile(userId, {
        role: newRole,
        updatedAt: new Date()
      });

      // Generate a new JWT reflecting the updated role
      const token = generateToken(updatedUser);

      // Remove passwordHash from user object
      const { passwordHash: _, ...safeUser } = updatedUser;

      logger.info('User switched role successfully', { userId, oldRole: user.role, newRole });

      return {
        user: safeUser,
        token
      };
    } catch (error) {
      logger.error('Error switching user role', { userId, error: error.message });
      throw error;
    }
  }
};
