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
    const initializeNutrientViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Ensure container exists and has dimensions
        const container = document.getElementById('pdf-annotator-container');
        if (!container) {
          throw new Error("PDF container element not found");
        }

        console.log("Container element:", container);
        console.log("Container dimensions:", {
          width: container.offsetWidth,
          height: container.offsetHeight
        });

        // Import Nutrient SDK dynamically
        const NutrientSDK = await import("@nutrient-sdk/viewer");
        console.log("Nutrient SDK loaded:", NutrientSDK);
        
        const pdfUrl = annotationService.getPDFUrl(filePath);
        console.log("Loading PDF from:", pdfUrl);

        // Test if PDF is accessible
        try {
          const response = await fetch(pdfUrl, { method: 'HEAD' });
          if (!response.ok) {
            throw new Error(`PDF not accessible: ${response.status} ${response.statusText}`);
          }
          console.log("PDF is accessible");
        } catch (fetchError) {
          console.error("PDF fetch test failed:", fetchError);
          throw new Error(`Cannot access PDF file: ${fetchError.message}`);
        }
        
        // Initialize Nutrient Web SDK for annotation
        const viewer = await NutrientSDK.load({
          container: '#pdf-annotator-container', // Use CSS selector instead of ref
          document: pdfUrl,
          // Configuration for annotation functionality
          initialViewState: {
            enableAnnotationCreation: true,
            enableDocumentEditing: true,
            showToolbar: true,
            showAnnotationCreationTools: true,
          },
          // Customize UI with annotation tools
          baseUrl: `${window.location.origin}/nutrient-sdk/`,
          // Full annotation toolbar
          toolbarItems: [
            'sidebar-thumbnails',
            'sidebar-document-outline',
            'sidebar-annotations',
            'spacer',
            'zoom-out',
            'zoom-in',
            'zoom-mode',
            'spacer',
            'pan',
            'search',
            'spacer',
            'annotate',
            'spacer',
            'text',
            'highlight',
            'strikeout',
            'underline',
            'spacer',
            'ink',
            'spacer',
            'line',
            'rectangle',
            'ellipse',
            'spacer',
            'note',
            'spacer',
            'print',
            'download'
          ],
        });

        console.log("Nutrient SDK viewer initialized:", viewer);

        // Set up event listeners for tracking changes
        viewer.addEventListener("annotationsChange", () => {
          console.log("Annotations changed");
        });

        viewer.addEventListener("documentLoaded", () => {
          console.log("Document loaded successfully");
          setIsLoading(false);
        });

        viewer.addEventListener("documentLoadFailed", (error) => {
          console.error("Document load failed:", error);
          setError("Failed to load PDF document. Please check the file path and try again.");
          setIsLoading(false);
        });

        setInstance(viewer);

      } catch (err) {
        console.error("Error initializing PDF annotation viewer:", err);
        setError(`Failed to load PDF annotation viewer: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure the container is fully rendered
    const timeoutId = setTimeout(initializeNutrientViewer, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect to handle file path changes  
  useEffect(() => {
    if (instance && filePath) {
      // If we need to load a different file, dispose current instance and reinitialize
      console.log("File path changed, reinitializing viewer");
      instance.dispose();
      setInstance(null);
      setIsLoading(true);
      
      // Trigger reinitialization after cleanup
      setTimeout(() => {
        window.location.reload(); // Simple approach for now
      }, 100);
    }
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

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
      try {
        instance.dispose();
      } catch (err) {
        console.error("Error disposing Nutrient SDK instance:", err);
      }
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
        id="pdf-annotator-container"
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
