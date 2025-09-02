const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class UserModel {
  async createUser({ full_name, email, password_hash }) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO planora.users(full_name, email, password_hash) VALUES($1, $2, $3) RETURNING id, full_name, email, created_at`,
        [full_name, email, password_hash]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, full_name, email, password_hash FROM planora.users WHERE email = $1`,
        [email]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async findUserById(id) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, full_name, email FROM planora.users WHERE id = $1`,
        [id]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async createSocialAccount({ user_id, provider, provider_id }) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO planora.social_accounts(user_id, provider, provider_id) VALUES($1, $2, $3) RETURNING *`,
        [user_id, provider, provider_id]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async findSocialAccount(provider, provider_id) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT sa.id as social_id, sa.user_id, sa.provider, sa.provider_id, u.id as user_id, u.full_name, u.email
         FROM planora.social_accounts sa
         JOIN planora.users u ON sa.user_id = u.id
         WHERE sa.provider = $1 AND sa.provider_id = $2`,
        [provider, provider_id]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteSocialAccount(provider, provider_id) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `DELETE FROM planora.social_accounts WHERE provider = $1 AND provider_id = $2 RETURNING *`,
        [provider, provider_id]
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async updateProfile(userId, updates) {
    const client = await pool.connect();
    try {
      const { full_name, email } = updates;
      const updateFields = [];
      const values = [];
      let paramCount = 1;
  
      if (full_name !== undefined) {
        updateFields.push(`full_name = $${paramCount++}`);
        values.push(full_name);
      }
  
      if (email !== undefined) {
        const emailCheck = await client.query(
          'SELECT id FROM planora.users WHERE email = $1 AND id != $2',
          [email, userId]
        );
  
        if (emailCheck.rows.length > 0) {
          throw new Error('Email already exists');
        }
  
        updateFields.push(`email = $${paramCount++}`);
        values.push(email);
      }
  
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
  
      updateFields.push(`updated_at = NOW()`);
  
      // Correct the userId position
      values.push(userId);
      const query = `
        UPDATE planora.users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, full_name, email, created_at, updated_at
      `;
  
      const result = await client.query(query, values);
  
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
  
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      // Get current user with password hash
      const userResult = await client.query(
        'SELECT password_hash FROM planora.users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // If user already has a password, verify current password
      if (user.password_hash) {
        if (!currentPassword) {
          throw new Error('Current password is required');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
          throw new Error('Current password is incorrect');
        }
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const updateResult = await client.query(
        'UPDATE planora.users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
        [newPasswordHash, userId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('Failed to update password');
      }

      return { success: true, message: 'Password updated successfully' };
    } finally {
      client.release();
    }
  }

  async connectSocialAccount(userId, provider, providerId) {
    const client = await pool.connect();
    try {
      // Check if social account already exists for this user and provider
      const existingAccount = await client.query(
        'SELECT id FROM planora.social_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      if (existingAccount.rows.length > 0) {
        throw new Error(`${provider} account already connected`);
      }

      // Check if provider_id is already used by another user
      const providerCheck = await client.query(
        'SELECT user_id FROM planora.social_accounts WHERE provider = $1 AND provider_id = $2',
        [provider, providerId]
      );

      if (providerCheck.rows.length > 0) {
        throw new Error(`${provider} account is already connected to another user`);
      }

      // Insert new social account
      const result = await client.query(
        'INSERT INTO planora.social_accounts (user_id, provider, provider_id) VALUES ($1, $2, $3) RETURNING id, user_id, provider, provider_id, created_at',
        [userId, provider, providerId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async disconnectSocialAccount(userId, provider) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM planora.social_accounts WHERE user_id = $1 AND provider = $2 RETURNING id',
        [userId, provider]
      );

      if (result.rows.length === 0) {
        throw new Error(`${provider} account not found or already disconnected`);
      }

      return { success: true, message: `${provider} account disconnected successfully` };
    } finally {
      client.release();
    }
  }

  async getSocialAccounts(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, provider, provider_id, created_at FROM planora.social_accounts WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  async deleteAccount(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete social accounts first (due to foreign key constraint)
      await client.query(
        'DELETE FROM planora.social_accounts WHERE user_id = $1',
        [userId]
      );

      // Delete user
      const result = await client.query(
        'DELETE FROM planora.users WHERE id = $1 RETURNING id',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      await client.query('COMMIT');
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserById(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, full_name, email, created_at, updated_at, (password_hash IS NOT NULL) AS has_password FROM planora.users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      // Get social accounts
      const socialAccounts = await this.getSocialAccounts(userId);
      user.social_accounts = socialAccounts;

      return user;
    } finally {
      client.release();
    }
  }
}

module.exports = new UserModel();
