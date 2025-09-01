const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateUpdateProfile,
  validateChangePassword,
  validateConnectSocialAccount,
  validateDisconnectSocialAccount,
  validateDeleteAccount,
  sanitizeInput
} = require('../middleware/validationMiddleware');

// Instantiate the ProfileController class
const profileController = new ProfileController();

// Apply authentication middleware to all profile routes
router.use(authMiddleware);

// GET /api/profile - Get user profile with social accounts
router.get('/', profileController.getProfile);

// PUT /api/profile - Update profile information
router.put('/', sanitizeInput, validateUpdateProfile, profileController.updateProfile);

// POST /api/profile/change-password - Change password
router.post('/change-password', validateChangePassword, profileController.changePassword);

// GET /api/profile/social-accounts - Get user's social accounts
router.get('/social-accounts', profileController.getSocialAccounts);

// POST /api/profile/social-accounts - Connect social account
router.post('/social-accounts', sanitizeInput, validateConnectSocialAccount, profileController.connectSocialAccount);

// DELETE /api/profile/social-accounts/:provider - Disconnect social account
router.delete('/social-accounts/:provider', validateDisconnectSocialAccount, profileController.disconnectSocialAccount);

// DELETE /api/profile - Delete user account
router.delete('/', validateDeleteAccount, profileController.deleteAccount);

module.exports = router;