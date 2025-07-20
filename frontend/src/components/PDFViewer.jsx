// src/components/PDFViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { annotationService } from "../services/annotationService";
import FallbackPDFViewer from "./FallbackPDFViewer";
import PDFAnnotationViewer from "./PDFAnnotationViewer";
import "./PDFViewer.css";

const PDFViewer = ({ fileId, filePath, onClose, fileName }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [useAnnotationViewer, setUseAnnotationViewer] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);
  const containerId = `pdf-viewer-container-${Math.random().toString(36).substr(2, 9)}`;

  // Cleanup function
  const cleanupViewer = useCallback(async () => {
    if (instanceRef.current) {
      try {
        console.log("Cleaning up PDF viewer instance...");
        if (typeof instanceRef.current.dispose === 'function') {
          await instanceRef.current.dispose();
        } else if (typeof instanceRef.current.destroy === 'function') {
          await instanceRef.current.destroy();
        }
      } catch (cleanupError) {
        console.warn("Error during cleanup:", cleanupError);
      } finally {
        instanceRef.current = null;
      }
    }
  }, []);

  // Try to initialize advanced viewer, fallback to simple if it fails
  const tryAdvancedViewer = useCallback(async () => {
    if (initAttempted) return;
    
    setInitAttempted(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log("🚀 Trying advanced PDF viewer...");
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error("Container not found");
      }

      // Clear container
      container.innerHTML = '';

      // Try to import Nutrient SDK with shorter timeout
      console.log("Importing Nutrient SDK...");
      const importTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SDK import timeout after 5 seconds')), 5000);
      });
      
      const nutrientModule = await Promise.race([
        import("@nutrient-sdk/viewer"),
        importTimeout
      ]);
      
      const NutrientSDK = nutrientModule.default || nutrientModule;

      if (!NutrientSDK || typeof NutrientSDK.load !== 'function') {
        throw new Error("SDK not properly loaded");
      }

      const pdfUrl = annotationService.getPDFUrl(filePath);
      console.log("Loading PDF from:", pdfUrl);

      // Very minimal configuration
      const config = {
        container: container,
        document: pdfUrl,
        baseUrl: `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/nutrient-sdk/`,
        licenseKey: 'demo'
      };

      console.log("Creating viewer...");
      
      // Create viewer with timeout
      const viewerTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Viewer creation timeout after 10 seconds')), 10000);
      });

      const viewer = await Promise.race([
        NutrientSDK.load(config),
        viewerTimeout
      ]);

      if (!viewer) {
        throw new Error("Viewer creation failed");
      }

      // Set up event listeners
      let documentLoaded = false;
      
      viewer.addEventListener("documentLoaded", () => {
        console.log("✅ Document loaded successfully");
        documentLoaded = true;
        setIsLoading(false);
      });

      viewer.addEventListener("documentLoadFailed", (loadError) => {
        console.error("❌ Document load failed:", loadError);
        if (!documentLoaded) {
          throw new Error(`Document load failed: ${loadError.message || 'Unknown error'}`);
        }
      });

      // Handle viewer errors gracefully
      viewer.addEventListener("error", (viewerError) => {
        console.warn("⚠️ Viewer error (non-critical):", viewerError);
        // Don't throw unless it's during initial load
        if (!documentLoaded) {
          throw new Error(`Viewer error: ${viewerError.message || 'Unknown error'}`);
        }
      });

      instanceRef.current = viewer;
      console.log("✅ Advanced PDF viewer initialized");

      // Timeout for document loading - increased timeout
      setTimeout(() => {
        if (!documentLoaded) {
          console.warn("Document load taking too long, showing fallback option");
          setError("Document is taking a while to load. You can try the fallback viewer if needed.");
          setIsLoading(false);
        }
      }, 6000); // Increased to 30 seconds

    } catch (err) {
      console.error("❌ Advanced viewer failed:", err);
      console.log("Showing error message with fallback option...");
      
      // Clean up any partial initialization
      await cleanupViewer();
      
      // Show error with fallback option instead of auto-switching
      setError(`Failed to load PDF viewer: ${err.message}`);
      setIsLoading(false);
    }
  }, [filePath, containerId, initAttempted, cleanupViewer]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(tryAdvancedViewer, 500);
    return () => {
      clearTimeout(timer);
      cleanupViewer();
    };
  }, [tryAdvancedViewer, cleanupViewer]);

  const handleClose = useCallback(async () => {
    await cleanupViewer();
    onClose();
  }, [cleanupViewer, onClose]);

  const handleUseFallback = useCallback(() => {
    setUseFallback(true);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setInitAttempted(false);
    setUseFallback(false);
    setError(null);
    setIsLoading(true);
    cleanupViewer().then(tryAdvancedViewer);
  }, [cleanupViewer, tryAdvancedViewer]);

  // Use annotation viewer if requested
  if (useAnnotationViewer) {
    return <PDFAnnotationViewer fileId={fileId} filePath={filePath} onClose={onClose} fileName={fileName} />;
  }

  // Use fallback viewer if requested
  if (useFallback) {
    return <FallbackPDFViewer filePath={filePath} onClose={onClose} fileName={fileName} />;
  }

  return (
    <div className="pdf-viewer">
      <div className="viewer-header">
        <h3>PDF Viewer - {fileName}</h3>
        <div className="viewer-controls">
          <button 
            onClick={() => setUseAnnotationViewer(true)} 
            className="annotation-btn"
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              margin: '0 0.5rem',
              cursor: 'pointer'
            }}
          >
            ✏️ Annotate PDF
          </button>
          <button 
            onClick={handleUseFallback} 
            className="fallback-btn"
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              margin: '0 0.5rem',
              cursor: 'pointer'
            }}
          >
            📄 Simple Viewer
          </button>
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
      </div>
      
      {/* Error overlay */}
      {error && (
        <div className="error-container" style={{ 
          position: 'absolute', 
          top: '60px', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="error-message" style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h4>⚠️ Error Loading PDF</h4>
            <p style={{ margin: '1rem 0', color: '#666' }}>{error}</p>
            <div className="error-actions">
              <button 
                onClick={handleRetry} 
                className="retry-btn"
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  margin: '0 0.5rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry
              </button>
              <button 
                onClick={() => setUseAnnotationViewer(true)} 
                className="annotation-btn"
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  margin: '0 0.5rem',
                  cursor: 'pointer'
                }}
              >
                ✏️ Try Annotation Viewer
              </button>
              <button 
                onClick={handleUseFallback} 
                className="fallback-btn"
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  margin: '0 0.5rem',
                  cursor: 'pointer'
                }}
              >
                📄 Use Simple Viewer
              </button>
              <a 
                href={annotationService.getPDFUrl(filePath)} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: '#28a745',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  margin: '0 0.5rem',
                  display: 'inline-block'
                }}
              >
                🔗 Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF container */}
      <div 
        id={containerId}
        ref={containerRef} 
        className="nutrient-viewer-container"
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 80px)',
          minHeight: '500px',
          border: 'none',
          position: 'relative',
          background: '#f5f5f5'
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 5,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="loading-spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Loading advanced PDF viewer...</p>
            <button 
              onClick={() => setUseAnnotationViewer(true)}
              style={{
                marginTop: '1rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Try Annotation Viewer
            </button>
            <button 
              onClick={handleUseFallback}
              style={{
                marginTop: '1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Use Simple Viewer Instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
