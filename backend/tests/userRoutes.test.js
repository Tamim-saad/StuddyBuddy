const request = require('supertest');
const express = require('express');
const appConfig = require('../config/appConfig');

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(() => Promise.resolve(true))
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockToken'),
  verify: jest.fn((token, secret, callback) => callback(null, { id: 1 }))
}));

// Mock the middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  })
}));

// Mock the database
jest.mock('../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Import dependencies after mocking
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create express app and apply routes
const app = express();
app.use(express.json());
const userRoutes = require('../routes/userRoutes');
app.use('/api/user', userRoutes);

// Mock user data
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashedPassword123',
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: new Date()
};

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/user/sign-up', () => {
    it('should create a new user successfully', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Email check
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert user

      const response = await request(app)
        .post('/api/user/sign-up')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/user/sign-up')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email address');
    });
  });

  describe('POST /api/user/login', () => {
    it('should login successfully with email and password', async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/api/user/login')
        .send({
          type: 'email',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('GET /api/user/profile', () => {
    it('should get user profile successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer mockToken');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update profile successfully', async () => {
      // Mock both database calls
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Email check
        .mockResolvedValueOnce({ rows: [{ ...mockUser, name: 'Updated Name' }] }); // Update user

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', 'Bearer mockToken')
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
    });
  });

  describe('PUT /api/user/password', () => {
    it('should update password successfully', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockUser] }); // Update password

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', 'Bearer mockToken')
        .send({
          currentPassword: 'oldPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated successfully');
    });
  });
});