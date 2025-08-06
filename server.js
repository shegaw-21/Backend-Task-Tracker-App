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
const protect = require('./middleware/authMiddleware'); // Correct: Imports the function directly

const app = express();
const port = process.env.PORT || 3001; // Backend will run on port 3001

// Middleware

// Configure CORS to allow requests from your frontend.
// IMPORTANT: This 'origin' value MUST EXACTLY MATCH your deployed Vercel frontend URL.
// Based on your latest error, your frontend is now at: https://frontend-task-tracker-app-dmnm.vercel.app
const corsOptions = {
    origin: 'https://frontend-task-tracker-app-dmnm.vercel.app', // Updated to your current frontend URL
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Enable JSON body parsing for incoming requests

// --- Authentication Routes (Public) ---
app.post('/auth/register', register); // Endpoint for user registration
app.post('/auth/login', login); // Endpoint for user login

// --- Debugging console logs ---
console.log('Type of protect (before tasks routes):', typeof protect);
console.log('Type of getTasks (before tasks routes):', typeof getTasks);
console.log('Type of addTask (before tasks routes):', typeof addTask);
console.log('Type of deleteTask (before tasks routes):', typeof deleteTask);
console.log('Type of updateTask (before tasks routes):', typeof updateTask);


// --- Task API Routes (Protected) ---
// All routes below this line will require a valid JWT token
// The 'protect' middleware will run before the task controller functions
app.get('/tasks', protect, getTasks);
app.post('/tasks', protect, addTask);
app.delete('/tasks/:id', protect, deleteTask);
app.put('/tasks/:id', protect, updateTask);

// Start the server
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release(); // Release the connection back to the pool immediately
        app.listen(port, () => {
            console.log(`Backend server running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
        // Exit the process if database connection fails on startup, as the app cannot function without it.
        process.exit(1);
    });