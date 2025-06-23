const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

// Mock dependencies
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('multer', () => {
  return jest.fn().mockImplementation(() => ({
    single: () => (req, res, next) => {
      req.file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        path: 'uploads/test.pdf'
      };
      next();
    }
  }));
});

// Create express app and apply routes
const app = express();
app.use(express.json());

// Import routes after mocks
const uploadRoutes = require('../routes/uploadRoutes');
app.use('/api', uploadRoutes);