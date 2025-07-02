// src/components/FallbackPDFViewer.jsx
import React, { useState } from "react";
import { annotationService } from "../services/annotationService";

const FallbackPDFViewer = ({ filePath, onClose, fileName }) => {
  const pdfUrl = annotationService.getPDFUrl(filePath);
  const [iframeError, setIframeError] = useState(false);

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className="pdf-viewer">
      <div className="viewer-header">
        <h3>PDF Viewer - {fileName}</h3>
        <div className="viewer-controls">
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#28a745',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              marginRight: '0.5rem'
            }}
          >
            📄 Open in New Tab
          </a>
          <button onClick={onClose} className="close-btn">
            ✕ Close
          </button>
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: '#f5f5f5',
        position: 'relative'
      }}>
        {!iframeError ? (
          <>
            {/* Simple iframe viewer */}
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              title={fileName}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white'
              }}
              onError={handleIframeError}
              onLoad={() => console.log("PDF loaded in iframe")}
            />
          </>
        ) : (
          /* Fallback if iframe fails */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '500px'
            }}>
              <h4>📄 PDF Preview</h4>
              <p style={{ margin: '1rem 0', color: '#666' }}>
                The PDF cannot be displayed directly in the browser. 
                You can view or download it using the options below.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    background: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    margin: '0.5rem',
                    display: 'inline-block',
                    fontSize: '1rem'
                  }}
                >
                  � View in New Tab
                </a>
                <a 
                  href={pdfUrl}
                  download={fileName}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    margin: '0.5rem',
                    display: 'inline-block',
                    fontSize: '1rem'
                  }}
                >
                  📥 Download PDF
                </a>
              </div>
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                <strong>File:</strong> {fileName}<br/>
                <strong>Size:</strong> PDF Document
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FallbackPDFViewer;
