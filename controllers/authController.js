// backend/controllers/authController.js
const pool = require('../config/db'); // Import the database connection pool
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For creating JWT tokens

// Register a new user
const registerUser = async (req, res) => {
    const { username, password, email, full_name } = req.body;

    // Basic validation
    if (!username || !password || !email || !full_name) {
        return res.status(400).json({ message: 'All fields (username, password, email, full_name) are required.' });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into the database
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, full_name]
        );

        // Respond with success
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (error) {
        console.error('Error registering user:', error);
        // Check for duplicate entry error (e.g., duplicate username or email)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// Login user
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Find user by username
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const user = users[0];

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Create and sign a JWT token
        // IMPORTANT: Replace 'your_jwt_secret' with a strong, random secret in your .env file
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret', // Use environment variable for secret
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.json({ message: 'Logged in successfully!', token, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name } });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser
};
