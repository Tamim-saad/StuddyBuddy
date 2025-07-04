// src/components/PDFAnnotator.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { annotationService } from "../services/annotationService";
import "./PDFAnnotator.css";

const PDFAnnotator = ({ fileId, filePath, onSave, onClose }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  const [instance, setInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [containerReady, setContainerReady] = useState(false);

  // Poll container size until ready or timeout
  useEffect(() => {
    let intervalId;
    const maxWait = 5000; // 5 seconds max wait
    const start = Date.now();

    const checkContainer = () => {
      const container = containerRef.current;
      if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
        setContainerReady(true);
        clearInterval(intervalId);
        return true;
      }
      if (Date.now() - start > maxWait) {
        clearInterval(intervalId);
        setError("PDF container not ready in time.");
        setIsLoading(false);
        return false;
      }
      return false;
    };

    if (!checkContainer()) {
      intervalId = setInterval(checkContainer, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Initialize the PDF viewer once container is ready and filePath is set
  useEffect(() => {
    let mounted = true;

    if (!containerReady || !filePath) {
      return;
    }

    const container = containerRef.current;

    const initializeViewer = async () => {
      try {
        console.log("Initializing viewer with container dimensions:", {
          width: container.offsetWidth,
          height: container.offsetHeight,
        });

        const { NutrientViewer } = await import("@nutrient-sdk/viewer");

        if (!mounted) return;

        const viewer = new NutrientViewer({
          container,
          documentPath: annotationService.getPDFUrl(filePath),
          viewerConfig: {
            enableAnnotations: true,
            renderMode: "canvas",
            backgroundColor: "#ffffff",
          },
        });

        try {
          await viewer.initialize();
        } catch (initErr) {
          console.error("viewer.initialize() failed:", initErr);
          if (mounted) {
            setError(`Viewer initialization failed: ${initErr.message}`);
            setIsLoading(false);
          }
          return;
        }

        if (!mounted) return;

        instanceRef.current = viewer;
        setInstance(viewer);
        setIsLoading(false);
        setError(null);
        console.log("Viewer initialized successfully");
      } catch (err) {
        console.error("Initialization error:", err);
        if (mounted) {
          setError(`Failed to load PDF viewer: ${err.message}`);
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    setError(null);
    initializeViewer();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, [filePath, containerReady]);

  const handleClose = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.dispose();
      instanceRef.current = null;
      setInstance(null);
    }
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!instanceRef.current) return;

    try {
      setIsSaving(true);
      const annotations = await instanceRef.current.getAnnotations();
      await onSave(annotations);
    } catch (err) {
      console.error("Failed to save annotations:", err);
      setError("Failed to save annotations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

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
          <p>
            Loading PDF annotation editor...{" "}
            {containerReady ? "(Initializing viewer)" : "(Preparing container)"}
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="pdf-annotator">
      <div className="annotator-header">
        <h3>PDF Annotator</h3>
        <div className="annotator-controls">
          <button onClick={handleSave} disabled={isSaving || !instance} className="save-btn">
            {isSaving ? "Saving..." : "💾 Save Annotations"}
          </button>
          <button onClick={handleClose} className="close-btn">
            ✕ Close
          </button>
        </div>
      </div>

      <div
        id="pdf-annotator-container"
        ref={containerRef}
        className="nutrient-container"
        style={{
          width: "100%",
          height: "calc(100vh - 80px)",
          minHeight: "400px",
          position: "relative",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
          opacity: isLoading ? 0.5 : 1,
        }}
      />
    </div>
  );
};

export default PDFAnnotator;
