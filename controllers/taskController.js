// backend/controllers/taskController.js
const pool = require('../config/db'); // Import the database connection pool

// --- Get All Tasks for the Authenticated User ---
const getTasks = async(req, res) => {
    // req.user is set by the protect middleware, containing the authenticated user's ID
    // Ensure req.user and req.user.id exist before using
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// --- Add a New Task for the Authenticated User ---
const addTask = async(req, res) => {
    const { title, description } = req.body;
    const userId = req.user ? req.user.id : null; // Get user ID from authenticated request

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }
    if (!title) {
        return res.status(400).json({ message: 'Task title is required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, completed, user_id) VALUES (?, ?, ?, ?)', [title, description, false, userId] // Now inserting with user_id
        );
        res.status(201).json({ id: result.insertId, title, description, completed: false, user_id: userId });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Error adding task', error: error.message });
    }
};

// --- Delete a Task for the Authenticated User ---
const deleteTask = async(req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null; // Get user ID from authenticated request

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }

    try {
        // Ensure the task belongs to the authenticated user before deleting
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) {
            // Return 404 if task not found OR if it doesn't belong to the user
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};

// --- Update a Task for the Authenticated User ---
const updateTask = async(req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const userId = req.user ? req.user.id : null; // Get user ID from authenticated request

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }

    try {
        // Fetch current task to ensure it exists AND belongs to the user
        const [existingTasks] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (existingTasks.length === 0) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        const existingTask = existingTasks[0];

        // Use provided values or fallback to existing ones
        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedDescription = description !== undefined ? description : existingTask.description;
        const updatedCompleted = completed !== undefined ? completed : existingTask.completed;

        const [result] = await pool.query(
            'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?', [updatedTitle, updatedDescription, updatedCompleted, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update task' });
        }
        // Respond with the updated task data
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