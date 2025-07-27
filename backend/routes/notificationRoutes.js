const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = new Pool({ connectionString: process.env.POSTGRES_URI });

// GET all notifications for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const query = `
      SELECT * FROM notification 
      WHERE user_id = $1
      ORDER BY date DESC, time DESC
      LIMIT 50`;
      
    const result = await pool.query(query, [user_id]);
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

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

      // ◼️ Generate a detailed "what changed" message
      message = generateUpdateMessage(
        title,
        task_type,
        priority,
        status,
        prev
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
  return `New task "${title}" has been created as "${task_type}" with priority "${priority}".`;
}

// Detailed update message generator
function generateUpdateMessage(title, task_type, priority, status, previous) {
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

  return changes.length > 0 
    ? `The ${task_type || 'item'} "${title}" was updated: ${changes.join(', ')}.`
    : `The ${task_type || 'item'} "${title}" was updated.`;
}
// Mark a notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification_id = parseInt(req.params.id);
    const user_id = req.user.id;
    
    console.log(`Attempting to mark notification ${notification_id} as read for user ${user_id}`);
    
    // Validate notification_id is a valid number
    if (isNaN(notification_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification ID'
      });
    }
    
    // Update notification
    const update = `
      UPDATE notification
      SET read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *`;
      
    const result = await pool.query(update, [notification_id, user_id]);
    
    console.log(`Query result: ${result.rows.length} rows affected`);
    
    if (result.rows.length === 0) {
      // Check if notification exists at all
      const checkExists = await pool.query('SELECT id, user_id FROM notification WHERE id = $1', [notification_id]);
      if (checkExists.rows.length === 0) {
        console.log(`Notification ${notification_id} does not exist`);
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      } else {
        console.log(`Notification ${notification_id} exists but belongs to user ${checkExists.rows[0].user_id}, not ${user_id}`);
        return res.status(403).json({
          success: false,
          error: 'Notification not found or access denied'
        });
      }
    }
    
    console.log(`Successfully marked notification ${notification_id} as read`);
    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error in mark as read:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    console.log(`Attempting to mark all notifications as read for user ${user_id}`);
    
    // Update all notifications for the user
    const update = `
      UPDATE notification
      SET read = true
      WHERE user_id = $1 AND read = false
      RETURNING *`;
      
    const result = await pool.query(update, [user_id]);
    
    console.log(`Marked ${result.rowCount} notifications as read for user ${user_id}`);
    
    res.json({
      success: true,
      count: result.rowCount,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error in mark all as read:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
  }
});


module.exports = router;
