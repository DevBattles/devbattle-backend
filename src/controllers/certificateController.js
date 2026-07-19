import { certificateService } from '../services/certificateService.js';
import { sendSuccess } from '../utils/response.js';

export const certificateController = {
  /**
   * Teacher/admin issues a certificate to a student
   */
  async generateCertificate(req, res, next) {
    try {
      const { userId, type, title, description, metadata } = req.body;
      const cert = await certificateService.generateCertificate(userId, type, title, description, req.user.id, metadata);
      return sendSuccess(res, 201, 'Certificate generated successfully', cert);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch current logged in student's certificates
   */
  async getUserCertificates(req, res, next) {
    try {
      const list = await certificateService.getUserCertificates(req.user.id);
      return sendSuccess(res, 200, 'User certificates retrieved successfully', list);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify certificate verificationCode
   */
  async verifyCertificate(req, res, next) {
    try {
      const { code } = req.params;
      const cert = await certificateService.verifyCertificate(code);
      return sendSuccess(res, 200, 'Certificate verification successful', cert);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Download certificate (simulate redirecting or returning the download link)
   */
  async downloadCertificate(req, res, next) {
    try {
      const { code } = req.params;
      const cert = await certificateService.verifyCertificate(code);
      return res.status(200).json({
        success: true,
        message: 'Certificate download url generated',
        data: { downloadUrl: cert.certificate.downloadUrl, cert }
      });
    } catch (error) {
      next(error);
    }
  }
};
