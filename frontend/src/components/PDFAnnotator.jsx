// src/components/PDFAnnotator.jsx
import React, { useEffect, useRef, useState } from "react";
import { annotationService } from "../services/annotationService";
import "./PDFAnnotator.css";

const PDFAnnotator = ({ fileId, filePath, onSave, onClose }) => {
  const containerRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initializeNutrient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import Nutrient SDK dynamically
        const NutrientSDK = await import("@nutrient-sdk/viewer");
        
        const pdfUrl = annotationService.getPDFUrl(filePath);
        
        // Initialize Nutrient Web SDK
        const viewer = await NutrientSDK.load({
          container: containerRef.current,
          document: pdfUrl,
          // Enable all annotation tools
          initialViewState: {
            enableAnnotationCreation: true,
            enableDocumentEditing: true,
            showToolbar: true,
            showAnnotationCreationTools: true,
          },
          // Customize UI
          baseUrl: `${window.location.origin}/nutrient-sdk/`,
          // Add custom CSS if needed
          styleSheets: [
            `${window.location.origin}/nutrient-sdk/nutrient-viewer.css`
          ],
        });

        // Set up event listeners for tracking changes
        viewer.addEventListener("annotationsChange", () => {
          console.log("Annotations changed");
        });

        viewer.addEventListener("documentLoaded", () => {
          console.log("Document loaded successfully");
          setIsLoading(false);
        });

        setInstance(viewer);

      } catch (err) {
        console.error("Error initializing Nutrient SDK:", err);
        setError("Failed to load PDF annotation viewer. Please try again.");
        setIsLoading(false);
      }
    };

    initializeNutrient();

    // Cleanup
    return () => {
      if (instance) {
        instance.dispose();
      }
    };
  }, [filePath]);

  const handleSave = async () => {
    if (!instance) return;

    try {
      setIsSaving(true);
      
      // Export the annotated PDF
      const annotatedPDF = await instance.exportPDF();
      
      // Convert to blob
      const blob = new Blob([annotatedPDF], { type: 'application/pdf' });
      
      // Save using our annotation service
      const result = await annotationService.saveAnnotatedPDF(fileId, blob);
      
      console.log("Annotations saved successfully:", result);
      
      // Call parent callback
      if (onSave) {
        onSave(result);
      }
      
    } catch (err) {
      console.error("Error saving annotations:", err);
      setError("Failed to save annotations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (instance) {
      instance.dispose();
    }
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="pdf-annotator">
        <div className="annotator-header">
          <h3>PDF Annotator</h3>
          <button onClick={handleClose} className="close-btn">
            Close
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading PDF annotation editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-annotator">
        <div className="annotator-header">
          <h3>PDF Annotator</h3>
          <button onClick={handleClose} className="close-btn">
            Close
          </button>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h4>⚠️ Error Loading PDF</h4>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="retry-btn">
                Retry
              </button>
              <a 
                href={annotationService.getPDFUrl(filePath)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-pdf-btn"
              >
                📄 View PDF Instead
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="pdf-annotator">
      <div className="annotator-header">
        <h3>PDF Annotator</h3>
        <div className="annotator-controls">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="save-btn"
          >
            {isSaving ? 'Saving...' : '💾 Save Annotations'}
          </button>
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
      </div>
      
      {/* Nutrient SDK Container */}
      <div 
        ref={containerRef} 
        className="nutrient-container"
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 80px)',
          border: 'none'
        }}
      />
      
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-message">
            <div className="loading-spinner"></div>
            <span>Saving annotations...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFAnnotator;
