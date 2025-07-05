const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/authMiddleware');
const fsSync = require('fs');
const fs = require('fs').promises;
const pdf = require('pdf-parse');
const { generateEmbeddings, generateSummary } = require('../utils/AI');
const { storeDocumentChunks } = require('../utils/qdrantClient');

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
        u.avatar_url as uploaded_by_avatar,
        annotated.id as annotated_pdf_id,
        annotated.title as annotated_title,
        annotated.file_path as annotated_file_path
       FROM chotha c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN chotha annotated ON c.annotated_pdf_id = annotated.id
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

// Search files route
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT 
        c.*,
        u.name as uploaded_by_name,
        u.avatar_url as uploaded_by_avatar
       FROM chotha c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1 
       AND (
         c.title ILIKE $2 OR
         c.type ILIKE $2
       )
       ORDER BY c.date_uploaded DESC`,
      [userId, `%${query}%`]
    );

    res.json({
      files: result.rows,
      totalCount: result.rows.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
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

// Configure multer for annotated PDF storage (saves as new file)
const annotationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userPath = `uploads/${req.user.id}`;
    // Create user-specific directory if it doesn't exist
    require('fs').mkdirSync(userPath, { recursive: true });
    cb(null, userPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `annotated_${uniqueSuffix}.pdf`);
  }
});

const uploadAnnotated = multer({ 
  storage: annotationStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for annotated PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed for annotations.'));
    }
  }
});

// Save annotated PDF as new file (keeps original)
router.post('/save-annotated', authenticateToken, uploadAnnotated.single('annotatedPdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No annotated PDF uploaded' });
    }

    const { originalFileId } = req.body;
    const userId = req.user.id;

    if (!originalFileId) {
      return res.status(400).json({ error: 'Original file ID is required' });
    }

    // Get original file information from database
    const originalFileQuery = `
      SELECT id, title, type, file_path, user_id 
      FROM chotha 
      WHERE id = $1 AND user_id = $2
    `;
    const originalFileResult = await pool.query(originalFileQuery, [originalFileId, userId]);

    if (originalFileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Original file not found or unauthorized' });
    }

    const originalFile = originalFileResult.rows[0];
    const file = req.file;

    // Insert annotated PDF as new entry in chotha table
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
        userId,                                                    // user_id
        `${originalFile.title} (Annotated)`,                     // title
        file.mimetype,                                            // type
        file.path,                                                // file_path
        `/uploads/${userId}/${file.filename}`,                   // file_url
        file.size,                                               // file_size
        'normal',                                                // priority
        'completed'                                              // indexing_status
      ]
    );

    const annotatedFile = result.rows[0];

    // Update original file to link to annotated version
    await pool.query(
      `UPDATE chotha SET annotated_pdf_id = $1 WHERE id = $2`,
      [annotatedFile.id, originalFileId]
    );

    res.status(201).json({
      message: 'Annotated PDF saved successfully',
      originalFile: originalFile,
      annotatedFile: annotatedFile,
      annotatedFileId: annotatedFile.id
    });

  } catch (error) {
    console.error('Error saving annotated PDF:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to save annotated PDF',
      details: error.message 
    });
  }
});

// Get file information with annotation status
router.get('/:fileId/info', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const fileQuery = `
      SELECT 
        c.*,
        annotated.id as annotated_pdf_id,
        annotated.title as annotated_title,
        annotated.file_path as annotated_file_path,
        annotated.file_url as annotated_file_url,
        annotated.date_uploaded as annotated_date
      FROM chotha c
      LEFT JOIN chotha annotated ON c.annotated_pdf_id = annotated.id
      WHERE c.id = $1 AND c.user_id = $2
    `;
    
    const result = await pool.query(fileQuery, [fileId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    const fileInfo = result.rows[0];
    
    res.json({
      file: {
        id: fileInfo.id,
        title: fileInfo.title,
        type: fileInfo.type,
        file_path: fileInfo.file_path,
        file_url: fileInfo.file_url,
        file_size: fileInfo.file_size,
        date_uploaded: fileInfo.date_uploaded,
        has_annotations: fileInfo.annotated_pdf_id !== null,
        annotated_pdf: fileInfo.annotated_pdf_id ? {
          id: fileInfo.annotated_pdf_id,
          title: fileInfo.annotated_title,
          file_path: fileInfo.annotated_file_path,
          file_url: fileInfo.annotated_file_url,
          date_uploaded: fileInfo.annotated_date
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ 
      error: 'Failed to get file information',
      details: error.message 
    });
  }
});

// Extract text from PDF route with logging and file status tracking
router.post('/extract-text', authenticateToken, async (req, res) => {
  const { file_url } = req.body;
  const userId = req.user.id;

  try {
    // Get file ID from database using file_url
    const fileResult = await pool.query(
      'SELECT id FROM chotha WHERE file_url = $1 AND user_id = $2',
      [file_url, userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    const fileId = fileResult.rows[0].id;

    // Normalize file path
    const relativePath = file_url.startsWith('/') ? file_url.slice(1) : file_url;
    const absolutePath = path.join(__dirname, '..', relativePath);

    const fileName = path.basename(absolutePath); // "1750646129015-432706240.pdf"
    const userDir = path.dirname(absolutePath);   // "uploads/10"
    const statusFilePath = path.join(userDir, `extract_${fileName}.status`);

    try {
      //await fs.writeFile(statusFilePath, 'in_progress');

      const dataBuffer = await fs.readFile(absolutePath);
      const data = await pdf(dataBuffer);

      // Split text into chunks
      const chunks = chunkText(data.text, 1000);
      
      // Process chunks with embeddings and summaries
      const processedChunks = await Promise.all(chunks.map(async (text, index) => {
        const embedding = await generateEmbeddings(text);
        return {
          text,
          embedding,
          index
        };
      }));

      // Store in Qdrant
      const storedCount = await storeDocumentChunks(fileId, processedChunks);

      // Update file status with proper error handling
      try {
        await pool.query(
          `UPDATE chotha 
           SET processing_status = $1,
               indexing_status = $2,
               processed_at = NOW()
           WHERE id = $3`,
          ['vectorized', 'completed', fileId]
        );
      } catch (error) {
        console.error('Failed to update processing status:', error);
        // Continue execution as this is not critical
      }

      res.json({
        success: true,
        chunks: storedCount,
        textPreview: data.text.substring(0, 200) + '...'
      });

    } catch (error) {
      console.error('Text processing error:', error);
      res.status(500).json({
        error: 'Failed to process document',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ 
      error: 'Failed to extract text from PDF',
      details: error.message 
    });
  }
});

// Add semantic search endpoint
router.get('/search/semantic', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 5, fileId } = req.query;
    
    // Generate embedding for search query
    const queryEmbedding = await generateEmbeddings(query);

    // Search in Qdrant
    const results = await searchSimilarChunks(
      queryEmbedding, 
      parseInt(limit),
      fileId ? parseInt(fileId) : null
    );

    res.json({
      results: results.map(r => ({
        text: r.payload.text,
        summary: r.payload.summary,
        score: r.score,
        fileId: r.payload.file_id
      })),
      query,
      total: results.length
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Test Qdrant connection and functionality
router.get('/test-qdrant', authenticateToken, async (req, res) => {
  try {
    const { client } = require('../utils/qdrantClient');
    console.log(client);
    
    // Test connection
    const collections = await client.getCollections();
    console.log('Available collections:', collections);

    // Test collection creation
    await client.createCollection('test_collection', {
      vectors: {
        size: 768,
        distance: "Cosine"
      }
    });

    res.json({ 
      status: 'success',
      message: 'Qdrant connection successful',
      collections: collections 
    });

  } catch (error) {
    console.error('Qdrant test error:', error);
    res.status(500).json({ error: error.message });
  }
});
const chunkText = (text, maxLength = 1000) => {
  const sentences = text.split(/[.!?]+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if ((currentChunk + trimmedSentence).length <= maxLength) {
      currentChunk += trimmedSentence + '. ';
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence + '. ';
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};

module.exports = router;