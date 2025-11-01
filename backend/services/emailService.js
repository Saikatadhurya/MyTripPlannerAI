const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Initialize transporter with SMTP configuration
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Get SMTP configuration from environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only create transporter if credentials are provided
    if (smtpConfig.auth.user && smtpConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(smtpConfig);
    } else {
      console.warn('Email service not configured: SMTP_USER and SMTP_PASS environment variables are required');
    }
  }

  /**
   * Send OTP email for signup verification
   * @param {string} email - Recipient email
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} userName - User's full name
   */
  async sendSignupOTP(email, otpCode, userName) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Account - PlanMyTrip AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to PlanMyTrip AI!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p style="font-size: 16px;">Hi ${userName || 'there'},</p>
            <p style="font-size: 16px;">Thank you for signing up! Please verify your email address using the OTP code below:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 0;">${otpCode}</p>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PlanMyTrip AI. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Signup OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending signup OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send OTP email for password reset
   * @param {string} email - Recipient email
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} userName - User's full name
   */
  async sendPasswordResetOTP(email, otpCode, userName) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Reset Your Password - PlanMyTrip AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p style="font-size: 16px;">Hi ${userName || 'there'},</p>
            <p style="font-size: 16px;">We received a request to reset your password. Use the OTP code below to verify your identity:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 0;">${otpCode}</p>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PlanMyTrip AI. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset OTP email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

module.exports = new EmailService();

