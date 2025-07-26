// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // IMPORTANT: Ensure this matches your MySQL root password. If no password, leave empty string.
    database: process.env.DB_NAME || 'task_tracker_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
        // Exit the process if database connection fails on startup
        process.exit(1);
    });

module.exports = pool; // Export the pool for use in controllers