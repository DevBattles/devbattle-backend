import { certificateRepository } from '../repositories/certificateRepository.js';
import { notificationService } from './notificationService.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';

export const certificateService = {
  /**
   * Generate certificate with unique verification code and download URL
   */
  async generateCertificate(userId, type, title, description, issuedBy, metadata = {}) {
    try {
      const verificationCode = `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const downloadUrl = `https://devbattles.com/api/certificates/download/${verificationCode}`;

      const certificate = await certificateRepository.createCertificate({
        userId,
        type,
        title,
        description,
        issuedBy,
        downloadUrl,
        verificationCode,
        metadata
      });

      await notificationService.createNotification({
        userId,
        title: 'Certificate Issued!',
        message: `Congratulations! A certificate "${title}" has been issued to you. Verification Code: ${verificationCode}`,
        type: 'certificate_issued',
        metadata: { certificateId: certificate.id, verificationCode }
      });

      return certificate;
    } catch (error) {
      logger.error('Error generating certificate', { userId, title, error: error.message });
      throw error;
    }
  },

  /**
   * Get student's certificates
   */
  async getUserCertificates(userId) {
    return await certificateRepository.getUserCertificates(userId);
  },

  /**
   * Public/admin verification check of verificationCode
   */
  async verifyCertificate(code) {
    const result = await certificateRepository.verifyCertificate(code);
    if (!result) throw new AppError('Certificate not found or verification code is invalid', 404);
    return result;
  },

  /**
   * Admin lists all certificates
   */
  async getAllCertificates(pagination = {}) {
    return await certificateRepository.getAllCertificates(pagination);
  }
};
