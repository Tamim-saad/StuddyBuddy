const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = new Pool({ connectionString: process.env.POSTGRES_URI });

// POST notification (create/update)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      task_type,
      priority,
      status,
      action = 'create',
      id       // ← the ID of the task being updated
    } = req.body;

    const user_id = req.user.id;
    let message;

    if (action === 'update') {
      // ◼️ Fetch the previous state of that task
      const [prev] = (await pool.query(
        'SELECT title, priority, status, resource_id, resource_ids, description, task_type FROM planner_tasks WHERE id = $1',
        [id]
      )).rows;

      // ◼️ Generate a detailed “what changed” message
      message = generateUpdateMessage(
        title,
        task_type,
        priority,
        status,
        prev,
        attached_files
      );

    } else {
      // create (or other actions)
      message = (action === 'create')
        ? generateCreateMessage(title, task_type, priority)
        : `⚙️ Action "${action}" performed on ${task_type || 'item'} "${title}".`;
    }

    // Insert into notification table
    const insert = `
      INSERT INTO notification (user_id, message, date, time, notification_type)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)
      RETURNING *`;
    const result = await pool.query(insert, [user_id, message, action]);

    res.status(201).json({
      success: true,
      message,
      notification: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Create message for new tasks
function generateCreateMessage(title, task_type, priority) {
  console.log(`Creating notification for new task: ${title}`);  
  return `✅ New task "${title}" has been created as "${task_type}" with priority "${priority}".`;
}

// Detailed update message generator
function generateUpdateMessage(title, task_type, priority, status, previous, attached_files) {
  const changes = [];

  if (previous.title !== title) {
    changes.push(`title changed from "${previous.title}" to "${title}"`);
  }
  if (previous.priority !== priority) {
    changes.push(`priority changed from "${previous.priority}" to "${priority}"`);
  }
  if (previous.status !== status) {
    changes.push(`status changed from "${previous.status}" to "${status}"`);
  }
  if (JSON.stringify(previous.attached_files) !== JSON.stringify(attached_files)) {
    changes.push(`attached files updated`);
  }

  return `🔄 The ${task_type || 'item'} "${title}" was updated: ${changes.join(', ')}.`;
}

module.exports = router;
