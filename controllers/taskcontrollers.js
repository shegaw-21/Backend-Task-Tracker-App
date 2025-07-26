// backend/controllers/taskController.js
const pool = require('../config/db'); // Import the database connection pool

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

module.exports = {
    getTasks,
    addTask,
    deleteTask,
    updateTask
};