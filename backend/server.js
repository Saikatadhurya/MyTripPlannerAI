const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
// Load .env from root directory (parent of backend/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

// Get allowed origins - support multiple sources including Android/Capacitor
const getAllowedOrigins = () => {
  const origins = [];
  
  // Add frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add base URL
  if (process.env.BASE_URL) {
    origins.push(process.env.BASE_URL);
  }
  
  // Add Render URL if in production
  if (process.env.RENDER_URL) {
    origins.push(process.env.RENDER_URL);
  }
  
  // Development origins
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:5000');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:5000');
  }
  
  // Allow Capacitor/Android origins (these are the origins used by Capacitor WebView)
  origins.push('capacitor://localhost');
  origins.push('ionic://localhost');
  origins.push('http://localhost');
  origins.push('https://localhost'); // Critical for Android WebView!
  origins.push('http://localhost:8080');
  origins.push('https://localhost:8080');
  origins.push('file://');
  
  return origins.filter(Boolean); // Remove empty strings
};

const allowedOrigins = getAllowedOrigins();

// Get the frontend URL, with fallback logic for production
const frontendUrl = process.env.FRONTEND_URL || 
                     process.env.BASE_URL || 
                     (process.env.NODE_ENV === 'production' ? process.env.RENDER_URL : 'http://localhost:5000');

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman, Capacitor)
        if (!origin) {
            return callback(null, true);
        }
        
        // Special handling for Capacitor/Android WebView origins (must be checked first!)
        if (origin === 'https://localhost' || 
            origin === 'http://localhost' || 
            origin.startsWith('capacitor://') || 
            origin.startsWith('ionic://') ||
            origin === 'http://localhost:8080' ||
            origin === 'https://localhost:8080') {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Log for debugging
            console.log('CORS: Allowing origin:', origin);
            // Allow all origins for mobile app compatibility
            // This ensures Android WebView requests work correctly
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.NODE_ENV === 'production' ? 'your-production-secret-key-change-this' : 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin cookies
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/history', historyRoutes);

app.get('/protected', protect, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}, you have access to protected data!` });
});

// Serve static files from dist (absolute path) - AFTER API routes
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for frontend (React/Angular/Vue SPA)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 
                  (process.env.RENDER_URL ? process.env.RENDER_URL : `http://localhost:${PORT}`);

app.listen(PORT, () => {
});
