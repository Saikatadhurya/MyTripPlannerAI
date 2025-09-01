const express = require('express');
const authController = require('../controllers/authController');
const passport = require('passport');
const router = express.Router();

// Local Auth
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

// DB Test Route
router.get('/db-test', authController.testDbConnection);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.socialAuthCallback
);

// Twitter Auth
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    authController.socialAuthCallback
);

module.exports = router;
