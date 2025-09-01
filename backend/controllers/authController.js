const userModel = require('../models/userModel');
const jwt = require('../utils/jwt');

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
        return res.status(401).json({ message: 'Social authentication failed: user not found in request' });
    }

    try {
        // Fetch the full user object from the database using the ID from Passport
        const user = await userModel.findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Social authentication failed: user not found in database' });
        }

        const token = jwt.generateToken({ id: user.id, email: user.email });
        res.status(200).json({ message: 'Social login successful', user, token });
    } catch (error) {
        console.error('Social auth callback error:', error);
        res.status(500).json({ message: 'Server error during social authentication' });
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
