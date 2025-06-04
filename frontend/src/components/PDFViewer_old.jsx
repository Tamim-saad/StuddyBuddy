// src/components/PDFViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { annotationService } from "../services/annotationService";
import FallbackPDFViewer from "./FallbackPDFViewer";
import "./PDFViewer.css";

// src/components/PDFViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { annotationService } from "../services/annotationService";
import FallbackPDFViewer from "./FallbackPDFViewer";
import "./PDFViewer.css";

const PDFViewer = ({ fileId, filePath, onClose, fileName }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const isInitializedRef = useRef(false);
  const initializationAttempted = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
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
        isInitializedRef.current = false;
      }
    }
  }, []);

  // Initialize with fallback approach
  const initializeViewer = useCallback(async () => {
    if (initializationAttempted.current) {
      return;
    }
    
    initializationAttempted.current = true;

    try {
      console.log("🚀 Attempting PDF viewer initialization");
      setIsLoading(true);
      setError(null);

      // Wait a moment for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error("Container not found");
      }

      // Clean up any existing content
      container.innerHTML = '';

      console.log("Importing Nutrient SDK...");
      
      // Try to import Nutrient SDK with timeout
      const importPromise = import("@nutrient-sdk/viewer");
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SDK import timeout')), 10000);
      });

      const nutrientModule = await Promise.race([importPromise, timeoutPromise]);
      const NutrientSDK = nutrientModule.default || nutrientModule;

      if (!NutrientSDK || typeof NutrientSDK.load !== 'function') {
        throw new Error("Invalid SDK: load function not available");
      }

      const pdfUrl = annotationService.getPDFUrl(filePath);
      console.log("Loading PDF from:", pdfUrl);

      // Minimal configuration to avoid errors
      const config = {
        container: container,
        document: pdfUrl,
        baseUrl: `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/nutrient-sdk/`,
        licenseKey: 'demo',
        // Minimal config to reduce errors
        instant: false,
        enableAnnotations: false,
        enableFormFilling: false,
        disableWebAssemblyStreaming: true,
        toolbarItems: []
      };

      console.log("Creating viewer with minimal config...");

      // Create viewer with timeout
      const viewerPromise = NutrientSDK.load(config);
      const initTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Viewer initialization timeout')), 15000);
      });

      const viewer = await Promise.race([viewerPromise, initTimeoutPromise]);

      if (!viewer) {
        throw new Error("Failed to create viewer instance");
      }

      // Set up minimal event listeners
      viewer.addEventListener("documentLoaded", () => {
        console.log("✅ Document loaded successfully");
        setIsLoading(false);
        isInitializedRef.current = true;
      });

      viewer.addEventListener("documentLoadFailed", (error) => {
        console.error("❌ Document load failed:", error);
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
      });

      instanceRef.current = viewer;
      console.log("✅ PDF viewer initialized successfully");

    } catch (err) {
      console.error("❌ PDF viewer initialization failed:", err);
      console.log("Switching to fallback viewer...");
      setUseFallback(true);
      setError(null);
      setIsLoading(false);
    }
  }, [filePath, containerId]);

  // Initialize viewer when component mounts
  useEffect(() => {
    // Start with a delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeViewer();
    }, 1000);

    return () => {
      clearTimeout(timer);
      cleanupViewer();
    };
  }, [initializeViewer, cleanupViewer]);

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
    initializationAttempted.current = false;
    setUseFallback(false);
    setError(null);
    setIsLoading(true);
    isInitializedRef.current = false;
    initializeViewer();
  }, [initializeViewer]);

  // If fallback is requested, use the simple viewer
  if (useFallback) {
    return <FallbackPDFViewer filePath={filePath} onClose={onClose} fileName={fileName} />;
  }

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
        isInitializedRef.current = false;
      }
    }
  }, []);

  // Safe container cleanup
  const cleanupContainer = useCallback(() => {
    const container = document.getElementById(containerId);
    if (container) {
      try {
        // Wait for any pending operations to complete
        setTimeout(() => {
          // More gentle cleanup approach
          const children = container.children;
          for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child && child.parentNode === container) {
              try {
                container.removeChild(child);
              } catch (removeError) {
                console.warn("Could not remove child, continuing...");
              }
            }
          }
          
          // Final cleanup if needed
          if (container.children.length > 0) {
            try {
              container.innerHTML = '';
            } catch (htmlError) {
              console.warn("Could not clear innerHTML:", htmlError);
            }
          }
        }, 100);
      } catch (error) {
        console.warn("Container cleanup error:", error);
      }
    }
  }, [containerId]);

  const initializeViewer = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log("Viewer already initialized, skipping...");
      return;
    }

    try {
      console.log("🚀 Starting PDF viewer initialization");
      setIsLoading(true);
      setError(null);

      // Wait for container to exist in DOM
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const checkContainer = () => {
          const container = document.getElementById(containerId);
          if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
            console.log("Container ready:", {
              width: container.offsetWidth,
              height: container.offsetHeight
            });
            resolve(container);
          } else if (attempts >= maxAttempts) {
            reject(new Error("Container not found or has invalid dimensions"));
          } else {
            attempts++;
            setTimeout(checkContainer, 100);
          }
        };

        checkContainer();
      });

      // Clean up any existing viewer
      await cleanupViewer();
      cleanupContainer();

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log("Importing Nutrient SDK...");
      
      // Try different import strategies
      let NutrientSDK;
      try {
        // First try: ES module import
        const nutrientModule = await import("@nutrient-sdk/viewer");
        NutrientSDK = nutrientModule.default || nutrientModule;
        console.log("✅ Nutrient SDK imported via ES modules");
      } catch (esError) {
        console.warn("ES module import failed:", esError.message);
        
        try {
          // Second try: Check for global variables
          if (window.PSPDFKit) {
            NutrientSDK = window.PSPDFKit;
            console.log("✅ Using global PSPDFKit");
          } else if (window.NutrientWebSDK) {
            NutrientSDK = window.NutrientWebSDK;
            console.log("✅ Using global NutrientWebSDK");
          } else {
            throw new Error("No global SDK found");
          }
        } catch (globalError) {
          console.error("Global SDK access failed:", globalError.message);
          throw new Error("PDF SDK is not available. Please ensure Nutrient SDK is properly loaded.");
        }
      }

      // Validate SDK
      if (!NutrientSDK || typeof NutrientSDK.load !== 'function') {
        throw new Error("Invalid SDK: load function not available");
      }

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error("Container element not found");
      }

      const pdfUrl = annotationService.getPDFUrl(filePath);
      console.log("Loading PDF from:", pdfUrl);

      const config = {
        container: container,
        document: pdfUrl,
        baseUrl: `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/nutrient-sdk/`,
        licenseKey: 'demo',
        // Add configuration to prevent CORS and WASM issues
        disableWebAssemblyStreaming: true,
        disableWebAssembly: false, // Allow WASM but with streaming disabled
        enableHistory: false,
        instant: false, // Disable instant features that might cause issues
        toolbarItems: [], // Minimal toolbar to reduce complexity
        // Disable features that might cause DOM manipulation issues
        enableAnnotations: false,
        enableFormFilling: false,
        enableRedaction: false,
        enableMeasurements: false,
        // Set a simpler rendering mode
        renderPageContents: true,
        // Prevent container positioning issues
        disablePointAndClick: true,
      };

      console.log("Creating viewer with config:", config);

      // Add a timeout to prevent hanging
      const viewerPromise = NutrientSDK.load(config);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF viewer initialization timed out after 30 seconds')), 30000);
      });

      const viewer = await Promise.race([viewerPromise, timeoutPromise]);
      
      if (!viewer) {
        throw new Error("Failed to create viewer instance");
      }

      // Set up event listeners
      viewer.addEventListener("documentLoaded", () => {
        console.log("✅ Document loaded successfully");
        setIsLoading(false);
        isInitializedRef.current = true;
      });

      viewer.addEventListener("documentLoadFailed", (error) => {
        console.error("❌ Document load failed:", error);
        setError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
      });        viewer.addEventListener("error", (error) => {
          console.error("❌ Viewer error:", error);
          // Don't set error state if the viewer is already initialized and working
          if (!isInitializedRef.current) {
            setError(`PDF viewer error: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
          } else {
            // Just log the error if viewer is working
            console.warn("Non-critical viewer error:", error);
          }
        });

      instanceRef.current = viewer;
      console.log("✅ PDF viewer initialized successfully");

    } catch (err) {
      console.error("❌ Error initializing PDF viewer:", err);
      
      // Retry logic for certain errors
      if (retryCount < 2 && (
        err.message.includes('CORS') || 
        err.message.includes('load') ||
        err.message.includes('import')
      )) {
        console.log(`Retrying initialization... (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          initializeViewer();
        }, 1000 * (retryCount + 1));
        return;
      }

      // If all retries failed, offer to use fallback viewer
      console.log("All retries failed, suggesting fallback viewer");
      setError(`Failed to initialize advanced PDF viewer: ${err.message}`);
      setIsLoading(false);
    }
  }, [filePath, cleanupViewer, cleanupContainer, retryCount, containerId]);

  // Initialize viewer when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeViewer();
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      cleanupViewer();
    };
  }, [initializeViewer, cleanupViewer]);

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
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    isInitializedRef.current = false;
    initializeViewer();
  }, [initializeViewer]);

  // If fallback is requested, use the simple viewer
  if (useFallback) {
    return <FallbackPDFViewer filePath={filePath} onClose={onClose} fileName={fileName} />;
  }

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
                � Open in New Tab
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
            <p>Loading PDF viewer...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
