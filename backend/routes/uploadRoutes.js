const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/authMiddleware');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Configure multer storage with user-specific folders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userPath = `uploads/${req.user.id}`;
    // Create user-specific directory if it doesn't exist
    require('fs').mkdirSync(userPath, { recursive: true });
    cb(null, userPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Upload file route with user data
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const { priority = 'normal' } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO chotha (
        user_id,
        title,
        type,
        file_path,
        file_url,
        file_size,
        priority,
        indexing_status,
        date_uploaded
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
      RETURNING *`,
      [
        userId,                           // user_id
        file.originalname,                 // title
        file.mimetype,                     // type
        file.path,                          // file_path
        `/uploads/${userId}/${file.filename}`, // file_url
        file.size,                          // file_size
        priority,                          // priority
        'pending'                          // indexing_status
      ]
    );
    

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get files with user filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        c.*,
        u.name as uploaded_by_name,
        u.avatar_url as uploaded_by_avatar
       FROM chotha c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1 
       AND c.title ILIKE $2
       ORDER BY c.date_uploaded DESC
       LIMIT $3 OFFSET $4`,
      [userId, `%${search}%`, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chotha WHERE user_id = $1',
      [userId]
    );

    res.json({
      files: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      currentPage: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Could not fetch files' });
  }
});

// Start indexing route
router.post('/:id/index', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE chotha 
       SET indexing_status = $1 
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      ['completed', req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Indexing error:', error);
    res.status(500).json({ error: 'Indexing failed' });
  }
});

// Delete file route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM chotha WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Could not delete file' });
  }
});

module.exports = router;