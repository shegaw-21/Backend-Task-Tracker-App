// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // For environment variables

// Import the database connection pool
const pool = require('./config/db');

// Import task controller functions
const { getTasks, addTask, deleteTask, updateTask } = require('./controllers/taskController');

// Import new authentication controller functions
const { register, login } = require('./controllers/authController');

// Import authentication middleware
const protect = require('./middleware/authMiddleware'); // Import the new middleware

const app = express();
const port = process.env.PORT || 3001; // Backend will run on port 3001

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON body parsing for incoming requests

// --- Authentication Routes (Public) ---
app.post('/auth/register', register); // Endpoint for user registration
app.post('/auth/login', login); // Endpoint for user login

// --- Task API Routes (Protected) ---
// All routes below this line will require a valid JWT token
// The 'protect' middleware will run before the task controller functions
app.get('/tasks', protect, getTasks);
app.post('/tasks', protect, addTask);
app.delete('/tasks/:id', protect, deleteTask);
app.put('/tasks/:id', protect, updateTask);

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});