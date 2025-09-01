const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const protect = require('./middleware/authMiddleware');
const cors = require('cors');
require('./config/passport');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());

// ✅ Serve static files from dist (absolute path)
app.use(express.static(path.join(__dirname, '../dist')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/protected', protect, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}, you have access to protected data!` });
});

// ✅ Catch-all route for frontend (React/Angular/Vue SPA)
// Catch-all for frontend routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
  



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
