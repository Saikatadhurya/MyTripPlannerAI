const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/userModel');
require('dotenv').config();

/**
 * Serialize only the database user ID into the session
 */
passport.serializeUser((user, done) => {
    if (user && user.id) {
        done(null, user.id); // Store only user.id (string) in session
    } else {
        done(new Error("Cannot serialize user without ID"), null);
    }
});

/**
 * Deserialize user from ID in session
 */
passport.deserializeUser(async (id, done) => {
    try {
        if (id) {
            const user = await userModel.findUserById(id);
            return done(null, user || null);
        }
        done(null, null);
    } catch (error) {
        done(error, null);
    }
});

/**
 * Google Strategy for login & signup
 */
passport.use('google', new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if Google account is already linked
            let socialAccount = await userModel.findSocialAccount('google', profile.id);
            if (socialAccount) {
                return done(null, { id: socialAccount.user_id, email: socialAccount.email });
            }

            // Check if user exists by email
            let user = await userModel.findUserByEmail(profile.emails[0].value);
            if (user) {
                // Link new Google account to existing user
                await userModel.createSocialAccount({
                    user_id: user.id,
                    provider: 'google',
                    provider_id: profile.id
                });
                return done(null, { id: user.id, email: user.email });
            }

            // Create new user
            user = await userModel.createUser({
                full_name: profile.displayName,
                email: profile.emails[0].value,
                password_hash: null
            });

            // Link Google account to new user
            await userModel.createSocialAccount({
                user_id: user.id,
                provider: 'google',
                provider_id: profile.id
            });

            return done(null, { id: user.id, email: user.email });
        } catch (error) {
            console.error('Google OAuth error:', error);
            done(error, null);
        }
    }
));

/**
 * Google Strategy for linking accounts
 * (skips serialization — returns profile via req.authInfo)
 */
passport.use('google-link', new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/link/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // For linking, don’t store in session
            // Pass profile data via authInfo (third arg)
            return done(null, false, {
                profile: {
                    id: profile.id,
                    email: profile.emails[0].value,
                    displayName: profile.displayName,
                    provider: 'google'
                }
            });
        } catch (error) {
            console.error('Google linking OAuth error:', error);
            done(error, null);
        }
    }
));

module.exports = passport;
