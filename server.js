// backend/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await
require('dotenv').config(); // For environment variables

const app = express();
const port = process.env.PORT || 3001; // Backend will run on port 3001

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Database Connection Pool (Integrated from db.js)
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

// --- Task Controller Functions (Integrated from taskController.js) ---

// Get all tasks
const getTasks = async(req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// Add a new task
const addTask = async(req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Task title is required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)', [title, description, false]
        );
        // Return the newly created task with its generated ID
        res.status(201).json({ id: result.insertId, title, description, completed: false, created_at: new Date() });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Error adding task', error: error.message });
    }
};

// Delete a task
const deleteTask = async(req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send(); // No content to send back for successful deletion
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};

// Update a task (e.g., toggle completion or edit details)
const updateTask = async(req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    try {
        // Fetch current task to ensure it exists and get existing values if not provided
        const [existingTasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existingTasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const existingTask = existingTasks[0];

        // Use provided values or fall back to existing ones
        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedDescription = description !== undefined ? description : existingTask.description;
        const updatedCompleted = completed !== undefined ? completed : existingTask.completed;

        const [result] = await pool.query(
            'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?', [updatedTitle, updatedDescription, updatedCompleted, id]
        );

        if (result.affectedRows === 0) {
            // This might happen if the update query didn't change anything (e.g., values are identical)
            // or if there's an issue not caught by the 404 check.
            return res.status(500).json({ message: 'Failed to update task or no changes detected' });
        }
        // Return the updated task object
        res.json({ id: parseInt(id), title: updatedTitle, description: updatedDescription, completed: updatedCompleted, created_at: existingTask.created_at });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

// --- API Routes (now matching what Vite proxy forwards) ---
// Vite proxy rewrites '/api/tasks' to '/tasks' before sending to backend.
// So, backend routes should be defined without the '/api' prefix here.
app.get('/gettasks', getTasks);
app.post('/addtask', addTask);
app.delete('/deletetask/:id', deleteTask);
app.put('/updatetask/:id', updateTask);

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});