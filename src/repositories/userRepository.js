import { db } from '../db/index.js';
import { users } from '../schema/users.js';
import { eq } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const userRepository = {
  /**
   * Find a user by their email address
   * @param {string} email 
   * @returns {object|null}
   */
  async findByEmail(email) {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error('Database error in userRepository.findByEmail', { email, error: error.message });
      throw error;
    }
  },

  /**
   * Find a user by their username
   * @param {string} username 
   * @returns {object|null}
   */
  async findByUsername(username) {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error('Database error in userRepository.findByUsername', { username, error: error.message });
      throw error;
    }
  },

  /**
   * Find a user by their ID
   * @param {string} id 
   * @returns {object|null}
   */
  async findById(id) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error('Database error in userRepository.findById', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new user in the database
   * @param {object} userData - { username, email, passwordHash, role }
   * @returns {object} Created user
   */
  async createUser(userData) {
    try {
      const result = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      logger.error('Database error in userRepository.createUser', { username: userData.username, email: userData.email, error: error.message });
      throw error;
    }
  }
};
