const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateStickyNotes } = require('../utils/stickynotesGenerator');
const { client } = require('../utils/qdrantClient');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Generate sticky notes from a file
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    let { file_id, noteCount = 3 } = req.body;
    
    // Validate input
    if (!file_id) {
      return res.status(400).json({ error: 'file_id is required' });
    }

    // Parse file_id to integer
    file_id = parseInt(file_id);
    if (isNaN(file_id)) {
      return res.status(400).json({ error: 'Invalid file_id format' });
    }

    // Verify file exists
    const fileResult = await pool.query(
      'SELECT * FROM chotha WHERE id = $1',
      [file_id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get text chunks from Qdrant
    const chunks = await client.scroll('document_chunks', {
      filter: {
        must: [{ key: 'file_id', match: { value: file_id } }]
      },
      limit: 100
    });

    if (!chunks?.points?.length) {
      return res.status(404).json({ error: 'No content found for sticky notes generation' });
    }

    const fullText = chunks.points.map(point => point.payload.text).join(' ');
    const generatedNotes = await generateStickyNotes(fullText, {
      noteCount,
      file_id
    });

    // Return generated notes WITHOUT saving to database
    // Notes will only be saved when user explicitly clicks "Save"
    res.json({
      success: true,
      stickynotes: generatedNotes.notes,
      title: generatedNotes.title,
      file_id: file_id,
      saved: false // Notes are not saved automatically
    });

  } catch (error) {
    console.error('Sticky notes generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sticky notes for a file
router.get('/file/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(
      `SELECT id, file_id, front, back, tags, importance, title, created_at 
       FROM stickynotes 
       WHERE file_id = $1 
       ORDER BY created_at DESC`,
      [fileId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sticky notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save sticky notes
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { file_id, notes, title } = req.body;

    if (!file_id || !notes || !Array.isArray(notes)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Insert notes to database
    const insertedNotes = [];
    for (const note of notes) {
      // Ensure tags is an array and handle it properly for PostgreSQL
      const tags = Array.isArray(note.tags) ? note.tags : [];
      
      const result = await pool.query(
        `INSERT INTO stickynotes (
          file_id, 
          front, 
          back, 
          tags, 
          importance,
          title,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *`,
        [file_id, note.front, note.back, tags, note.importance, title]
      );
      insertedNotes.push(result.rows[0]);
    }

    console.log(`Sticky notes saved to database: ${insertedNotes.length} notes`);
    res.json({
      success: true,
      stickynotes: insertedNotes
    });

  } catch (error) {
    console.error('Error saving sticky notes:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;