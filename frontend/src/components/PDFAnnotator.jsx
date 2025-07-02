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

  // Convert Nutrient SDK annotations to our storage format
  const convertNutrientAnnotationsToStorageFormat = (nutrientAnnotations) => {
    const storageFormat = {};
    
    try {
      // Group annotations by page
      nutrientAnnotations.forEach((annotation, index) => {
        const pageIndex = annotation.pageIndex || 0;
        
        if (!storageFormat[pageIndex + 1]) {
          storageFormat[pageIndex + 1] = [];
        }
        
        // Convert Nutrient annotation to our format
        storageFormat[pageIndex + 1].push({
          id: annotation.id || `annotation_${index}`,
          type: annotation.constructor.name.toLowerCase().replace('annotation', ''),
          data: {
            boundingBox: annotation.boundingBox,
            color: annotation.color,
            contents: annotation.contents,
            subject: annotation.subject,
            // Store the entire annotation object as backup
            nutrientData: annotation
          }
        });
      });
    } catch (error) {
      console.error("Error converting annotations:", error);
    }
    
    return storageFormat;
  };

  // Save annotation data to our backend
  const saveAnnotationData = async (annotationData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          annotations: annotationData,
          totalPages: Object.keys(annotationData).length,
          scale: 1,
          rotation: 0
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save annotation data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Annotation data saved:", result);
      return result;
    } catch (error) {
      console.error("Error saving annotation data:", error);
      throw error;
    }
  };

  // Load existing annotation data and apply to viewer
  const loadExistingAnnotationData = async (viewerInstance) => {
    try {
      console.log("Loading existing annotations for file:", fileId);
      
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Found existing annotation data:", data);
        
        if (data.annotations && Object.keys(data.annotations).length > 0) {
          // Try to convert and apply the annotations to Nutrient SDK
          await applyStoredAnnotationsToNutrient(viewerInstance, data.annotations);
          console.log("✅ Existing annotations loaded and applied");
        }
      } else if (response.status === 404) {
        console.log("No existing annotations found for this file");
      }
    } catch (error) {
      console.warn("Failed to load existing annotations:", error);
    }
  };

  // Convert stored annotations to Nutrient SDK format and apply them
  const applyStoredAnnotationsToNutrient = async (viewerInstance, storedAnnotations) => {
    try {
      // For each page with annotations
      for (const [pageIndex, pageAnnotations] of Object.entries(storedAnnotations)) {
        if (!pageAnnotations || pageAnnotations.length === 0) continue;
        
        const pageNum = parseInt(pageIndex) - 1; // Convert to 0-based index
        console.log(`Applying ${pageAnnotations.length} annotations to page ${pageNum + 1}`);
        
        for (const annotation of pageAnnotations) {
          try {
            // Convert our annotation format to Nutrient SDK annotation
            const nutrientAnnotation = await convertToNutrientAnnotation(annotation, pageNum);
            if (nutrientAnnotation) {
              await viewerInstance.create(nutrientAnnotation);
            }
          } catch (annotError) {
            console.warn("Failed to apply individual annotation:", annotError);
          }
        }
      }
    } catch (error) {
      console.error("Error applying stored annotations:", error);
    }
  };

  // Convert our stored annotation format to Nutrient SDK annotation
  const convertToNutrientAnnotation = async (storedAnnotation, pageIndex) => {
    try {
      // Import Nutrient SDK for annotation classes
      const NutrientSDK = await import("@nutrient-sdk/viewer");
      
      // Handle both old and new annotation formats
      const type = storedAnnotation.type;
      const data = storedAnnotation.data || storedAnnotation; // Support both formats
      
      console.log("Converting annotation:", { type, data: Object.keys(data) });
      
      // Convert based on annotation type
      switch (type) {
        case 'line':
        case 'draw':
          // Convert drawing/line annotations to ink annotations
          if (data.points && data.points.length >= 4) {
            return new NutrientSDK.Annotations.InkAnnotation({
              pageIndex: pageIndex,
              lines: [data.points], // Nutrient expects array of point arrays
              strokeColor: new NutrientSDK.Color(data.stroke || '#ff0000'),
              strokeWidth: data.strokeWidth || 2
            });
          }
          break;
          
        case 'highlight':
          // Convert highlight annotations to highlight annotations
          if (data.points && data.points.length >= 4) {
            // Create a rough bounding box from points
            const xs = data.points.filter((_, i) => i % 2 === 0);
            const ys = data.points.filter((_, i) => i % 2 === 1);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            
            return new NutrientSDK.Annotations.HighlightAnnotation({
              pageIndex: pageIndex,
              boundingBox: new NutrientSDK.Geometry.Rect({
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY
              }),
              color: new NutrientSDK.Color(data.stroke || '#ffff0080')
            });
          }
          break;
          
        case 'text':
          // Convert text annotations to note annotations
          return new NutrientSDK.Annotations.NoteAnnotation({
            pageIndex: pageIndex,
            boundingBox: new NutrientSDK.Geometry.Rect({
              left: data.x || 100,
              top: data.y || 100,
              width: 20,
              height: 20
            }),
            text: { format: "plain", value: data.text || '' }
          });
          
        default:
          console.warn("Unknown annotation type:", type);
          return null;
      }
    } catch (error) {
      console.error("Error converting annotation:", error);
      return null;
    }
    
    return null;
  };

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
        
        // Check if there's an annotated version of this PDF first
        let pdfUrl = annotationService.getPDFUrl(filePath);
        
        try {
          const fileInfo = await annotationService.getFileAnnotationInfo(fileId);
          if (fileInfo.file.has_annotations && fileInfo.file.annotated_pdf) {
            // Use the annotated PDF if it exists
            pdfUrl = annotationService.getAnnotatedPDFUrl(fileInfo.file.annotated_pdf.file_path);
            console.log("Found existing annotated PDF, using:", pdfUrl);
          }
        } catch (infoError) {
          console.log("Could not check for annotated version, using original:", infoError.message);
        }
        
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

        viewer.addEventListener("documentLoaded", async () => {
          console.log("Document loaded successfully");
          setIsLoading(false);
          
          // Try to load existing annotations from our annotation API
          await loadExistingAnnotationData(viewer);
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
      
      // Also export annotation data for persistence
      let annotationData = {};
      try {
        // Try to get annotations from the viewer
        const annotations = await instance.getAnnotations();
        console.log("Exported annotations:", annotations);
        
        // Convert Nutrient annotations to our storage format
        annotationData = convertNutrientAnnotationsToStorageFormat(annotations);
      } catch (annotError) {
        console.warn("Could not export annotation data:", annotError);
      }
      
      // Save the annotated PDF using our annotation service
      const result = await annotationService.saveAnnotatedPDF(fileId, blob);
      
      // Save annotation data separately for persistence
      if (Object.keys(annotationData).length > 0) {
        try {
          await saveAnnotationData(annotationData);
          console.log("Annotation data saved for future restoration");
        } catch (dataError) {
          console.warn("Failed to save annotation data:", dataError);
        }
      }
      
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
