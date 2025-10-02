const userModel = require('../models/userModel');
const jwt = require('../utils/jwt');
const { initUserLimits, ensureFeaturesSeeded } = require('../models/usageModel');

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

        const password_hash = await userModel.hashPassword(password);
        const newUser = await userModel.createUser({ full_name, email, password_hash });

        // Ensure features exist and initialize limits for this new user
        await ensureFeaturesSeeded();
        await initUserLimits(newUser.id);

        const token = jwt.generateToken({ id: newUser.id, email: newUser.email });
        res.status(201).json({ message: 'User registered successfully', user: newUser, token });
    } catch (error) {
        console.error('Signup error:', error);
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

        const isMatch = await userModel.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.generateToken({ id: user.id, email: user.email });
        res.status(200).json({ message: 'Logged in successfully', user, token });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error during signin' });
    }
};

exports.socialAuthCallback = async (req, res) => {
    // Passport will attach user to req.user (minimal info)
    if (!req.user || !req.user.id) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}?error=${encodeURIComponent('Social authentication failed: user not found in request')}`);
    }

    try {
        // Fetch the full user object from the database using the ID from Passport
        const user = await userModel.findUserById(req.user.id);

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}?error=${encodeURIComponent('Social authentication failed: user not found in database')}`);
        }

        const token = jwt.generateToken({ id: user.id, email: user.email });
        
        // Redirect to frontend with token and user data
        const userData = encodeURIComponent(JSON.stringify(user));
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}?token=${token}&user=${userData}`;
        
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Social auth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}?error=${encodeURIComponent('Server error during social authentication')}`);
    }
};

// New function to test DB connection
exports.testDbConnection = async (req, res) => {
    try {
        await userModel.findUserByEmail('nonexistent@example.com'); // A simple, non-disruptive query
        res.status(200).json({ message: 'Database connection successful!' });
    } catch (error) {
        console.error('Database test connection error:', error);
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
};

// Google OAuth linking callback for existing users
exports.googleLinkingCallback = async (req, res) => {
    try {
        // Get profile info from authInfo (third parameter from Passport)
        const profileInfo = req.authInfo?.profile;
        if (!profileInfo || !profileInfo.id) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}?error=${encodeURIComponent('Google linking failed: profile not found in request')}`);
        }

        // Get the return URL and state from query parameters
        const returnUrl = req.query.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5000'}`;
        const stateParam = req.query.state;
        let currentUserId = null;
        
        if (stateParam) {
            try {
                const decodedState = JSON.parse(decodeURIComponent(stateParam));
                if (decodedState.userId) {
                    currentUserId = decodedState.userId;
                }
            } catch (parseError) {
                console.error('Error parsing state parameter:', parseError);
            }
        }
        
        if (!currentUserId) {
            return res.redirect(`${returnUrl}?error=${encodeURIComponent('Please sign in to link your Google account')}`);
        }
        
        // Check if this Google account is already linked to another user
        const existingSocialAccount = await userModel.findSocialAccount('google', profileInfo.id);
        if (existingSocialAccount && existingSocialAccount.user_id !== currentUserId) {
            return res.redirect(`${returnUrl}?error=${encodeURIComponent('This Google account is already linked to another user')}`);
        }
        
        // Check if current user already has a Google account linked
        const userSocialAccounts = await userModel.getSocialAccounts(currentUserId);
        const hasGoogleLinked = userSocialAccounts.data?.some(account => account.provider === 'google') || false;
        if (hasGoogleLinked) {
            return res.redirect(`${returnUrl}?error=${encodeURIComponent('You already have a Google account linked')}`);
        }

        // Create the social account link
        try {
            console.log('Creating social account link:', {
                user_id: currentUserId,
                provider: 'google',
                provider_id: profileInfo.id
            });
            
            const result = await userModel.createSocialAccount({
                user_id: currentUserId,
                provider: 'google',
                provider_id: profileInfo.id
            });
            
            console.log('Social account created successfully:', result);
            
            const successUrl = `${returnUrl}?message=${encodeURIComponent('Google account linked successfully!')}`;
            res.redirect(successUrl);
        } catch (linkError) {
            console.error('Error linking Google account:', linkError);
            const errorUrl = `${returnUrl}?error=${encodeURIComponent('Failed to link Google account. Please try again.')}`;
            res.redirect(errorUrl);
        }
    } catch (error) {
        console.error('Google linking callback error:', error);
        const returnUrl = req.query.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5000'}`;
        res.redirect(`${returnUrl}?error=${encodeURIComponent('Server error during Google account linking')}`);
    }
};

// Test database connection and social accounts table
exports.testSocialAccounts = async (req, res) => {
    try {
        console.log('Testing social accounts functionality...');
        
        // Test database connection
        const testUser = await userModel.findUserByEmail('test@example.com');
        console.log('Database connection test:', testUser ? 'Connected' : 'Connected (no test user found)');
        
        // Test social accounts table structure
        try {
            const result = await userModel.createSocialAccount({
                user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
                provider: 'test',
                provider_id: 'test123'
            });
            console.log('Social accounts table test - INSERT:', result);
            
            // Clean up test data
            await userModel.deleteSocialAccount('test', 'test123');
            console.log('Social accounts table test - DELETE: Success');
            
            res.json({ 
                success: true, 
                message: 'Database and social accounts table working correctly',
                details: {
                    database: 'Connected',
                    social_accounts_table: 'Working',
                    insert_test: 'Passed',
                    delete_test: 'Passed'
                }
            });
        } catch (tableError) {
            console.error('Social accounts table test failed:', tableError);
            res.status(500).json({ 
                success: false, 
                message: 'Social accounts table test failed',
                error: tableError.message
            });
        }
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database test failed',
            error: error.message
        });
    }
};
