// backend/routes/annotationRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// In-memory storage for development (replace with database in production)
let annotations = {};

// Get annotations for a file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // For development, store in JSON file
    const annotationPath = path.join(__dirname, '../data/annotations.json');
    
    try {
      const data = await fs.readFile(annotationPath, 'utf8');
      const allAnnotations = JSON.parse(data);
      const fileAnnotations = allAnnotations[fileId] || {};
      
      res.json({
        success: true,
        annotations: fileAnnotations
      });
    } catch (error) {
      // File doesn't exist yet, return empty annotations
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
    const { annotations: newAnnotations } = req.body;
    
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
    
    // Update annotations for this file
    allAnnotations[fileId] = newAnnotations;
    
    // Save back to file
    await fs.writeFile(annotationPath, JSON.stringify(allAnnotations, null, 2));
    
    res.json({
      success: true,
      message: 'Annotations saved successfully'
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
