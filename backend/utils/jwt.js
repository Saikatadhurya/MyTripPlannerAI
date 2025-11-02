const jwt = require('jsonwebtoken');
const path = require('path');
// Load .env from root directory (parent of backend/)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for development
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token is invalid or expired
    }
}

module.exports = {
    generateToken,
    verifyToken,
};
