const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/authMiddleware');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Get all planner tasks for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      start_date, 
      end_date, 
      priority, 
      status, 
      tag,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = `
      SELECT 
        pt.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'title', c.title,
              'type', c.type,
              'file_url', c.file_url
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) as attached_files
      FROM planner_tasks pt
      LEFT JOIN chotha c ON c.id = ANY(
        CASE 
          WHEN pt.resource_ids IS NOT NULL AND array_length(pt.resource_ids, 1) > 0 
          THEN pt.resource_ids 
          WHEN pt.resource_id IS NOT NULL 
          THEN ARRAY[pt.resource_id]
          ELSE ARRAY[]::integer[]
        END
      )
      WHERE pt.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;

    // Add filters
    if (start_date) {
      query += ` AND pt.start_time >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND pt.end_time <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    
    if (priority) {
      query += ` AND pt.priority = $${paramIndex}`;
      queryParams.push(priority);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND pt.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (tag) {
      query += ` AND $${paramIndex} = ANY(pt.tags)`;
      queryParams.push(tag);
      paramIndex++;
    }

    query += ` GROUP BY pt.id ORDER BY pt.start_time ASC`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM planner_tasks pt 
      WHERE pt.user_id = $1
    `;
    const countResult = await pool.query(countQuery, [userId]);

    res.json({
      tasks: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      currentPage: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Error fetching planner tasks:', error);
    res.status(500).json({ error: 'Failed to fetch  tasks' });
  }
});

// Create new  task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      priority = 'medium',
      tags = [],
      status = 'pending',
      start_time,
      end_time,
      resource_id, // Legacy single file support
      resource_ids, // New multiple files support
      task_type = 'task',
      pomodoro_enabled = false,
      pomodoro_duration = 25
    } = req.body;

    // Validate required fields
    if (!title || !start_time) {
      return res.status(400).json({ error: 'Title and start_time are required' });
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    // Validate status
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
    }

    // Validate task_type
    if (!['task', 'session', 'quiz', 'flashcard', 'study'].includes(task_type)) {
      return res.status(400).json({ error: 'Invalid task_type' });
    }

    // Handle both legacy single file and new multiple files
    const finalResourceIds = resource_ids ? resource_ids : (resource_id ? [resource_id] : null);

    const result = await pool.query(
      `INSERT INTO planner_tasks (
        user_id, title, description, priority, tags, status,
        start_time, end_time, resource_id, resource_ids, task_type,
        pomodoro_enabled, pomodoro_duration, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        userId, title, description, priority, tags, status,
        start_time, end_time, resource_id, finalResourceIds, task_type,
        pomodoro_enabled, pomodoro_duration
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating planner task:', error);
    res.status(500).json({ error: 'Failed to create planner task' });
  }
});

// Update planner task
// router.put('/:taskId', authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { taskId } = req.params;
//     const updateFields = req.body;

//     console.log('Update request received:', { taskId, updateFields });

//     // Remove fields that shouldn't be updated directly
//     delete updateFields.id;
//     delete updateFields.user_id;
//     delete updateFields.created_at;

//     const [prev] = (await pool.query(
//       'SELECT title, priority, status, resource_id, resource_ids, description, task_type, end_time, start_time FROM planner_tasks WHERE id = $1',
//       [taskId]  // Updated from [id] to [taskId]
//     )).rows;

//     // Validate ownership
//     const ownershipCheck = await pool.query(
//       'SELECT id FROM planner_tasks WHERE id = $1 AND user_id = $2',
//       [taskId, userId]
//     );

//     if (ownershipCheck.rows.length === 0) {
//       return res.status(404).json({ error: 'Task not found or access denied' });
//     }

//     // Validate fields if they are present
//     if (updateFields.priority && !['low', 'medium', 'high'].includes(updateFields.priority)) {
//       return res.status(400).json({ error: 'Priority must be low, medium, or high' });
//     }

//     if (updateFields.status && !['pending', 'in_progress', 'completed'].includes(updateFields.status)) {
//       return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
//     }

//     if (updateFields.task_type && !['task', 'session', 'quiz', 'flashcard', 'study'].includes(updateFields.task_type)) {
//       return res.status(400).json({ error: 'Invalid task_type' });
//     }

//     if (updateFields.title && !updateFields.title.trim()) {
//       return res.status(400).json({ error: 'Title cannot be empty' });
//     }

//     // Build dynamic update query
//     const fields = [];
//     const values = [];
//     let paramIndex = 1;

//     Object.keys(updateFields).forEach(key => {
//       if (updateFields[key] !== undefined) {
//         fields.push(`${key} = $${paramIndex}`);
//         values.push(updateFields[key]);
//         paramIndex++;
//       }
//     });

//     if (fields.length === 0) {
//       return res.status(400).json({ error: 'No fields to update' });
//     }

//     fields.push(`updated_at = NOW()`);
//     values.push(taskId, userId);

//     const query = `
//       UPDATE planner_tasks 
//       SET ${fields.join(', ')} 
//       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
//       RETURNING *
//     `;

//     console.log('Executing query:', query);
//     console.log('With values:', values);

//     const result = await pool.query(query, values);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Task not found after update' });
//     }

