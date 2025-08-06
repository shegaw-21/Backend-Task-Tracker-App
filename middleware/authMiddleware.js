// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Secret key for JWTs - IMPORTANT: Use the same strong key as in authController.js
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for local testing

const protect = (req, res, next) => {
    // Get token from header
    // Expecting: Authorization: Bearer TOKEN_STRING
    const authHeader = req.header('Authorization');

    // Check if no token or invalid format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied or invalid token format' });
    }

    // Extract the actual token string
    const tokenString = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(tokenString, JWT_SECRET);

        // Attach user from token payload to the request object
        // This makes req.user available in subsequent middleware/route handlers
        // The decoded payload contains { id: user.id, username: user.username }
        req.user = decoded;
        next(); // Call the next middleware/route handler
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(403).json({ message: 'Token is not valid or expired' });
    }
};

// This exports the 'protect' function directly
module.exports = protect;