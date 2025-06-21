const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const appConfig = require('../config/appConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
require("dotenv").config();

// Mock dependencies

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../middleware/authMiddleware');

// Create express app and apply routes
const app = express();
app.use(express.json());

// Import routes after mocks
const userRoutes = require('../routes/userRoutes');
app.use('/api/user', userRoutes);

