const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const usageRoutes = require('./routes/usageRoutes');
const historyRoutes = require('./routes/historyRoutes');
const protect = require('./middleware/authMiddleware');
const cors = require('cors');
require('./config/passport');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from dist (absolute path)
app.use(express.static(path.join(__dirname, '../dist')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/history', historyRoutes);

app.get('/protected', protect, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}, you have access to protected data!` });
});

// Catch-all route for frontend (React/Angular/Vue SPA)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
});
