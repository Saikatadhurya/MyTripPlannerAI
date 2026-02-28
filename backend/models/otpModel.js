const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class OTPModel {
  /**
   * Generate a random 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create an OTP for a user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} otpType - 'signup' or 'password_reset'
   * @returns {Promise<{otpCode: string, expiresAt: Date}>}
   */
  async createOTP(userId, email, otpType = 'signup') {
    const client = await pool.connect();
    try {
      // Delete any existing unverified OTPs for this user and type
      await client.query(
        `DELETE FROM planora.email_otps 
         WHERE user_id = $1 AND otp_type = $2 AND verified_at IS NULL`,
        [userId, otpType]
      );

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Insert new OTP
      const result = await client.query(
        `INSERT INTO planora.email_otps (user_id, email, otp_code, otp_type, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING otp_code, expires_at`,
        [userId, email, otpCode, otpType, expiresAt]
      );

      return {
        otpCode: result.rows[0].otp_code,
        expiresAt: result.rows[0].expires_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Verify an OTP for a user
   * @param {string} email - User email
   * @param {string} otpCode - OTP code to verify
   * @param {string} otpType - 'signup' or 'password_reset'
   * @returns {Promise<{valid: boolean, userId: string|null}>}
   */
  async verifyOTP(email, otpCode, otpType = 'signup') {
    const client = await pool.connect();
    try {
      // Find valid unexpired OTP
      const result = await client.query(
        `SELECT user_id, expires_at, verified_at
         FROM planora.email_otps
         WHERE email = $1 AND otp_code = $2 AND otp_type = $3
         ORDER BY created_at DESC
         LIMIT 1`,
        [email, otpCode, otpType]
      );

      if (result.rows.length === 0) {
        return { valid: false, userId: null, message: 'Invalid OTP code' };
      }

      const otp = result.rows[0];

      // Check if already verified
      if (otp.verified_at) {
        return { valid: false, userId: null, message: 'OTP already used' };
      }

      // Check if expired
      if (new Date(otp.expires_at) < new Date()) {
        return { valid: false, userId: null, message: 'OTP has expired' };
      }

      // Mark as verified
      await client.query(
        `UPDATE planora.email_otps 
         SET verified_at = NOW()
         WHERE email = $1 AND otp_code = $2 AND otp_type = $3`,
        [email, otpCode, otpType]
      );

      return { valid: true, userId: otp.user_id, message: 'OTP verified successfully' };
    } finally {
      client.release();
    }
  }

  /**
   * Check if OTP was recently verified (for password reset flow)
   * @param {string} email - User email
   * @param {string} otpCode - OTP code to check
   * @param {string} otpType - 'signup' or 'password_reset'
   * @param {number} minutes - Time window in minutes (default 10)
   * @returns {Promise<{valid: boolean, userId: string|null}>}
   */
  async checkRecentlyVerifiedOTP(email, otpCode, otpType = 'password_reset', minutes = 10) {
    const client = await pool.connect();
    try {
      // Find OTP that was verified recently
      const result = await client.query(
        `SELECT user_id, verified_at
         FROM planora.email_otps
         WHERE email = $1 AND otp_code = $2 AND otp_type = $3
           AND verified_at IS NOT NULL
           AND verified_at > NOW() - INTERVAL '${minutes} minutes'
         ORDER BY verified_at DESC
         LIMIT 1`,
        [email, otpCode, otpType]
      );

      if (result.rows.length === 0) {
        return { valid: false, userId: null, message: 'OTP not verified or verification expired' };
      }

      return { valid: true, userId: result.rows[0].user_id, message: 'OTP verification confirmed' };
    } finally {
      client.release();
    }
  }

  /**
   * Get recent OTP count for rate limiting
   * @param {string} email - User email
   * @param {number} minutes - Time window in minutes
   * @returns {Promise<number>}
   */
  async getRecentOTPCount(email, minutes = 15) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count
         FROM planora.email_otps
         WHERE email = $1 AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
        [email]
      );
      return parseInt(result.rows[0].count, 10);
    } finally {
      client.release();
    }
  }

  /**
   * Delete expired OTPs (cleanup function)
   * @returns {Promise<number>} Number of deleted OTPs
   */
  async deleteExpiredOTPs() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM planora.email_otps 
         WHERE expires_at < NOW() AND verified_at IS NULL
         RETURNING id`
      );
      return result.rows.length;
    } finally {
      client.release();
    }
  }
}

module.exports = new OTPModel();

