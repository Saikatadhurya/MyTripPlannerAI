const userModel = require('../models/userModel');
const jwt = require('../utils/jwt');
const { initUserLimits, ensureFeaturesSeeded } = require('../models/usageModel');
const otpModel = require('../models/otpModel');
const emailService = require('../services/emailService');

// Get the frontend URL, with fallback logic for production
const frontendUrl = process.env.FRONTEND_URL || 
                     process.env.BASE_URL || 
                     (process.env.NODE_ENV === 'production' ? process.env.RENDER_URL : 'http://localhost:5000');

exports.signup = async (req, res) => {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Check rate limiting for OTP generation
        const recentOTPCount = await otpModel.getRecentOTPCount(email, 15);
        if (recentOTPCount >= 3) {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }

        const password_hash = await userModel.hashPassword(password);
        const newUser = await userModel.createUser({ full_name, email, password_hash });

        // Generate and send OTP
        const { otpCode } = await otpModel.createOTP(newUser.id, email, 'signup');
        await emailService.sendSignupOTP(email, otpCode, full_name);

        res.status(201).json({ 
            message: 'Registration successful. Please check your email for verification OTP.', 
            email: email,
            requiresVerification: true
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.message === 'Email service not configured. Please set SMTP environment variables.') {
            return res.status(503).json({ message: 'Email service temporarily unavailable' });
        }
        res.status(500).json({ message: 'Server error during signup' });
    }
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified (for direct signups, not social logins)
        if (!user.is_verified && user.password_hash) {
            return res.status(403).json({ 
                message: 'Please verify your email address before signing in. Check your inbox for the verification OTP.',
                requiresVerification: true
            });
        }

        const isMatch = await userModel.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.generateToken({ id: user.id, email: user.email });
        
        // Set Gemini API key cookie if it exists
        if (user.gemini_api_key) {
            res.cookie('gemini_api_key', user.gemini_api_key, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/',
                httpOnly: false, // Allow frontend to read it
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            });
        }
        
        res.status(200).json({ message: 'Logged in successfully', user, token });
    } catch (error) {
        res.status(500).json({ message: 'Server error during signin' });
    }
};

exports.socialAuthCallback = async (req, res) => {
    // Passport will attach user to req.user (minimal info)
    if (!req.user || !req.user.id) {
        return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Social authentication failed: user not found in request')}`);
    }

    try {
        // Fetch the full user object from the database using the ID from Passport
        const user = await userModel.findUserById(req.user.id);

        if (!user) {
            return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Social authentication failed: user not found in database')}`);
        }

        const token = jwt.generateToken({ id: user.id, email: user.email });
        
        // Set Gemini API key cookie if it exists
        if (user.gemini_api_key) {
            res.cookie('gemini_api_key', user.gemini_api_key, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/',
                httpOnly: false, // Allow frontend to read it
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            });
        }
        
        // Redirect to frontend with token and user data
        const userData = encodeURIComponent(JSON.stringify(user));
        const redirectUrl = `${frontendUrl}?token=${token}&user=${userData}`;
        
        res.redirect(redirectUrl);
    } catch (error) {
        res.redirect(`${frontendUrl}?error=${encodeURIComponent('Server error during social authentication')}`);
    }
};

// Google OAuth linking callback for existing users
exports.googleLinkingCallback = async (req, res) => {
    try {
        // Get profile info from authInfo (third parameter from Passport)
        const profileInfo = req.authInfo?.profile;
        if (!profileInfo || !profileInfo.id) {
            return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Google linking failed: profile not found in request')}`);
        }

        // Get the return URL and state from query parameters
        const returnUrl = req.query.returnUrl || frontendUrl;
        const stateParam = req.query.state;
        let currentUserId = null;
        
        if (stateParam) {
            try {
                const decodedState = JSON.parse(decodeURIComponent(stateParam));
                if (decodedState.userId) {
                    currentUserId = decodedState.userId;
                }
            } catch (parseError) {
                // Error parsing state parameter
            }
        }
        
        if (!currentUserId) {
            return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Please sign in to link your Google account')}`);
        }
        
        // Check if this Google account is already linked to another user
        const existingSocialAccount = await userModel.findSocialAccount('google', profileInfo.id);
        if (existingSocialAccount && existingSocialAccount.user_id !== currentUserId) {
            return res.redirect(`${frontendUrl}?error=${encodeURIComponent('This Google account is already linked to another user')}`);
        }
        
        // Check if current user already has a Google account linked
        const userSocialAccounts = await userModel.getSocialAccounts(currentUserId);
        const hasGoogleLinked = userSocialAccounts.data?.some(account => account.provider === 'google') || false;
        if (hasGoogleLinked) {
            return res.redirect(`${frontendUrl}?error=${encodeURIComponent('You already have a Google account linked')}`);
        }

        // Create the social account link
        try {
            const result = await userModel.createSocialAccount({
                user_id: currentUserId,
                provider: 'google',
                provider_id: profileInfo.id
            });
            
            const successUrl = `${frontendUrl}?message=${encodeURIComponent('Google account linked successfully!')}`;
            res.redirect(successUrl);
        } catch (linkError) {
            const errorUrl = `${frontendUrl}?error=${encodeURIComponent('Failed to link Google account. Please try again.')}`;
            res.redirect(errorUrl);
        }
    } catch (error) {
        res.redirect(`${frontendUrl}?error=${encodeURIComponent('Server error during Google account linking')}`);
    }
};

