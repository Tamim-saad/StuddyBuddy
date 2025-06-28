// src/components/PDFAnnotator.jsx
import React, { useEffect, useRef, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import annotationService from "../services/annotationService";
import "./PDFAnnotator.css";

const PDFAnnotator = ({ fileId, filePath, onSave, onClose }) => {
  const viewer = useRef(null);
  const [instance, setInstance] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const initializeViewer = async () => {
      try {
        const pdfUrl = annotationService.getPDFUrl(filePath);
        
        const viewerInstance = await WebViewer({
          path: '/lib',
          initialDoc: pdfUrl,
          disabledElements: [
            'ribbons',
            'toggleNotesButton',
          ],
        }, viewer.current);

        const { documentViewer, annotationManager } = viewerInstance.Core;

        // Track changes
        annotationManager.addEventListener('annotationChanged', () => {
          setHasUnsavedChanges(true);
        });

        // Wait for document to load
        documentViewer.addEventListener('documentLoaded', () => {
          console.log('PDF loaded successfully');
        });

        setInstance(viewerInstance);
      } catch (error) {
        console.error('Error initializing PDF viewer:', error);
      }
    };

    initializeViewer();

    // Cleanup
    return () => {
      if (instance) {
        instance.dispose();
      }
    };
  }, [filePath]); // instance is managed within the effect

  const saveAnnotations = async () => {
    if (!instance || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      const { documentViewer } = instance.Core;
      const doc = documentViewer.getDocument();
      
      // Export annotated PDF as blob
      const data = await doc.getFileData({ 
        downloadType: 'pdf',
        includeAnnotations: true 
      });
      
      const blob = new Blob([data], { type: 'application/pdf' });
      
      // Save to backend (saves as new file, keeps original)
      const result = await annotationService.saveAnnotatedPDF(fileId, blob);
      
      setHasUnsavedChanges(false);
      
      // Notify parent component with both original and annotated file info
      if (onSave) onSave(result);
      
      alert(`Annotations saved successfully!\nOriginal: ${result.originalFile.title}\nAnnotated: ${result.annotatedFile.title}`);
    } catch (error) {
      console.error('Error saving annotations:', error);
      alert('Failed to save annotations: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!shouldClose) return;
    }
    
    if (onClose) onClose();
  };

  return (
    <div className="pdf-annotator">
      <div className="annotator-header">
        <h3>PDF Annotator</h3>
        <div className="annotator-controls">
          <button 
            onClick={saveAnnotations} 
            disabled={isSaving || !hasUnsavedChanges}
            className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Annotations'}
          </button>
          <button onClick={handleClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
      
      <div className="webviewer-container" ref={viewer}></div>
      
      {hasUnsavedChanges && (
        <div className="unsaved-indicator">
          Unsaved changes
        </div>
      )}
    </div>
  );
};

export default PDFAnnotator;
