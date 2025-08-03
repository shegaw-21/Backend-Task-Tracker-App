// backend/server.js
const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await
require('dotenv').config(); // Load environment variables from .env file

// Define the port for the server, using environment variable or default to 3001
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from your frontend.
// In development, you might allow all origins (*).
// For production, replace '*' with your actual Netlify frontend URL (e.g., 'https://your-netlify-app.netlify.app').
const corsOptions = {
    origin: '*', // Allow all origins for development. CHANGE THIS FOR PRODUCTION!
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// Database Connection Pool
// Uses environment variables for credentials, with fallbacks for local development.
// IMPORTANT: Ensure your .env file in the backend directory has these values.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Your provided password is empty
    database: process.env.DB_DATABASE || 'task_tracker_db', // Using DB_DATABASE as per your input
    waitForConnections: true,
    connectionLimit: 10, // Max number of connections in the pool
    queueLimit: 0 // No limit on connection requests in the queue
});

// Test Database Connection on server startup
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release(); // Release the connection back to the pool immediately
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
        // Exit the process if database connection fails on startup, as the app cannot function without it.
        process.exit(1);
    });

// API Routes for Task Management

// GET all tasks
app.get('/tasks', async(req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC'); // Order by creation date
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
});

// POST a new task
app.post('/tasks', async(req, res) => {
    const { title, description } = req.body;
    // Basic validation: ensure title is provided
    if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Task title is required' });
    }
    try {
        // Insert new task into the database
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)', [title, description, false] // New tasks are initially not completed
        );
        // Respond with the newly created task's details, including its generated ID
        res.status(201).json({ id: result.insertId, title, description, completed: false });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Error adding task', error: error.message });
    }
});

// DELETE a task by ID
app.delete('/tasks/:id', async(req, res) => {
    const { id } = req.params;
    try {
        // Execute the DELETE query
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        // Check if any row was affected (i.e., if the task existed)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // Respond with 204 No Content for successful deletion
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

// PUT (Update) an existing task by ID
app.put('/tasks/:id', async(req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body; // New values for update

    try {
        // First, fetch the existing task to get its current values
        const [existingTasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existingTasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const existingTask = existingTasks[0];

        // Use new values if provided, otherwise retain existing values
        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedDescription = description !== undefined ? description : existingTask.description;
        const updatedCompleted = completed !== undefined ? completed : existingTask.completed;

        // Execute the UPDATE query
        const [result] = await pool.query(
            'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?', [updatedTitle, updatedDescription, updatedCompleted, id]
        );

        // Check if any row was affected
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update task' });
        }
        // Respond with the updated task's details
        res.json({ id: parseInt(id), title: updatedTitle, description: updatedDescription, completed: updatedCompleted });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});