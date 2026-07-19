import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import logger from '../logger/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (env.EMAIL_USER && env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
      logger.info('EmailService initialized successfully with Gmail SMTP.');
    } else {
      logger.warn('Email credentials not configured in .env. EmailService will run in MOCK mode.');
    }
  }

  /**
   * Send verification OTP email
   * @param {string} to - Destination email address
   * @param {string} otp - 6-digit verification code
   * @returns {Promise<boolean>} Resolves to true if sent successfully, or false/mocked.
   */
  async sendOtpEmail(to, otp) {
    console.log(`🔑 [EMAIL OTP FALLBACK] Verification code for ${to} is: ${otp}`);

    if (!this.transporter) {
      logger.warn(`Mock Email sent to <${to}>: Your verification OTP is: ${otp}`);
      return true;
    }

    const mailOptions = {
      from: `"DevBattle AI" <${env.EMAIL_USER}>`,
      to,
      subject: 'DevBattle AI - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #10b981; text-align: center; margin-bottom: 24px;">Welcome to DevBattle AI!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for registering on DevBattle AI. To complete your sign-up, please verify your email address by entering the following 6-digit One-Time Password (OTP):</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-top: 16px;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this email, please ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">DevBattle AI Team &bull; DevBattle platform</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`OTP verification email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send OTP email via Nodemailer', { to, error: error.message });
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();