//     console.log('Update successful:', result.rows[0]);
//     // Generate notification message
//     const message = `✅ Task "${prev.title}" has been updated.`;




//     const insertNotification = `
//       INSERT INTO notification (user_id, message, date, time, notification_type)
//       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)
//       RETURNING *`;
//     await pool.query(insertNotification, [userId, message, 'update']);

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Error updating planner task:', error);
//     console.error('Error details:', error.message);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ 
//       error: 'Failed to update planner task',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

router.put('/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const updateFields = { ...req.body };

    console.log('Update request received:', { taskId, updateFields });

    // Remove fields that shouldn't be updated directly
    delete updateFields.id;
    delete updateFields.user_id;
    delete updateFields.created_at;

    // Fetch the existing record
    const {
      rows: [prev]
    } = await pool.query(
      `SELECT title, priority, status, resource_id, resource_ids,
              description, task_type, end_time, start_time
       FROM planner_tasks
       WHERE id = $1`,
      [taskId]
    );

    if (!prev) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate ownership
    const { rows: ownerRows } = await pool.query(
      `SELECT id FROM planner_tasks WHERE id = $1 AND user_id = $2`,
      [taskId, userId]
    );
    if (ownerRows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    // Field‐value validation
    if (updateFields.priority && !['low','medium','high'].includes(updateFields.priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }
    if (updateFields.status && !['pending','in_progress','completed'].includes(updateFields.status)) {
      return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
    }
    if (updateFields.task_type && !['task','session','quiz','flashcard','study'].includes(updateFields.task_type)) {
      return res.status(400).json({ error: 'Invalid task_type' });
    }
    if (updateFields.title !== undefined && !updateFields.title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    // Build dynamic UPDATE
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(updateFields)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    fields.push(`updated_at = NOW()`);

    // Add WHERE params
    values.push(taskId, userId);

    const query = `
      UPDATE planner_tasks
      SET ${fields.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *
    `;
    console.log('Executing query:', query);
    console.log('With values:', values);

    // Execute and get updated row
    const { rows: updatedRows } = await pool.query(query, values);
    if (updatedRows.length === 0) {
      return res.status(404).json({ error: 'Task not found after update' });
    }
    const updated = updatedRows[0];
    console.log('Update successful:', updated);
    const message = `Task "${prev.title}" updated.`;

    // Insert notification
    const insertNotification = `
      INSERT INTO notification (user_id, message, date, time, notification_type)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)
      RETURNING *
    `;
    await pool.query(insertNotification, [userId, message, 'update']);

    // Return the updated task
    res.status(201).json({
      success: true,
      message,
      notification: updated
    });

  } catch (error) {
    console.error('Error updating planner task:', error);
    res.status(500).json({
      error: 'Failed to update planner task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Delete planner task
router.delete('/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const result = await pool.query(
      'DELETE FROM planner_tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting planner task:', error);
    res.status(500).json({ error: 'Failed to delete planner task' });
  }
});

// Get single task by ID
router.get('/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const result = await pool.query(
      `SELECT 
        pt.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'title', c.title,
              'type', c.type,
              'file_url', c.file_url
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) as attached_files
      FROM planner_tasks pt
      LEFT JOIN chotha c ON c.id = ANY(
        CASE 
          WHEN pt.resource_ids IS NOT NULL AND array_length(pt.resource_ids, 1) > 0 
          THEN pt.resource_ids 
          WHEN pt.resource_id IS NOT NULL 
          THEN ARRAY[pt.resource_id]
          ELSE ARRAY[]::integer[]
        END
      )
      WHERE pt.id = $1 AND pt.user_id = $2
      GROUP BY pt.id`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching planner task:', error);
    res.status(500).json({ error: 'Failed to fetch planner task' });
  }
});

// Auto-suggest tasks based on saved content
router.get('/suggest/auto', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent quizzes and sticky notes that could be suggested as tasks
    const quizzesQuery = `
      SELECT 
        'quiz' as suggestion_type,
        'Review Quiz: ' || c.title as suggested_title,
        'Take quiz based on ' || c.title || ' (' || COUNT(q.id) || ' quiz(es) available)' as suggested_description,
        c.id as resource_id,
        'quiz' as task_type,
        MAX(q.created_at) as created_at
      FROM quiz q
      JOIN chotha c ON q.file_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id, c.title
      ORDER BY MAX(q.created_at) DESC
      LIMIT 5
    `;

    const stickynotesQuery = `
      SELECT 
        'stickynotes' as suggestion_type,
        'Review Flashcards: ' || c.title as suggested_title,
        'Review ' || COUNT(s.id) || ' sticky notes for ' || c.title as suggested_description,
        c.id as resource_id,
        'flashcard' as task_type,
        MAX(s.created_at) as created_at
      FROM stickynotes s
      JOIN chotha c ON s.file_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id, c.title
      ORDER BY MAX(s.created_at) DESC
      LIMIT 5
    `;

    const [quizResults, stickyResults] = await Promise.all([
      pool.query(quizzesQuery, [userId]),
      pool.query(stickynotesQuery, [userId])
    ]);

    const suggestions = [
      ...quizResults.rows,
      ...stickyResults.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting task suggestions:', error);
    res.status(500).json({ error: 'Failed to get task suggestions' });
  }
});

module.exports = router; 