const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    // Mock successful authentication
    req.user = { 
      id: 1,
      email: 'test@test.com'
    };
    next();
  }
}));

jest.mock('../utils/stickynotesGenerator', () => ({
  generateStickyNotes: jest.fn()
}));

jest.mock('../utils/qdrantClient', () => ({
  client: {
    scroll: jest.fn()
  }
}));

// Mock PostgreSQL Pool
const mockPool = {
  query: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Import after mocking
const { generateStickyNotes } = require('../utils/stickynotesGenerator');
const { client } = require('../utils/qdrantClient');
const { Pool } = require('pg');

// Create express app and apply routes
const app = express();
app.use(express.json());
const stickynotesRoutes = require('../routes/stickynotesRoutes');
app.use('/api/stickynotes', stickynotesRoutes);

describe('Stickynotes Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  describe('POST /generate', () => {
    it('should generate sticky notes successfully', async () => {
      const mockNotes = {
        notes: [{ front: 'Test Front', back: 'Test Back' }],
        title: 'Test Notes'
      };

      // Mock successful database query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Test File' }]
      });

      // Mock successful Qdrant response
      client.scroll.mockResolvedValueOnce({
        points: [{ payload: { text: 'Test content' } }]
      });

      // Mock successful sticky notes generation
      generateStickyNotes.mockResolvedValueOnce(mockNotes);

      const response = await request(app)
        .post('/api/stickynotes/generate')
        .send({ file_id: 1 })
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body.stickynotes).toBeDefined();
    });
  });

  describe('GET /file/:fileId', () => {
    it('should fetch sticky notes for a file', async () => {
      const mockNotes = [
        { id: 1, front: 'Note 1', back: 'Back 1' },
        { id: 2, front: 'Note 2', back: 'Back 2' }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockNotes
      });

      const response = await request(app)
        .get('/api/stickynotes/file/1')
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /save', () => {
    it('should save sticky notes successfully', async () => {
      const mockNote = {
        front: 'Test Front',
        back: 'Test Back'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockNote, id: 1 }]
      });

      const response = await request(app)
        .post('/api/stickynotes/save')
        .send({
          file_id: 1,
          notes: [mockNote],
          title: 'Test Notes'
        })
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});