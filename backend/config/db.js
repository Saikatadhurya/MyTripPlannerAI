const { Pool } = require('pg');
const path = require('path');
// Load .env from root directory (parent of backend/)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon DB or other SSL-enabled databases
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process - let the application handle the error gracefully
});

module.exports = { 
    query: (text, params) => pool.query(text, params),
    pool,
};
