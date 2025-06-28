// Example usage in your file list component
import React, { useState, useEffect } from 'react';
import PDFAnnotator from './PDFAnnotator';
import annotationService from '../services/annotationService';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [annotatingFile, setAnnotatingFile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      // Your existing API call to get files
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/uploads/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnotate = (file) => {
    setAnnotatingFile(file);
  };

  const handleAnnotationSave = (result) => {
    // Refresh file list to show new annotated file
    fetchFiles();
    console.log('Annotations saved:', result);
    // You could also add the new file to the list without refetching
  };

  const handleAnnotatorClose = () => {
    setAnnotatingFile(null);
  };

  const viewAnnotatedPDF = async (file) => {
    try {
      const fileInfo = await annotationService.getFileAnnotationInfo(file.id);
      if (fileInfo.file.has_annotations) {
        // Open annotated PDF in new tab
        window.open(annotationService.getAnnotatedPDFUrl(fileInfo.file.annotated_pdf.file_path), '_blank');
      }
    } catch (error) {
      console.error('Error viewing annotated PDF:', error);
    }
  };

  if (loading) {
    return <div>Loading files...</div>;
  }

  if (annotatingFile) {
    return (
      <PDFAnnotator
        fileId={annotatingFile.id}
        filePath={annotatingFile.file_path}
        onSave={handleAnnotationSave}
        onClose={handleAnnotatorClose}
      />
    );
  }

  return (
    <div className="file-list">
      <h2>Your Files</h2>
      {files.map(file => (
        <div key={file.id} className="file-item">
          <div className="file-info">
            <span className="filename">{file.title}</span>
            <span className="file-type">{file.type}</span>
            <span className="upload-date">{new Date(file.date_uploaded).toLocaleDateString()}</span>
          </div>
          
          <div className="file-actions">
            {file.type === 'application/pdf' && (
              <>
                <button 
                  onClick={() => handleAnnotate(file)}
                  className="annotate-btn"
                >
                  Annotate PDF
                </button>
                
                {/* Show "View Annotated" button if annotations exist */}
                {file.annotated_pdf_id && (
                  <button 
                    onClick={() => viewAnnotatedPDF(file)}
                    className="view-annotated-btn"
                  >
                    View Annotated
                  </button>
                )}
              </>
            )}
            
            <button 
              onClick={() => window.open(`${process.env.REACT_APP_BASE_URL}/${file.file_path}`, '_blank')}
              className="view-original-btn"
            >
              View Original
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
