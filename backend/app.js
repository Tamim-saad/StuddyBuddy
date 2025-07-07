require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: [
    "http://localhost:3000",      // Development frontend (original)
    "http://localhost:3001",      // Development frontend (alternate port)
    "http://localhost",           // Local production
    "http://127.0.0.1:3000",      // Alternative localhost
    "http://127.0.0.1:3001",      // Alternative localhost (alternate port)
    "http://studdybuddy.centralindia.cloudapp.azure.com", // Your Azure domain
    "https://studdybuddy.centralindia.cloudapp.azure.com", // HTTPS Azure domain
    process.env.FRONTEND_URL,     // Environment variable (Azure VM)
    process.env.REACT_APP_BASE_URL?.replace(':5000', '').replace(':4000', '') // Frontend URL without port
  ].filter(Boolean), // Remove any undefined values
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP entirely for PDF viewer compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false // Disable X-Frame-Options to allow iframe embedding
}));
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve uploads with proper MIME types for WebAssembly files
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    // Allow iframe embedding for PDF files
    if (filePath.endsWith('.pdf')) {
      res.set('X-Frame-Options', 'SAMEORIGIN');
      res.set('Content-Security-Policy', 'frame-ancestors \'self\' http://localhost:3000 http://localhost:3001');
      res.set('Content-Type', 'application/pdf');
    }
    if (filePath.endsWith('.wasm')) {
      res.set('Content-Type', 'application/wasm');
    }
  }
}));

// Route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const annotationRoutes = require("./routes/annotationRoutes");
const quizRoutes = require('./routes/quizRoutes');
const stickynotesRoutes = require('./routes/stickynotesRoutes');

// Mount routes

app.use("/api/user", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/annotations", annotationRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/stickynotes', stickynotesRoutes);

app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to our app" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = app;