// Verify OTP for signup
exports.verifyOTP = async (req, res) => {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
        return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    try {
        // Verify OTP
        const verification = await otpModel.verifyOTP(email, otpCode, 'signup');
        
        if (!verification.valid) {
            return res.status(400).json({ message: verification.message });
        }

        // Mark user as verified
        await userModel.verifyUserEmail(verification.userId);

        // Ensure features exist and initialize limits for this new user
        await ensureFeaturesSeeded();
        await initUserLimits(verification.userId);

        // Get user data
        const user = await userModel.findUserById(verification.userId);
        
        // Generate JWT token
        const token = jwt.generateToken({ id: user.id, email: user.email });

        res.status(200).json({ 
            message: 'Email verified successfully', 
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                created_at: user.created_at,
                is_verified: true
            }, 
            token 
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// Resend OTP for signup
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if user exists
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already verified
        if (user.is_verified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Check rate limiting
        const recentOTPCount = await otpModel.getRecentOTPCount(email, 15);
        if (recentOTPCount >= 3) {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }

        // Generate and send new OTP
        const { otpCode } = await otpModel.createOTP(user.id, email, 'signup');
        await emailService.sendSignupOTP(email, otpCode, user.full_name);

        res.status(200).json({ message: 'OTP sent successfully. Please check your email.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        if (error.message === 'Email service not configured. Please set SMTP environment variables.') {
            return res.status(503).json({ message: 'Email service temporarily unavailable' });
        }
        res.status(500).json({ message: 'Server error during OTP resend' });
    }
};

// Forgot password - send OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if user exists
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists for security
            return res.status(200).json({ message: 'If an account exists with this email, a password reset OTP has been sent.' });
        }

        // Check if user has a password (social-only users)
        if (!user.password_hash) {
            return res.status(400).json({ message: 'This account uses social login. Please sign in with your social account.' });
        }

        // Check rate limiting
        const recentOTPCount = await otpModel.getRecentOTPCount(email, 15);
        if (recentOTPCount >= 3) {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }

        // Generate and send password reset OTP
        const { otpCode } = await otpModel.createOTP(user.id, email, 'password_reset');
        await emailService.sendPasswordResetOTP(email, otpCode, user.full_name);

        res.status(200).json({ message: 'If an account exists with this email, a password reset OTP has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        if (error.message === 'Email service not configured. Please set SMTP environment variables.') {
            return res.status(503).json({ message: 'Email service temporarily unavailable' });
        }
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// Verify OTP for password reset
exports.verifyResetOTP = async (req, res) => {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
        return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    try {
        // Verify OTP
        const verification = await otpModel.verifyOTP(email, otpCode, 'password_reset');
        
        if (!verification.valid) {
            return res.status(400).json({ message: verification.message });
        }

        res.status(200).json({ 
            message: 'OTP verified successfully. You can now reset your password.',
            verified: true
        });
    } catch (error) {
        console.error('Reset OTP verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// Reset password after OTP verification
exports.resetPassword = async (req, res) => {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    try {
        // Check if OTP was recently verified (within last 10 minutes)
        // This handles the case where OTP was verified in the previous step
        const verification = await otpModel.checkRecentlyVerifiedOTP(email, otpCode, 'password_reset', 10);
        
        // If not recently verified, try to verify it now (first time verification)
        if (!verification.valid) {
            const newVerification = await otpModel.verifyOTP(email, otpCode, 'password_reset');
            if (!newVerification.valid) {
                return res.status(400).json({ message: newVerification.message });
            }
        }

        // Validate password
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Get user
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password directly (OTP verification already happened)
        await userModel.resetPasswordDirect(user.id, newPassword);

        res.status(200).json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};
