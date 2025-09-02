const express = require('express');
const authController = require('../controllers/authController');
const passport = require('passport');
const router = express.Router();

// Local Auth
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

// DB Test Route
router.get('/db-test', authController.testDbConnection);

// Social Accounts Test Route
router.get('/test-social-accounts', authController.testSocialAccounts);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.socialAuthCallback
);

// Google OAuth linking for existing users
router.get('/google/link', passport.authenticate('google-link', { scope: ['profile', 'email'] }));
router.get('/google/link/callback', 
    passport.authenticate('google-link', { failureRedirect: '/login' }),
    authController.googleLinkingCallback
);

module.exports = router;
