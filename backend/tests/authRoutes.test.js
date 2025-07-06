const request = require('supertest');
const express = require('express');
const appConfig = require('../config/appConfig');

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword'))
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockToken')
}));

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken
  }))
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
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');

// Create express app and apply routes
const app = express();
app.use(express.json());
const authRoutes = require('../routes/authRoutes');
app.use('/api/auth', authRoutes);

// Mock user data
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: new Date()
};

const mockGooglePayload = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg'
};

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/google-login', () => {
    it('should login existing user with Google token successfully', async () => {
      // Mock Google token verification
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock database query for existing user
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'mockGoogleToken'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should create new user and login with Google token', async () => {
      // Mock Google token verification
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock database queries: first for existing user (not found), then for insert
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert new user

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'mockGoogleToken'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should return 500 for invalid Google token', async () => {
      // Mock Google token verification failure
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'invalidToken'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Authentication failed');
    });

    it('should handle missing token', async () => {
      const response = await request(app)
        .post('/api/auth/google-login')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Authentication failed');
    });
  });

  describe('Token Generation', () => {
    it('should generate access and refresh tokens', async () => {
      // Mock Google token verification
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock database query for existing user
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'mockGoogleToken'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Verify JWT tokens were generated
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          email: mockUser.email,
          id: mockUser.id,
        },
        appConfig.AUTH.JWT_SECRET,
        { expiresIn: "1d" }
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          email: mockUser.email,
          id: mockUser.id,
        },
        appConfig.AUTH.JWT_SECRET,
        { expiresIn: "7d" }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle bcrypt hashing errors', async () => {
      // Mock Google token verification
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock database queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockRejectedValueOnce(new Error('Database error')); // Insert error

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'mockGoogleToken'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Authentication failed');
    });
  });

  describe('User Object Preparation', () => {
    it('should remove password_hash from user object', async () => {
      // Mock Google token verification
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock database query with user that has password_hash
      const userWithPassword = { ...mockUser, password_hash: 'hashedPassword123' };
      pool.query.mockResolvedValueOnce({ rows: [userWithPassword] });

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({
          token: 'mockGoogleToken'
        });

      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty('password_hash');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });
  });
}); 