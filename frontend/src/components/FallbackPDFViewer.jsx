// src/components/FallbackPDFViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { annotationService } from '../services/annotationService';

const FallbackPDFViewer = ({ fileId, filePath, onClose, fileName }) => {
  const [viewerState, setViewerState] = useState('loading'); // loading, pdf-js, iframe, embed, download
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  const pdfUrl = annotationService.getPDFUrl(filePath);

  useEffect(() => {
    // Only try PDF.js once when component mounts
    let mounted = true;
    
    const initViewer = async () => {
      if (!mounted) return;
      
      try {
        setViewerState('loading');
        console.log('Trying PDF.js...');
        
        // Import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path - try different approaches for compatibility
        try {
          // Try to use the bundled worker first
          const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default || pdfjsWorker;
        } catch (workerImportError) {
          console.warn('Failed to import worker module, trying alternative paths...');
          
          // Fallback to different worker paths
          const workerPaths = [
            '/pdf.worker.min.js',
            '/pdf.worker.min.mjs',
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
            `${window.location.origin}/pdf.worker.min.js`
          ];

          let workerSet = false;
          for (const workerPath of workerPaths) {
            try {
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
              workerSet = true;
              console.log(`Successfully set worker path: ${workerPath}`);
              break;
            } catch (e) {
              console.warn(`Failed to set worker path ${workerPath}:`, e);
            }
          }
          
          if (!workerSet) {
            console.error('Failed to set any worker path, PDF rendering may not work');
          }
        }

        if (!mounted) return;

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        if (!mounted) return;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setViewerState('pdf-js');
        
        // Render first page
        if (canvasRef.current && mounted) {
          const page = await pdf.getPage(1);
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          setCurrentPage(1);
        }
        
      } catch (error) {
        if (!mounted) return;
        console.error('PDF.js failed:', error);
        setError(`PDF.js failed: ${error.message}`);
        setViewerState('iframe');
      }
    };

    initViewer();

    return () => {
      mounted = false;
    };
  }, [pdfUrl]); // Run when pdfUrl changes

  const nextPage = async () => {
    if (pdfDoc && currentPage < totalPages && !isRendering) {
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(currentPage + 1);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        setCurrentPage(currentPage + 1);
      } catch (error) {
        console.error('Error rendering page:', error);
        setError(`Error rendering page: ${error.message}`);
      } finally {
        setIsRendering(false);
      }
    }
  };

  const prevPage = async () => {
    if (pdfDoc && currentPage > 1 && !isRendering) {
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(currentPage - 1);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        setCurrentPage(currentPage - 1);
      } catch (error) {
        console.error('Error rendering page:', error);
        setError(`Error rendering page: ${error.message}`);
      } finally {
        setIsRendering(false);
      }
    }
  };

  const tryIframe = () => {
    console.log('Trying iframe...');
    setViewerState('iframe');
    setError('');
  };

  const tryEmbed = () => {
    console.log('Trying embed...');
    setViewerState('embed');
    setError('');
  };

  const handleDownload = () => {
    console.log('Opening download/new tab...');
    window.open(pdfUrl, '_blank');
  };

  const handleIframeError = () => {
    console.log('Iframe failed, trying embed...');
    setError('Iframe viewing failed');
    tryEmbed();
  };

  const handleEmbedError = () => {
    console.log('Embed failed, falling back to download...');
    setError('Embedded viewing failed');
    setViewerState('download');
  };

  const renderContent = () => {
    switch (viewerState) {
      case 'loading':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-lg">Loading PDF viewer...</p>
            </div>
          </div>
        );

      case 'pdf-js':
        return (
          <div className="flex flex-col h-full">
            <div className="bg-gray-100 p-4 border-b flex items-center justify-between" style={{ zIndex: 9999 }}>
              <div className="flex items-center space-x-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Open in New Tab
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex justify-center items-start">
              <canvas
                ref={canvasRef}
                className="border shadow-lg bg-white max-w-full max-h-full"
                style={{ 
                  maxWidth: 'calc(100% - 2rem)', 
                  maxHeight: 'calc(100vh - 200px)',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="flex flex-col h-full">
            <div className="bg-yellow-100 p-3 border-b">
              <p className="text-sm text-yellow-800">
                Using iframe viewer. If this doesn't work, we'll try another method.
              </p>
              <button
                onClick={tryEmbed}
                className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm"
              >
                Try Embed Instead
              </button>
            </div>
            <iframe
              src={pdfUrl}
              className="flex-1 w-full border-0"
              onError={handleIframeError}
              title={fileName || 'PDF Document'}
            />
          </div>
        );

      case 'embed':
        return (
          <div className="flex flex-col h-full">
            <div className="bg-orange-100 p-3 border-b">
              <p className="text-sm text-orange-800">
                Using embed viewer. If this doesn't work, you can download the file.
              </p>
              <button
                onClick={() => setViewerState('download')}
                className="mt-2 px-3 py-1 bg-orange-500 text-white rounded text-sm"
              >
                Show Download Option
              </button>
            </div>
            <embed
              src={pdfUrl}
              type="application/pdf"
              className="flex-1 w-full"
              onError={handleEmbedError}
            />
          </div>
        );

      case 'download':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-4">PDF Ready to View</h3>
              <p className="text-gray-600 mb-6">
                Your browser doesn't support in-app PDF viewing. 
                Click below to open the PDF in a new tab.
              </p>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open PDF in New Tab
              </button>
              <div className="mt-4 text-sm text-gray-500">
                <p>File: {fileName || 'PDF Document'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-white flex flex-col" 
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center" style={{ zIndex: 10000 }}>
        <h2 className="text-lg font-semibold">
          {fileName || 'PDF Document'}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" style={{ zIndex: 9999 }}>
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <div className="mt-2 space-x-2">
            {viewerState !== 'iframe' && (
              <button
                onClick={tryIframe}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Try Iframe
              </button>
            )}
            {viewerState !== 'embed' && (
              <button
                onClick={tryEmbed}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Try Embed
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default FallbackPDFViewer;
