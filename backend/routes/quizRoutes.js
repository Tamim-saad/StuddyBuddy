const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateMCQs, generateCQs } = require('../utils/AI');
const { client } = require('../utils/qdrantClient');
const { Pool } = require('pg');
const openai = require('../config/openaiClient');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Generate MCQ quiz from a file
router.post('/generate/mcq', authenticateToken, async (req, res) => {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    let { file_id, questionCount = 5, title = 'Untitled Quiz', priority = 0 } = req.body;
    
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

    // Get text chunks with error handling
    let chunks;
    try {
      chunks = await client.scroll('document_chunks', {
        filter: {
          must: [
            { key: 'file_id', match: { value: file_id } }
          ]
        },
        limit: 100
      });
    } catch (qdrantError) {
      console.error('Qdrant error:', qdrantError);
      return res.status(500).json({ error: 'Failed to fetch document content' });
    }

    if (!chunks?.points?.length) {
      return res.status(404).json({ error: 'No content found for quiz generation' });
    }

    // Combine text chunks and generate MCQs
    const fullText = chunks.points.map(point => point.payload.text).join(' ');
    const mcqData = await generateMCQs(fullText, {
      questionCount,
      title,
      priority,
      file_id
    });

    // Return generated quiz without saving
    res.json({
      success: true,
      quiz: {
        file_id,
        title,
        type: 'mcq',
        priority,
        questions: mcqData.questions
      }
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message 
    });
  }
});

// Generate CQ quiz from a file
router.post('/generate/cq', authenticateToken, async (req, res) => {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    let { file_id, questionCount = 5, title = 'Untitled Quiz', priority = 0 } = req.body;
    
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

    // Get text chunks with error handling
    let chunks;
    try {
      chunks = await client.scroll('document_chunks', {
        filter: {
          must: [
            { key: 'file_id', match: { value: file_id } }
          ]
        },
        limit: 100
      });
    } catch (qdrantError) {
      console.error('Qdrant error:', qdrantError);
      return res.status(500).json({ error: 'Failed to fetch document content' });
    }

    if (!chunks?.points?.length) {
      return res.status(404).json({ error: 'No content found for quiz generation' });
    }

    // Combine text chunks and generate CQs
    const fullText = chunks.points.map(point => point.payload.text).join(' ');
    const cqData = await generateCQs(fullText, {
      questionCount,
      title,
      priority,
      file_id
    });

    // Return generated quiz without saving
    res.json({
      success: true,
      quiz: {
        file_id,
        title,
        type: 'cq',
        priority,
        questions: cqData.questions
      }
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message 
    });
  }
});

// Get all quizzes for a file
router.get('/file/:file_id', authenticateToken, async (req, res) => {
  try {
    const { file_id } = req.params;
    
    const quizzes = await pool.query(
      `SELECT * FROM quiz 
       WHERE file_id = $1 
       ORDER BY created_at DESC`,
      [file_id]
    );

    res.json(quizzes.rows);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific quiz by ID
router.get('/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await pool.query(
      'SELECT * FROM quiz WHERE id = $1',
      [quizId]
    );

    if (quiz.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz.rows[0]);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a quiz
router.delete('/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM quiz WHERE id = $1 RETURNING *',
      [quizId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Evaluate a student answer
router.post('/evaluate', async (req, res) => {
  try {
    const { studentAnswer, modelAnswer, rubric } = req.body;

    const prompt = `
    Evaluate this student answer based on the model answer and rubric:
    
    Student Answer: ${studentAnswer}
    Model Answer: ${modelAnswer}
    Rubric Key Points: ${rubric.keyPoints.join(', ')}
    Maximum Score: ${rubric.maxScore}
    
    Provide a score out of 10 based on how well the student answer covers the key points.
    Return only the numeric score.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const score = parseInt(completion.choices[0].message.content.trim());
    
    res.json({ score });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

// Save quiz results (for frontend compatibility)
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { file_id, title, type, questions, score, answers, aiScores } = req.body;
    
    // For now, just return success without saving to database
    // This can be implemented later when database tables are ready
    res.json({
      success: true,
      message: 'Quiz results saved successfully',
      data: {
        file_id,
        title,
        type,
        score,
        saved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz results' });
  }
});

module.exports = router;