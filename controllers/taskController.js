// backend/controllers/taskController.js
const pool = require('../config/db');

// Get all tasks for the authenticated user
const getTasks = async(req, res) => {
    // req.user will contain the user ID from the JWT token (set by auth middleware)
    const userId = req.user;
    try {
        // Fetch tasks only for the logged-in user
        const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// Add a new task for the authenticated user
const addTask = async(req, res) => {
    const { title, description } = req.body;
    const userId = req.user; // Get user ID from authenticated request

    if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Task title is required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, completed, user_id) VALUES (?, ?, ?, ?)', [title, description, false, userId] // Include user_id
        );
        res.status(201).json({ id: result.insertId, title, description, completed: false, user_id: userId });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Error adding task', error: error.message });
    }
};

// Delete a task for the authenticated user
const deleteTask = async(req, res) => {
    const { id } = req.params;
    const userId = req.user; // Get user ID from authenticated request

    try {
        // Delete task only if it belongs to the authenticated user
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found or not authorized' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};

// Update a task for the authenticated user
const updateTask = async(req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const userId = req.user; // Get user ID from authenticated request

    try {
        // Fetch existing task ensuring it belongs to the authenticated user
        const [existingTasks] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (existingTasks.length === 0) {
            return res.status(404).json({ message: 'Task not found or not authorized' });
        }
        const existingTask = existingTasks[0];

        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedDescription = description !== undefined ? description : existingTask.description;
        const updatedCompleted = completed !== undefined ? completed : existingTask.completed;

        const [result] = await pool.query(
            'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?', [updatedTitle, updatedDescription, updatedCompleted, id, userId] // Include user_id in WHERE clause
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update task' });
        }
        res.json({ id: parseInt(id), title: updatedTitle, description: updatedDescription, completed: updatedCompleted, user_id: userId });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

module.exports = {
    getTasks,
    addTask,
    deleteTask,
    updateTask
};