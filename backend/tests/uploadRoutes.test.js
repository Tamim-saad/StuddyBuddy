const request = require('supertest');
const express = require('express');

// Mock multer
jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      req.file = {
        originalname: 'test.pdf',
        filename: '1234567890-123456789.pdf',
        path: 'uploads/1/1234567890-123456789.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };
      next();
    })
  }));
  
  multer.diskStorage = jest.fn(() => ({
    destination: jest.fn(),
    filename: jest.fn()
  }));
  
  return multer;
});

// Mock the middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  })
}));

// Mock pg Pool
const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery
  }))
}));

// Mock fs
jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  promises: {
    unlink: jest.fn(() => Promise.resolve())
  }
}));

// Mock AI utilities
jest.mock('../utils/AI', () => ({
  generateEmbeddings: jest.fn(),
  generateSummary: jest.fn()
}));

// Mock Qdrant client
jest.mock('../utils/qdrantClient', () => ({
  storeDocumentChunks: jest.fn()
}));

// Create express app and apply routes
const app = express();
app.use(express.json());
const uploadRoutes = require('../routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Mock file data
const mockFile = {
  id: 1,
  user_id: 1,
  title: 'test.pdf',
  type: 'application/pdf',
  file_path: 'uploads/1/1234567890-123456789.pdf',
  file_url: '/uploads/1/1234567890-123456789.pdf',
  file_size: 1024,
  priority: 'normal',
  indexing_status: 'pending',
  date_uploaded: new Date()
};

describe('Upload Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [mockFile] });
  });

  describe('POST /api/upload', () => {
    it('should upload file successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf')
        .field('priority', 'normal');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'test.pdf');
    });

    it('should handle database error during upload', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('File upload failed');
    });
  });

  describe('GET /api/upload', () => {
    it('should get files with pagination', async () => {
      const mockFiles = [mockFile];
      mockQuery
        .mockResolvedValueOnce({ rows: mockFiles }) // Get files
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Get count

      const response = await request(app)
        .get('/api/upload?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('totalCount', 1);
    });

    it('should handle database error when fetching files', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/upload');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Could not fetch files');
    });
  });

  describe('GET /api/upload/search', () => {
    it('should search files successfully', async () => {
      const mockFiles = [mockFile];
      mockQuery.mockResolvedValueOnce({ rows: mockFiles });

      const response = await request(app)
        .get('/api/upload/search?query=test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('totalCount', 1);
    });

    it('should return 400 when search query is missing', async () => {
      const response = await request(app)
        .get('/api/upload/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should handle database error during search', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/upload/search?query=test');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Search failed');
    });
  });

  describe('POST /api/upload/:id/index', () => {
    it('should start indexing successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockFile] });

      const response = await request(app)
        .post('/api/upload/1/index');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent file', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/upload/999/index');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found or unauthorized');
    });

    it('should handle database error during indexing', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/upload/1/index');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Indexing failed');
    });
  });

  describe('DELETE /api/upload/:id', () => {
    it('should delete file successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockFile] });

      const response = await request(app)
        .delete('/api/upload/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'File deleted successfully');
    });

    it('should return 404 for non-existent file', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/upload/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found or unauthorized');
    });

    it('should handle database error during deletion', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/upload/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Could not delete file');
    });
  });

  describe('File Type Validation', () => {
    it('should accept PDF files', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockFile] });

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf');

      expect(response.status).toBe(201);
    });
  });

  describe('User Authorization', () => {
    it('should only return files for authenticated user', async () => {
      const mockFiles = [mockFile];
      mockQuery
        .mockResolvedValueOnce({ rows: mockFiles })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app)
        .get('/api/upload');

      expect(response.status).toBe(200);
      // Verify that the query includes user_id filter
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.user_id = $1'),
        expect.arrayContaining([1])
      );
    });

    it('should only allow deletion of user\'s own files', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // File not found for user

      const response = await request(app)
        .delete('/api/upload/1');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found or unauthorized');
    });
  });
}); 