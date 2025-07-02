// src/components/PDFAnnotationViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Text as KonvaText } from 'react-konva';
import { annotationService } from '../services/annotationService';

const PDFAnnotationViewer = ({ fileId, filePath, onClose, fileName }) => {
  const [viewerState, setViewerState] = useState('loading');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Annotation states
  const [annotationMode, setAnnotationMode] = useState('none'); // none, draw, erase, highlight, text
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [annotations, setAnnotations] = useState([]); // All annotations for current page
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawWidth, setDrawWidth] = useState(2);
  const [highlightColor] = useState('#ffff0080');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [savedAnnotations, setSavedAnnotations] = useState({}); // Store all pages annotations

  const pdfUrl = annotationService.getPDFUrl(filePath);

  // Load PDF and initialize viewer
  useEffect(() => {
    let mounted = true;

    const initViewer = async () => {
      if (!mounted) return;

      try {
        setViewerState('loading');
        console.log('Initializing PDF annotation viewer...');
        
        // Import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path
        const workerPaths = [
          '/pdf.worker.min.js',
          '/pdf.worker.min.mjs',
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        ];

        for (const workerPath of workerPaths) {
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
            break;
          } catch (e) {
            console.warn(`Failed to set worker path ${workerPath}:`, e);
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
        
        // Load saved annotations for all pages
        await loadAllAnnotations();
        
        // Render first page
        await renderPDFPage(pdf, 1);
        
      } catch (error) {
        if (!mounted) return;
        console.error('PDF initialization failed:', error);
        setError(`Failed to load PDF: ${error.message}`);
        setViewerState('error');
      }
    };

    initViewer();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load annotations from backend
  const loadAllAnnotations = async () => {
    if (!fileId) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedAnnotations(data.annotations || {});
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  // Save annotations to backend
  const saveAnnotations = async () => {
    if (!fileId) return;

    try {
      await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          annotations: savedAnnotations
        })
      });
    } catch (error) {
      console.error('Failed to save annotations:', error);
      setError('Failed to save annotations');
    }
  };

  const renderPDFPage = async (pdf, pageNum) => {
    if (isRendering || !pdf) return;
    
    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      setCanvasSize({ width: viewport.width, height: viewport.height });
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Load annotations for this page
      const pageAnnotations = savedAnnotations[pageNum] || [];
      setAnnotations(pageAnnotations);
      
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error rendering page:', error);
      setError(`Error rendering page: ${error.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  const nextPage = async () => {
    if (pdfDoc && currentPage < totalPages && !isRendering) {
      // Save current page annotations
      saveCurrentPageAnnotations();
      await renderPDFPage(pdfDoc, currentPage + 1);
    }
  };

  const prevPage = async () => {
    if (pdfDoc && currentPage > 1 && !isRendering) {
      // Save current page annotations
      saveCurrentPageAnnotations();
      await renderPDFPage(pdfDoc, currentPage - 1);
    }
  };

  const saveCurrentPageAnnotations = () => {
    setSavedAnnotations(prev => ({
      ...prev,
      [currentPage]: annotations
    }));
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    setScale(newScale);
    if (pdfDoc) {
      renderPDFPage(pdfDoc, currentPage);
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDoc) {
      renderPDFPage(pdfDoc, currentPage);
    }
  };

  // Drawing functions
  const handleMouseDown = (e) => {
    if (annotationMode === 'none') return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (annotationMode === 'draw') {
      setAnnotations([...annotations, {
        id: Date.now(),
        type: 'line',
        points: [pos.x, pos.y],
        stroke: drawColor,
        strokeWidth: drawWidth
      }]);
    } else if (annotationMode === 'highlight') {
      setAnnotations([...annotations, {
        id: Date.now(),
        type: 'highlight',
        points: [pos.x, pos.y],
        stroke: highlightColor,
        strokeWidth: drawWidth * 3
      }]);
    } else if (annotationMode === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setAnnotations([...annotations, {
          id: Date.now(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: text,
          fontSize: 16,
          fill: drawColor
        }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || annotationMode === 'none' || annotationMode === 'text') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    const lastAnnotation = annotations[annotations.length - 1];
    if (lastAnnotation && (lastAnnotation.type === 'line' || lastAnnotation.type === 'highlight')) {
      const newPoints = lastAnnotation.points.concat([point.x, point.y]);
      setAnnotations([
        ...annotations.slice(0, -1),
        { ...lastAnnotation, points: newPoints }
      ]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
  };

  const deleteAnnotation = (id) => {
    setAnnotations(annotations.filter(ann => ann.id !== id));
  };

  const renderContent = () => {
    switch (viewerState) {
      case 'loading':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-lg">Loading PDF annotation viewer...</p>
            </div>
          </div>
        );

      case 'pdf-js':
        return (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="bg-gray-100 p-4 border-b">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Navigation */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600"
                  >
                    Next
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={zoomOut}
                    className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Zoom Out
                  </button>
                  <span className="text-sm">{Math.round(scale * 100)}%</span>
                  <button
                    onClick={zoomIn}
                    className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Zoom In
                  </button>
                </div>

                {/* Annotation Tools */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAnnotationMode('none')}
                    className={`px-3 py-2 rounded ${annotationMode === 'none' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Select
                  </button>
                  <button
                    onClick={() => setAnnotationMode('draw')}
                    className={`px-3 py-2 rounded ${annotationMode === 'draw' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setAnnotationMode('highlight')}
                    className={`px-3 py-2 rounded ${annotationMode === 'highlight' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
                  >
                    Highlight
                  </button>
                  <button
                    onClick={() => setAnnotationMode('text')}
                    className={`px-3 py-2 rounded ${annotationMode === 'text' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                  >
                    Text
                  </button>
                </div>

                {/* Color and Width Controls */}
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-8 h-8 rounded"
                    title="Drawing Color"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(Number(e.target.value))}
                    className="w-20"
                    title="Line Width"
                  />
                  <span className="text-sm">{drawWidth}px</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAllAnnotations}
                    className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Clear Page
                  </button>
                  <button
                    onClick={saveAnnotations}
                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* PDF and Annotation Canvas */}
            <div className="flex-1 overflow-auto bg-gray-50 flex justify-center items-start p-4">
              <div className="relative">
                {/* PDF Canvas */}
                <canvas
                  ref={canvasRef}
                  className="border shadow-lg bg-white"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }}
                />
                
                {/* Annotation Layer */}
                <Stage
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onMouseDown={handleMouseDown}
                  onMousemove={handleMouseMove}
                  onMouseup={handleMouseUp}
                  ref={stageRef}
                  className="border shadow-lg"
                  style={{ 
                    position: 'relative',
                    zIndex: 2,
                    cursor: annotationMode === 'none' ? 'default' : 'crosshair'
                  }}
                >
                  <Layer>
                    {annotations.map((annotation) => {
                      if (annotation.type === 'line' || annotation.type === 'highlight') {
                        return (
                          <Line
                            key={annotation.id}
                            points={annotation.points}
                            stroke={annotation.stroke}
                            strokeWidth={annotation.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={annotation.type === 'highlight' ? 'multiply' : 'source-over'}
                            onClick={() => annotationMode === 'erase' && deleteAnnotation(annotation.id)}
                          />
                        );
                      } else if (annotation.type === 'text') {
                        return (
                          <KonvaText
                            key={annotation.id}
                            x={annotation.x}
                            y={annotation.y}
                            text={annotation.text}
                            fontSize={annotation.fontSize}
                            fill={annotation.fill}
                            onClick={() => annotationMode === 'erase' && deleteAnnotation(annotation.id)}
                          />
                        );
                      }
                      return null;
                    })}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-4">Error Loading PDF</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
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
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center" style={{ zIndex: 100000 }}>
        <h2 className="text-lg font-semibold">
          PDF Annotation Viewer - {fileName || 'Document'}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Error Message */}
      {error && viewerState !== 'error' && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" style={{ zIndex: 9999 }}>
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default PDFAnnotationViewer;
