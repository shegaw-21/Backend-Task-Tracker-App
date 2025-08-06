// backend/server.js
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import the database connection pool
const pool = require('./config/db');

// Import controller functions
const { getTasks, addTask, deleteTask, updateTask } = require('./controllers/taskController');
const { registerUser, loginUser } = require('./controllers/authController');

// NEW: Import auth middleware
const { protect } = require('./middleware/authMiddleware');

// Define the port for the server, using environment variable or default to 3001
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from your frontend.
const corsOptions = {
    origin: 'https://frontend-task-tracker-app-nbkxf.vercel.app', // Your specific Vercel frontend URL
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// Test Database Connection on server startup
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1);
    });

// --- API Routes ---

// Authentication Routes (no protection needed here)
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);

// Task Management Routes - PROTECTED by auth middleware
// All routes below this middleware will require a valid JWT token
app.get('/tasks', protect, getTasks);
app.post('/tasks', protect, addTask);
app.delete('/tasks/:id', protect, deleteTask);
app.put('/tasks/:id', protect, updateTask);

// Start the Express server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});