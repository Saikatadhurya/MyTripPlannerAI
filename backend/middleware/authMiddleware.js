// middleware/authMiddleware.js
const jwt = require('../utils/jwt');
const userModel = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Fetch complete user data from database to get latest profile info
    const user = await userModel.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      gemini_api_key: user.gemini_api_key,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = protect;  // ✅ Export as "protect"
