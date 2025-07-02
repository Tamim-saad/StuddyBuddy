// src/components/FallbackPDFViewer.jsx
import React, { useState, useEffect } from "react";
import { annotationService } from "../services/annotationService";

const FallbackPDFViewer = ({ filePath, onClose, fileName }) => {
  const pdfUrl = annotationService.getPDFUrl(filePath);
  const [showFallback, setShowFallback] = useState(false);

  // Immediately show the user-friendly interface since iframe is blocked
  useEffect(() => {
    // Check if we can access the PDF
    fetch(pdfUrl, { method: 'HEAD' })
      .then(response => {
        console.log("PDF is accessible, but iframe may be blocked by CSP");
        // Show fallback immediately since we know iframe will likely fail
        setTimeout(() => setShowFallback(true), 2000);
      })
      .catch(error => {
        console.warn("PDF not accessible:", error);
        setShowFallback(true);
      });
  }, [pdfUrl]);

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
              marginRight: '0.5rem',
              fontWeight: 'bold'
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
        {!showFallback ? (
          /* Show loading first, then fallback */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column'
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
            <p>Preparing PDF viewer...</p>
          </div>
        ) : (
          /* User-friendly fallback interface */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              padding: '3rem',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📄</div>
              <h2 style={{ color: '#333', marginBottom: '1rem' }}>PDF Document Ready</h2>
              <p style={{ 
                margin: '1.5rem 0', 
                color: '#666', 
                lineHeight: '1.6',
                fontSize: '1.1rem'
              }}>
                Your PDF document <strong>{fileName}</strong> is ready to view. 
                For the best experience, open it in a new tab where you can use 
                your browser's built-in PDF viewer with full functionality.
              </p>
              
              <div style={{ 
                marginTop: '2.5rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                  }}
                >
                  🔗 View PDF in New Tab
                </a>
                
                <a 
                  href={pdfUrl}
                  download={fileName}
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  📥 Download PDF
                </a>
              </div>
              
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#495057',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ 
                  marginBottom: '1rem', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  📋 Document Information
                </div>
                <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'left' }}>
                  <div>📁 <strong>Filename:</strong> {fileName}</div>
                  <div>📄 <strong>Type:</strong> PDF Document</div>
                  <div>✅ <strong>Status:</strong> Ready for viewing</div>
                  <div>🔗 <strong>Access:</strong> Available via direct link</div>
                </div>
              </div>
              
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(0, 123, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#0056b3',
                border: '1px solid rgba(0, 123, 255, 0.2)'
              }}>
                💡 <strong>Tip:</strong> The new tab will open with your browser's built-in PDF viewer, 
                giving you access to zoom, search, and annotation features.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FallbackPDFViewer;
