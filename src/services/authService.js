import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { generateToken } from '../auth/jwt.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';

export const authService = {
  /**
   * Register a new user
   * @param {object} userData - { username, email, password, role }
   * @returns {object} { user: { id, username, email, role, createdAt, updatedAt }, token }
   */
  async signup(userData) {
    const { username, email, password, role } = userData;

    // Check username uniqueness
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      logger.warn('Signup attempt failed: Username already exists', { username });
      throw new AppError('Username is already taken', 400);
    }

    // Check email uniqueness
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      logger.warn('Signup attempt failed: Email already exists', { email });
      throw new AppError('Email is already registered', 400);
    }

    // Hash password with salt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await userRepository.createUser({
      username,
      email,
      passwordHash,
      role,
    });

    // Generate JWT
    const token = generateToken(newUser);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    logger.info('User signed up successfully', { userId: newUser.id, username, role });
    return {
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * Log in an existing user
   * @param {object} credentials - { email, password }
   * @returns {object} { user: { id, username, email, role, createdAt, updatedAt }, token }
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn('Login attempt failed: Email not found', { email });
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt failed: Incorrect password', { email, userId: user.id });
      throw new AppError('Invalid email or password', 401);
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
  }
};
