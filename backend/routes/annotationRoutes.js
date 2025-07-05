// backend/routes/annotationRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/annotation-images');
    // Create directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'annotation-' + uniqueName + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image for annotations
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    const imageUrl = `/uploads/annotation-images/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload image' 
    });
  }
});

// In-memory storage for development (replace with database in production)
let annotations = {};

// Get annotations for a file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    console.log('📖 Loading annotations for file:', fileId);
    
    // For development, store in JSON file
    const annotationPath = path.join(__dirname, '../data/annotations.json');
    
    try {
      const data = await fs.readFile(annotationPath, 'utf8');
      const allAnnotations = JSON.parse(data);
      const fileData = allAnnotations[fileId];
      
      if (fileData) {
        // Handle both old and new format
        const annotations = fileData.annotations || fileData;
        const metadata = fileData.metadata || {};
        
        console.log('✅ Found annotations for file:', fileId, 'with', 
          Object.keys(annotations).length, 'pages');
        
        res.json({
          success: true,
          annotations: annotations,
          scale: metadata.scale,
          rotation: metadata.rotation,
          totalPages: metadata.totalPages,
          lastUpdated: metadata.lastUpdated,
          annotationCount: metadata.annotationCount
        });
      } else {
        console.log('📝 No annotations found for file:', fileId);
        res.status(404).json({ 
          success: false, 
          message: 'No annotations found',
          annotations: {}
        });
      }
    } catch (error) {
      // File doesn't exist yet, return empty annotations
      console.log('📁 Annotations file not found, returning empty');
      res.json({
        success: true,
        annotations: {}
      });
    }
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch annotations' 
    });
  }
});

// Save annotations for a file
router.post('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { annotations: newAnnotations, totalPages, scale, rotation } = req.body;
    
    console.log('💾 Saving annotations for file:', fileId);
    console.log('📄 Pages with annotations:', Object.keys(newAnnotations || {}).length);
    
    // For development, store in JSON file
    const annotationPath = path.join(__dirname, '../data/annotations.json');
    const dataDir = path.dirname(annotationPath);
    
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    let allAnnotations = {};
    
    // Read existing annotations
    try {
      const data = await fs.readFile(annotationPath, 'utf8');
      allAnnotations = JSON.parse(data);
    } catch {
      // File doesn't exist, start with empty object
    }
    
    // Update annotations for this file with metadata
    allAnnotations[fileId] = {
      annotations: newAnnotations,
      metadata: {
        totalPages,
        scale,
        rotation,
        lastUpdated: new Date().toISOString(),
        annotationCount: Object.values(newAnnotations || {}).reduce((total, pageAnnotations) => total + pageAnnotations.length, 0)
      }
    };
    
    // Save back to file
    await fs.writeFile(annotationPath, JSON.stringify(allAnnotations, null, 2));
    
    console.log('✅ Annotations saved successfully for file:', fileId);
    
    res.json({
      success: true,
      message: 'Annotations saved successfully',
      annotationCount: allAnnotations[fileId].metadata.annotationCount
    });
  } catch (error) {
    console.error('Error saving annotations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save annotations' 
    });
  }
});

// Delete annotations for a file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const annotationPath = path.join(__dirname, '../data/annotations.json');
    
    let allAnnotations = {};
    
    // Read existing annotations
    try {
      const data = await fs.readFile(annotationPath, 'utf8');
      allAnnotations = JSON.parse(data);
    } catch {
      // File doesn't exist, nothing to delete
      return res.json({
        success: true,
        message: 'No annotations found to delete'
      });
    }
    
    // Remove annotations for this file
    delete allAnnotations[fileId];
    
    // Save back to file
    await fs.writeFile(annotationPath, JSON.stringify(allAnnotations, null, 2));
    
    res.json({
      success: true,
      message: 'Annotations deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting annotations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete annotations' 
    });
  }
});

module.exports = router;
