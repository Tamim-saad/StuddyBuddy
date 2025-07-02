// src/components/PDFAnnotationViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Image as KonvaImage } from 'react-konva';
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
  const [annotationMode, setAnnotationMode] = useState('none'); // none, draw, erase, highlight, text, image
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 degrees
  const [annotations, setAnnotations] = useState([]); // All annotations for current page
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawWidth, setDrawWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(10);
  const [highlightColor] = useState('#ffff0080');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [savedAnnotations, setSavedAnnotations] = useState({}); // Store all pages annotations
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

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

    // Auto-save when component unmounts
    return () => {
      mounted = false;
      // Save current page before unmounting
      if (annotations.length > 0 && fileId) {
        const finalAnnotations = {
          ...savedAnnotations,
          [currentPage]: annotations
        };
        
        // Fire and forget save
        fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: JSON.stringify({
            annotations: finalAnnotations,
            totalPages: totalPages,
            scale: scale,
            rotation: rotation
          })
        }).catch(err => console.warn('Auto-save failed:', err));
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load annotations from backend
  const loadAllAnnotations = async () => {
    if (!fileId) return;

    try {
      console.log('Loading annotations for file:', fileId);
      
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded annotations:', data);
        
        if (data.annotations) {
          setSavedAnnotations(data.annotations);
          
          // Restore PDF state if available
          if (data.scale) {
            setScale(data.scale);
          }
          if (data.rotation !== undefined) {
            setRotation(data.rotation);
          }
          
          console.log('📄 Annotations loaded for', Object.keys(data.annotations).length, 'pages');
        }
      } else if (response.status === 404) {
        console.log('📝 No existing annotations found for this PDF');
        setSavedAnnotations({});
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
      setSavedAnnotations({});
    }
  };

  // Save annotations to backend
  const saveAnnotations = async () => {
    if (!fileId) {
      setError('No file ID available for saving annotations');
      return;
    }

    try {
      setSaveStatus('saving');
      
      // First save current page annotations
      saveCurrentPageAnnotations();
      
      // Prepare annotations data including current page
      const allAnnotationsToSave = {
        ...savedAnnotations,
        [currentPage]: annotations
      };
      
      console.log('Saving annotations for file:', fileId, allAnnotationsToSave);
      
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/annotations/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          annotations: allAnnotationsToSave,
          totalPages: totalPages,
          scale: scale,
          rotation: rotation
        })
      });

      if (response.ok) {
        await response.json(); // Just to consume the response
        console.log('✅ Annotations saved successfully');
        
        // Update saved state
        setSavedAnnotations(allAnnotationsToSave);
        setSaveStatus('saved');
        setError(''); // Clear any existing errors
        
        // Show saved status for 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(`Save failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save annotations:', error);
      setError(`Failed to save annotations: ${error.message}`);
      setSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const renderPDFPage = async (pdf, pageNum) => {
    if (isRendering || !pdf) return;
    
    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Apply rotation to viewport
      const viewport = page.getViewport({ scale, rotation });
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
    console.log(`💾 Saving annotations for page ${currentPage}:`, annotations.length, 'annotations');
    setSavedAnnotations(prev => ({
      ...prev,
      [currentPage]: [...annotations] // Create a copy to avoid reference issues
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

  // Rotation functions
  const rotateLeft = () => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);
    if (pdfDoc) {
      renderPDFPage(pdfDoc, currentPage);
    }
  };

  const rotateRight = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (pdfDoc) {
      renderPDFPage(pdfDoc, currentPage);
    }
  };

  // Image insertion function
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Add image annotation at center of canvas
          const centerX = canvasSize.width / 2;
          const centerY = canvasSize.height / 2;
          
          setAnnotations([...annotations, {
            id: Date.now(),
            type: 'image',
            x: centerX - 50,
            y: centerY - 50,
            width: 100,
            height: 100,
            src: e.target.result,
            originalWidth: img.width,
            originalHeight: img.height
          }]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    event.target.value = '';
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleImageUpload;
    input.click();
  };

  // Drawing functions
  const handleMouseDown = (e) => {
    if (annotationMode === 'none') return;

    const pos = e.target.getStage().getPointerPosition();
    
    if (annotationMode === 'erase') {
      // Eraser mode - remove annotations that intersect with eraser position
      const eraseRadius = eraserSize;
      setAnnotations(annotations.filter(annotation => {
        if (annotation.type === 'line' || annotation.type === 'highlight') {
          // Check if any point in the line is within erase radius
          const points = annotation.points;
          for (let i = 0; i < points.length; i += 2) {
            const x = points[i];
            const y = points[i + 1];
            const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (distance <= eraseRadius) {
              return false; // Remove this annotation
            }
          }
          return true; // Keep this annotation
        } else if (annotation.type === 'text') {
          // Check if text position is within erase radius
          const distance = Math.sqrt((annotation.x - pos.x) ** 2 + (annotation.y - pos.y) ** 2);
          return distance > eraseRadius;
        } else if (annotation.type === 'image') {
          // Check if click is within image bounds
          return !(pos.x >= annotation.x && pos.x <= annotation.x + annotation.width &&
                   pos.y >= annotation.y && pos.y <= annotation.y + annotation.height);
        }
        return true;
      }));
      return;
    }

    setIsDrawing(true);
    
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
    if (annotationMode === 'erase' && isDrawing) {
      // Continue erasing while dragging
      handleMouseDown(e);
      return;
    }
    
    if (!isDrawing || annotationMode === 'none' || annotationMode === 'text' || annotationMode === 'erase') return;

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
                    onClick={() => setAnnotationMode('erase')}
                    className={`px-3 py-2 rounded ${annotationMode === 'erase' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                  >
                    🗑️ Erase
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
                  <button
                    onClick={insertImage}
                    className="px-3 py-2 rounded bg-purple-500 text-white hover:bg-purple-600"
                  >
                    🖼️ Image
                  </button>
                </div>

                {/* Rotation Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={rotateLeft}
                    className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    title="Rotate Left"
                  >
                    ↶ Rotate Left
                  </button>
                  <button
                    onClick={rotateRight}
                    className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    title="Rotate Right"
                  >
                    ↷ Rotate Right
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
                  
                  {/* Eraser Size Control */}
                  {annotationMode === 'erase' && (
                    <>
                      <span className="text-sm text-gray-600">|</span>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={eraserSize}
                        onChange={(e) => setEraserSize(Number(e.target.value))}
                        className="w-20"
                        title="Eraser Size"
                      />
                      <span className="text-sm">Eraser: {eraserSize}px</span>
                    </>
                  )}
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
                    disabled={saveStatus === 'saving'}
                    className={`px-3 py-2 rounded text-white font-medium ${
                      saveStatus === 'saving' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : saveStatus === 'saved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : saveStatus === 'error'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : saveStatus === 'saved' ? (
                      <span className="flex items-center">
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Saved
                      </span>
                    ) : saveStatus === 'error' ? (
                      <span className="flex items-center">
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        Retry
                      </span>
                    ) : (
                      '💾 Save'
                    )}
                  </button>
                  {/* Save Status Indicator */}
                  {saveStatus !== 'idle' && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      saveStatus === 'saving' 
                        ? 'bg-blue-100 text-blue-800'
                        : saveStatus === 'saved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {saveStatus === 'saving' && 'Saving annotations...'}
                      {saveStatus === 'saved' && 'All changes saved'}
                      {saveStatus === 'error' && 'Save failed'}
                    </div>
                  )}
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
                    cursor: annotationMode === 'none' ? 'default' : 
                           annotationMode === 'erase' ? 'crosshair' :
                           annotationMode === 'draw' ? 'crosshair' :
                           annotationMode === 'highlight' ? 'crosshair' :
                           annotationMode === 'text' ? 'text' : 'crosshair'
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
                      } else if (annotation.type === 'image') {
                        return (
                          <KonvaImage
                            key={annotation.id}
                            x={annotation.x}
                            y={annotation.y}
                            width={annotation.width}
                            height={annotation.height}
                            image={(() => {
                              const img = new window.Image();
                              img.src = annotation.src;
                              return img;
                            })()}
                            draggable={annotationMode === 'none'}
                            onClick={() => annotationMode === 'erase' && deleteAnnotation(annotation.id)}
                            onDragEnd={(e) => {
                              const updatedAnnotations = annotations.map(ann => 
                                ann.id === annotation.id 
                                  ? { ...ann, x: e.target.x(), y: e.target.y() }
                                  : ann
                              );
                              setAnnotations(updatedAnnotations);
                            }}
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
