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

// Serve Nutrient SDK assets with proper MIME types and CORS headers
const path = require('path');

// Add CORS middleware specifically for nutrient-sdk routes
app.use('/nutrient-sdk', (req, res, next) => {
  // Set comprehensive CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use('/nutrient-sdk', express.static(path.join(__dirname, '../frontend/public/nutrient-sdk'), {
  setHeaders: (res, filePath) => {
    // Additional CORS headers for static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set MIME type for WebAssembly files
    if (filePath.endsWith('.wasm')) {
      res.set('Content-Type', 'application/wasm');
    }
    // Set MIME type for JavaScript files
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
    }
    // Set MIME type for module files
    if (filePath.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
    }
    // Set MIME type for data files
    if (filePath.endsWith('.dat')) {
      res.set('Content-Type', 'application/octet-stream');
    }
    // Set MIME type for JSON files
    if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json; charset=utf-8');
    }
    // Set Cache-Control for better performance
    res.set('Cache-Control', 'public, max-age=3600');
  }
}));

// Route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const annotationRoutes = require("./routes/annotationRoutes");
// Mount routes

app.use("/api/user", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/annotations", annotationRoutes);

app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to our app" });
});

module.exports = app;
