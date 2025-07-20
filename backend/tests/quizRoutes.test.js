const request = require('supertest');
const express = require('express');

// Mock dependencies
const mockPool = {
  query: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  }
}));

jest.mock('../utils/AI', () => ({
  generateMCQs: jest.fn(),
  generateCQs: jest.fn()
}));

jest.mock('../utils/qdrantClient', () => ({
  client: {
    scroll: jest.fn()
  }
}));

// Import after mocking
const { generateMCQs, generateCQs } = require('../utils/AI');
const { client } = require('../utils/qdrantClient');

// Create express app and apply routes
const app = express();
app.use(express.json());
const quizRoutes = require('../routes/quizRoutes');
app.use('/api/quiz', quizRoutes);

describe('Quiz Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  describe('POST /generate/mcq', () => {
    it('should generate MCQ quiz successfully', async () => {
      const mockQuestions = {
        questions: [
          {
            question: 'Test Question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            explanation: 'Test explanation'
          }
        ]
      };

      // Mock file query
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Test File' }]
      });

      // Mock Qdrant response
      client.scroll.mockResolvedValueOnce({
        points: [{ payload: { text: 'Test content' } }]
      });

      // Mock MCQ generation
      generateMCQs.mockResolvedValueOnce(mockQuestions);

      const response = await request(app)
        .post('/api/quiz/generate/mcq')
        .send({ file_id: 1 })
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body.quiz).toHaveProperty('questions');
      expect(response.body.quiz.type).toBe('mcq');
    });
  });

  describe('POST /generate/cq', () => {
    it('should generate CQ quiz successfully', async () => {
      const mockQuestions = {
        questions: [
          {
            question: 'Test CQ',
            modelAnswer: 'Model answer',
            rubric: {
              keyPoints: ['Point 1', 'Point 2'],
              maxScore: 10
            }
          }
        ]
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Test File' }]
      });

      client.scroll.mockResolvedValueOnce({
        points: [{ payload: { text: 'Test content' } }]
      });

      generateCQs.mockResolvedValueOnce(mockQuestions);

      const response = await request(app)
        .post('/api/quiz/generate/cq')
        .send({ file_id: 1 })
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body.quiz).toHaveProperty('questions');
      expect(response.body.quiz.type).toBe('cq');
    });
  });

  describe('GET /file/:file_id', () => {
    it('should fetch quizzes for a file', async () => {
      const mockQuizzes = [
        { id: 1, title: 'Quiz 1', type: 'mcq' },
        { id: 2, title: 'Quiz 2', type: 'cq' }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockQuizzes
      });

      const response = await request(app)
        .get('/api/quiz/file/1')
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /save', () => {
    it('should save quiz successfully', async () => {
      const mockQuiz = {
        file_id: 1,
        title: 'Test Quiz',
        type: 'mcq',
        questions: []
      };

      // Mock file existence check
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });

      // Mock quiz insertion
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, created_at: new Date().toISOString() }]
      });

      const response = await request(app)
        .post('/api/quiz/save')
        .send(mockQuiz)
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('POST /evaluate', () => {
    // Adding longer timeout for AI evaluation
    it('should evaluate answer successfully', async () => {
      const mockRequest = {
        studentAnswer: 'Test answer',
        modelAnswer: 'Model answer',
        rubric: {
          keyPoints: ['Point 1', 'Point 2'],
          maxScore: 10
        }
      };

      const response = await request(app)
        .post('/api/quiz/evaluate')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
    }, 15000); // Increasing timeout to 15 seconds
  });
});