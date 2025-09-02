const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

class ProfileController {
  // Get user profile with social accounts
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userModel.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at,
            social_accounts: user.social_accounts,
            has_password: user.has_password
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update profile information
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, email } = req.body;

      // Validate input
      if (!full_name && !email) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (full_name or email) is required'
        });
      }

      if (full_name && (typeof full_name !== 'string' || full_name.trim().length < 2)) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters long'
        });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const updates = {};
      if (full_name) updates.full_name = full_name.trim();
      if (email) updates.email = email.toLowerCase().trim();

      const updatedUser = await userModel.updateProfile(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at
          }
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Determine if user already has a password
      const user = await userModel.getUserById(userId);
      const hasPassword = !!user?.has_password;

      // Validate input
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      if (hasPassword && !currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      if (hasPassword && currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }

      const result = await userModel.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message === 'Current password is incorrect') {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      if (error.message === 'Current password is required') {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Connect social account
  async connectSocialAccount(req, res) {
    try {
      const userId = req.user.id;
      const { provider, providerId } = req.body;

      // Validate input
      if (!provider || !providerId) {
        return res.status(400).json({
          success: false,
          message: 'Provider and provider ID are required'
        });
      }

      if (!['google'].includes(provider.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid provider. Supported providers: google'
        });
      }

      const socialAccount = await userModel.connectSocialAccount(userId, provider.toLowerCase(), providerId);

      res.json({
        success: true,
        message: `${provider} account connected successfully`,
        data: {
          social_account: {
            id: socialAccount.id,
            provider: socialAccount.provider,
            provider_id: socialAccount.provider_id,
            created_at: socialAccount.created_at
          }
        }
      });
    } catch (error) {
      console.error('Connect social account error:', error);
      
      if (error.message.includes('already connected')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Disconnect social account
  async disconnectSocialAccount(req, res) {
    try {
      const userId = req.user.id;
      const { provider } = req.params;

      // Validate input
      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'Provider is required'
        });
      }

      if (!['google'].includes(provider.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid provider. Supported providers: google'
        });
      }

      const result = await userModel.disconnectSocialAccount(userId, provider.toLowerCase());

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Disconnect social account error:', error);
      
      if (error.message.includes('not found') || error.message.includes('already disconnected')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get social accounts
  async getSocialAccounts(req, res) {
    try {
      const userId = req.user.id;
      const socialAccounts = await userModel.getSocialAccounts(userId);

      res.json({
        success: true,
        data: {
          social_accounts: socialAccounts
        }
      });
    } catch (error) {
      console.error('Get social accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Validate input
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to confirm account deletion'
        });
      }

      // Verify password before deletion
      const user = await userModel.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isPasswordValid = await userModel.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      const result = await userModel.deleteAccount(userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete account error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = ProfileController;
