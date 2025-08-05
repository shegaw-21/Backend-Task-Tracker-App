// backend/controllers/authController.js
const pool = require('../config/db'); // Import the database connection pool
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens

// Secret key for JWTs - IMPORTANT: Use a strong, random key in production via environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for local testing

// --- User Registration ---
const register = async(req, res) => {
    const { username, password, email, full_name } = req.body;

    // Enhanced Validation: All fields are now required
    if (!username || !password || !email || !full_name) {
        return res.status(400).json({ message: 'Username, password, email, and full name are all required for registration.' });
    }

    try {
        // Check if username already exists
        const [existingUsersByUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsersByUsername.length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose a different one.' });
        }

        // Check if email already exists (since email is UNIQUE)
        const [existingUsersByEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsersByEmail.length > 0) {
            return res.status(409).json({ message: 'Email already registered. Please use a different email or log in.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

        // Insert new user into the database
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)', [username, hashedPassword, email, full_name] // Now all fields are directly used, no null fallback
        );

        // Respond with success message (do not send password back)
        res.status(201).json({ message: 'User registered successfully! You can now log in.', userId: result.insertId, username });

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// --- User Login ---
const login = async(req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Find the user by username
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' }); // Use generic message for security
        }
        const user = users[0];

        // Compare provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        // The token payload should contain non-sensitive user info (e.g., id, username)
        const token = jwt.sign({ id: user.id, username: user.username },
            JWT_SECRET, { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Respond with the token and user info
        res.json({ message: 'Logged in successfully!', token, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name } });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

module.exports = {
    register,
    login
};