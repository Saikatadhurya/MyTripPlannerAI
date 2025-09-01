const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
// const { protect } = require('./middleware/authMiddleware'); // Corrected path
const protect = require('./middleware/authMiddleware'); // ✅ Correct import
const cors = require('cors'); // Import cors
require('./config/passport'); // Initialize Passport strategies

const app = express();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cors()); // Use cors middleware
app.use(passport.initialize());

// Serve static files from the 'dist' folder. This must be placed before your API routes.
app.use(express.static('../dist'));

// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Protected route example
app.get('/protected', protect, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}, you have access to protected data!` });
});

// Basic test route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});