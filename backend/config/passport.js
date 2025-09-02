const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const userModel = require('../models/userModel');
require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findUserById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let socialAccount = await userModel.findSocialAccount('google', profile.id);
        if (socialAccount) {
            return done(null, { id: socialAccount.user_id, email: socialAccount.email });
        }

        // If no social account, check if user exists with the email
        let user = await userModel.findUserByEmail(profile.emails[0].value);
        if (user) {
            // Link social account to existing user
            await userModel.createSocialAccount({ user_id: user.id, provider: 'google', provider_id: profile.id });
            return done(null, { id: user.id, email: user.email });
        }

        // No existing user, create new user and social account
        user = await userModel.createUser({
            full_name: profile.displayName,
            email: profile.emails[0].value,
            password_hash: null // Social users don't have password hashes
        });
        await userModel.createSocialAccount({ user_id: user.id, provider: 'google', provider_id: profile.id });
        done(null, { id: user.id, email: user.email });

    } catch (error) {
        done(error, null);
    }
}));

// Twitter Strategy
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/twitter/callback`,
    includeEmail: true // Request email from Twitter
}, async (token, tokenSecret, profile, done) => {
    try {
        let socialAccount = await userModel.findSocialAccount('twitter', profile.id);
        if (socialAccount) {
            return done(null, { id: socialAccount.user_id, email: socialAccount.email });
        }

        // Twitter API sometimes returns email in a different field or not at all
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username}@twitter.com`;

        let user = await userModel.findUserByEmail(email);
        if (user) {
            await userModel.createSocialAccount({ user_id: user.id, provider: 'twitter', provider_id: profile.id });
            return done(null, { id: user.id, email: user.email });
        }

        user = await userModel.createUser({
            full_name: profile.displayName || profile.username,
            email: email,
            password_hash: null
        });
        await userModel.createSocialAccount({ user_id: user.id, provider: 'twitter', provider_id: profile.id });
        done(null, { id: user.id, email: user.email });

    } catch (error) {
        done(error, null);
    }
}));

module.exports = passport;
