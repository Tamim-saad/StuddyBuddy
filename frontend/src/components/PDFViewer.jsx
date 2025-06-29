// src/components/PDFViewer.jsx
import React, { useEffect, useRef, useState } from "react";
import { annotationService } from "../services/annotationService";
import "./PDFViewer.css";

const PDFViewer = ({ fileId, filePath, onClose, fileName }) => {
  const containerRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeNutrientViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import Nutrient SDK dynamically
        const NutrientSDK = await import("@nutrient-sdk/viewer");
        
        const pdfUrl = annotationService.getPDFUrl(filePath);
        
        // Initialize Nutrient Web SDK for viewing only
        const viewer = await NutrientSDK.load({
          container: containerRef.current,
          document: pdfUrl,
          // Configuration for viewing only (no annotation tools)
          initialViewState: {
            enableAnnotationCreation: false,
            enableDocumentEditing: false,
            showToolbar: true,
            showAnnotationCreationTools: false,
          },
          // Customize UI - hide annotation tools
          baseUrl: `${window.location.origin}/nutrient-sdk/`,
          // Disable annotation tools
          toolbarItems: [
            'zoom-out',
            'zoom-in',
            'zoom-mode',
            'spacer',
            'pan',
            'search',
            'spacer',
            'print',
            'download'
          ],
        });

        // Set up event listeners
        viewer.addEventListener("documentLoaded", () => {
          console.log("Document loaded successfully for viewing");
          setIsLoading(false);
        });

        viewer.addEventListener("documentLoadFailed", (error) => {
          console.error("Document load failed:", error);
          setError("Failed to load PDF document. Please try again.");
          setIsLoading(false);
        });

        setInstance(viewer);

      } catch (err) {
        console.error("Error initializing Nutrient SDK:", err);
        setError("Failed to load PDF viewer. Please try again.");
        setIsLoading(false);
      }
    };

    initializeNutrientViewer();

    // Cleanup
    return () => {
      if (instance) {
        instance.dispose();
      }
    };
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (instance) {
      instance.dispose();
    }
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="pdf-viewer">
        <div className="viewer-header">
          <h3>PDF Viewer - {fileName}</h3>
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading PDF document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-viewer">
        <div className="viewer-header">
          <h3>PDF Viewer - {fileName}</h3>
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h4>⚠️ Error Loading PDF</h4>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="retry-btn">
                🔄 Retry
              </button>
              <a 
                href={annotationService.getPDFUrl(filePath)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-pdf-btn"
              >
                📄 Open in New Tab
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="pdf-viewer">
      <div className="viewer-header">
        <h3>PDF Viewer - {fileName}</h3>
        <div className="viewer-controls">
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
      </div>
      
      {/* Nutrient SDK Container */}
      <div 
        ref={containerRef} 
        className="nutrient-viewer-container"
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 80px)',
          border: 'none'
        }}
      />
    </div>
  );
};

export default PDFViewer;
