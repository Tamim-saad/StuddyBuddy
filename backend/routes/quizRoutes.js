const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateMCQs, generateCQs } = require('../utils/AI');
const { client } = require('../utils/qdrantClient');
const { Pool } = require('pg');
const gemini = require('../config/geminiClient');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI
});

// Generate MCQ quiz from a file
router.post('/generate/mcq', authenticateToken, async (req, res) => {
  try {
    // Validate API key
   console.log("Hello");

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
    console.log("File result:", fileResult.rows);

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
        limit: 1000
      });
    } catch (qdrantError) {
      console.error('Qdrant error:', qdrantError);
      return res.status(500).json({ error: 'Failed to fetch document content' });
    }
    console.log("Chunks fetched:", chunks);

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

    // Debug logging
    console.log('MCQ Data:', JSON.stringify(mcqData, null, 2));
    console.log('Questions:', JSON.stringify(mcqData.questions, null, 2));

    // Return generated quiz without saving
    const response = {
      success: true,
      quiz: {
        file_id,
        title,
        type: 'mcq',
        priority,
        questions: mcqData.questions
      }
    };
    
    console.log('Response to send:', JSON.stringify(response, null, 2));
    res.json(response);

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
    let { file_id, questionCount = 2, title = 'Untitled Quiz', priority = 0 } = req.body;
    
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

    // Debug logging
    console.log('CQ Data:', JSON.stringify(cqData, null, 2));
    console.log('Questions:', JSON.stringify(cqData.questions, null, 2));

    // Return generated quiz without saving
    const response = {
      success: true,
      quiz: {
        file_id,
        title,
        type: 'cq',
        priority,
        questions: cqData.questions
      }
    };
    
    console.log('Response to send:', JSON.stringify(response, null, 2));
    res.json(response);

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
    const userId = req.user.id;
    
    const quizzesQuery = `
      SELECT 
        q.id,
        q.file_id,
        q.title,
        q.type,
        q.priority,
        q.questions,
        q.created_at,
        c.title as file_title,
        qm.score
      FROM quiz q
      LEFT JOIN chotha c ON q.file_id = c.id
      LEFT JOIN quiz_marks qm ON q.id = qm.quiz_id AND qm.student_id = $2
      WHERE q.file_id = $1 
      ORDER BY q.created_at DESC
    `;

    const result = await pool.query(quizzesQuery, [file_id, userId]);
    
    const quizzes = result.rows.map(row => ({
      id: row.id,
      file_id: row.file_id,
      title: row.title,
      type: row.type,
      priority: row.priority,
      questions: row.questions,
      created_at: row.created_at,
      file_title: row.file_title,
      score: row.score,
      question_count: row.questions ? row.questions.length : 0
    }));

    res.json(quizzes);
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

    const result = await gemini.generateContent(prompt);
    const response = result.response.text().trim();
    const score = parseInt(response);
    
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
    
    // Validate required fields
    if (!file_id || !title || !type || !questions) {
      return res.status(400).json({ error: 'Missing required fields: file_id, title, type, questions' });
    }

    // Parse file_id to integer
    const fileIdInt = parseInt(file_id);
    if (isNaN(fileIdInt)) {
      return res.status(400).json({ error: 'Invalid file_id format' });
    }

    // Verify file exists
    const fileResult = await pool.query(
      'SELECT id FROM chotha WHERE id = $1',
      [fileIdInt]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Save quiz to database
    const insertQuizQuery = `
      INSERT INTO quiz (file_id, title, type, questions, priority) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, created_at
    `;
    
    const priority = req.body.priority || 'medium';
    const quizResult = await pool.query(insertQuizQuery, [
      fileIdInt,
      title,
      type,
      JSON.stringify(questions),
      priority
    ]);

    const savedQuiz = quizResult.rows[0];

    // If score is provided, save it to quiz_marks table
    if (score !== undefined && req.user && req.user.id) {
      const insertMarkQuery = `
        INSERT INTO quiz_marks (quiz_id, student_id, score) 
        VALUES ($1, $2, $3)
      `;
      
      await pool.query(insertMarkQuery, [
        savedQuiz.id,
        req.user.id,
        parseInt(score) || 0
      ]);
    }

    res.json({
      success: true,
      message: 'Quiz saved successfully',
      data: {
        id: savedQuiz.id,
        file_id: fileIdInt,
        title,
        type,
        questions: questions,
        priority,
        score: score || null,
        created_at: savedQuiz.created_at,
        saved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz results' });
  }
});

// Get saved quizzes for the authenticated user
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];
    
    if (type && (type === 'mcq' || type === 'cq')) {
      whereClause = 'WHERE q.type = $3';
      queryParams.push(type);
    }

    const savedQuizzesQuery = `
      SELECT 
        q.id,
        q.file_id,
        q.title,
        q.type,
        q.priority,
        q.questions,
        q.created_at,
        c.title as file_title,
        qm.score
      FROM quiz q
      LEFT JOIN chotha c ON q.file_id = c.id
      LEFT JOIN quiz_marks qm ON q.id = qm.quiz_id AND qm.student_id = $${queryParams.length + 1}
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    queryParams.push(userId);
    
    const result = await pool.query(savedQuizzesQuery, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM quiz q 
      ${whereClause}
    `;
    
    const countParams = type && (type === 'mcq' || type === 'cq') ? [type] : [];
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    const quizzes = result.rows.map(row => ({
      id: row.id,
      file_id: row.file_id,
      title: row.title,
      type: row.type,
      priority: row.priority,
      questions: row.questions,
      created_at: row.created_at,
      file_title: row.file_title,
      score: row.score,
      question_count: row.questions ? row.questions.length : 0
    }));

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching saved quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch saved quizzes' });
  }
});

// Get a specific saved quiz by ID
router.get('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz ID' });
    }

    const quizQuery = `
      SELECT 
        q.id,
        q.file_id,
        q.title,
        q.type,
        q.priority,
        q.questions,
        q.created_at,
        c.title as file_title,
        qm.score
      FROM quiz q
      LEFT JOIN chotha c ON q.file_id = c.id
      LEFT JOIN quiz_marks qm ON q.id = qm.quiz_id AND qm.student_id = $2
      WHERE q.id = $1
    `;
    
    const result = await pool.query(quizQuery, [quizId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: quiz.id,
        file_id: quiz.file_id,
        title: quiz.title,
        type: quiz.type,
        priority: quiz.priority,
        questions: quiz.questions,
        created_at: quiz.created_at,
        file_title: quiz.file_title,
        score: quiz.score,
        question_count: quiz.questions ? quiz.questions.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Delete a saved quiz
router.delete('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz ID' });
    }

    // Delete the quiz (this will cascade delete quiz_marks due to foreign key constraint)
    const deleteResult = await pool.query(
      'DELETE FROM quiz WHERE id = $1 RETURNING id',
      [quizId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

module.exports = router;