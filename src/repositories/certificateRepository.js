import { db } from '../db/index.js';
import { certificates, users } from '../schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const certificateRepository = {
  /**
   * Create a new certificate record
   */
  async createCertificate(data) {
    try {
      const [cert] = await db.insert(certificates).values(data).returning();
      return cert;
    } catch (error) {
      logger.error('Error creating certificate', { error: error.message });
      throw error;
    }
  },

  /**
   * Get a certificate by ID
   */
  async getCertificateById(id) {
    try {
      const [cert] = await db.select().from(certificates).where(eq(certificates.id, id));
      return cert || null;
    } catch (error) {
      logger.error('Error getting certificate by ID', { id, error: error.message });
      throw error;
    }
  },

  /**
   * List all certificates for a student
   */
  async getUserCertificates(userId) {
    try {
      return await db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issueDate));
    } catch (error) {
      logger.error('Error getting user certificates', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Verification check by unique verificationCode string
   */
  async verifyCertificate(verificationCode) {
    try {
      const [result] = await db.select({
        certificate: certificates,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .where(eq(certificates.verificationCode, verificationCode));
      
      return result || null;
    } catch (error) {
      logger.error('Error verifying certificate', { verificationCode, error: error.message });
      throw error;
    }
  },

  /**
   * Admin list all certificates
   */
  async getAllCertificates(pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const list = await db.select().from(certificates).orderBy(desc(certificates.issueDate)).limit(take).offset(skip);
      const [{ count }] = await db.select({ count: sql`count(*)` }).from(certificates);
      return {
        data: list,
        total: parseInt(count)
      };
    } catch (error) {
      logger.error('Error listing all certificates', { error: error.message });
      throw error;
    }
  }
};
