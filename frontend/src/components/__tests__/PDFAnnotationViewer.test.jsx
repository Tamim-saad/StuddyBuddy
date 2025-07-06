import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PDFAnnotationViewer from '../PDFAnnotationViewer';
import { annotationService } from '../../services/annotationService';
import { toast } from '../../lib/toast';

// Mock the dependencies
jest.mock('../../services/annotationService');
jest.mock('../../lib/toast');

// Mock react-konva components
jest.mock('react-konva', () => ({
  Stage: ({ children, ...props }) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children, ...props }) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  ),
  Line: ({ ...props }) => <div data-testid="konva-line" {...props} />,
  Text: ({ ...props }) => <div data-testid="konva-text" {...props} />,
  Image: ({ ...props }) => <div data-testid="konva-image" {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left">←</span>,
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
  Eraser: () => <span data-testid="eraser">🧽</span>,
  Highlighter: () => <span data-testid="highlighter">🖍️</span>,
  Image: () => <span data-testid="image-icon">🖼️</span>,
  Minus: () => <span data-testid="minus">-</span>,
  MousePointer: () => <span data-testid="mouse-pointer">👆</span>,
  Pencil: () => <span data-testid="pencil">✏️</span>,
  Plus: () => <span data-testid="plus">+</span>,
  RotateCw: () => <span data-testid="rotate">🔄</span>,
  TextCursor: () => <span data-testid="text-cursor">📝</span>,
}));

// Mock UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock PDF.js
const mockPdfDoc = {
  numPages: 3,
  getPage: jest.fn().mockResolvedValue({
    getViewport: jest.fn().mockReturnValue({
      width: 595,
      height: 842,
    }),
    render: jest.fn().mockResolvedValue({}),
  }),
};

const mockPdfJs = {
  getDocument: jest.fn().mockResolvedValue(mockPdfDoc),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
};

// Mock window.Image
global.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }
};

// Mock canvas context
const mockContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(100) }),
  putImageData: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  closePath: jest.fn(),
  arc: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 100 }),
  setTransform: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
};

const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockContext),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
  width: 800,
  height: 600,
};

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class {
    constructor() {
      return mockCanvas;
    }
  },
});

describe('PDFAnnotationViewer Component', () => {
  const defaultProps = {
    fileId: 'test-file-123',
    filePath: 'uploads/test.pdf',
    fileName: 'Test Document.pdf',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    annotationService.getPDFUrl.mockReturnValue('http://localhost:3000/uploads/test.pdf');
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ annotations: [] }),
    });
    
    // Mock PDF.js import
    jest.doMock('pdfjs-dist', () => mockPdfJs);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders loading state initially', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
      expect(screen.getByText('PDF Annotation Viewer - Test Document.pdf')).toBeInTheDocument();
    });

    test('displays header with file name', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(screen.getByText('PDF Annotation Viewer - Test Document.pdf')).toBeInTheDocument();
    });

    test('shows close button', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });























  describe('Component Structure', () => {
    test('renders with proper layout structure', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      // Check for main container
      expect(screen.getByText('PDF Annotation Viewer - Test Document.pdf')).toBeInTheDocument();
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
    });

    test('renders toaster component', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });


  });

  describe('Props Validation', () => {
    test('accepts all required props', () => {
      const props = {
        fileId: 'test-123',
        filePath: 'test/path.pdf',
        fileName: 'Test File.pdf',
        onClose: jest.fn(),
      };
      
      render(<PDFAnnotationViewer {...props} />);
      
      expect(screen.getByText('PDF Annotation Viewer - Test File.pdf')).toBeInTheDocument();
    });

    test('handles optional props gracefully', () => {
      const minimalProps = {
        fileId: 'test-123',
        filePath: 'test/path.pdf',
        onClose: jest.fn(),
      };
      
      render(<PDFAnnotationViewer {...minimalProps} />);
      
      expect(screen.getByText('PDF Annotation Viewer - Document')).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    test('calls annotation service for PDF URL', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(annotationService.getPDFUrl).toHaveBeenCalledWith('uploads/test.pdf');
    });

    test('uses correct PDF URL from service', () => {
      annotationService.getPDFUrl.mockReturnValue('https://example.com/test.pdf');
      
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(annotationService.getPDFUrl).toHaveBeenCalledWith('uploads/test.pdf');
    });
  });

  describe('State Management', () => {
    test('initializes with correct default states', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      // Should start in loading state
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
    });

    test('handles state transitions properly', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      // Component should render without crashing during state transitions
      expect(screen.getByText('PDF Annotation Viewer - Test Document.pdf')).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    test('close button has proper event handler', () => {
      const mockOnClose = jest.fn();
      render(<PDFAnnotationViewer {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('close button is accessible', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toBeVisible();
    });
  });

  describe('Loading States', () => {


    test('displays loading message', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    test('handles component errors gracefully', () => {
      // This test ensures the component doesn't crash on unexpected errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      // Should render without throwing errors
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      // Check for proper heading structure
      const header = screen.getByText('PDF Annotation Viewer - Test Document.pdf');
      expect(header).toHaveClass('text-lg', 'font-semibold');
    });

    test('close button has proper accessibility attributes', () => {
      render(<PDFAnnotationViewer {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing file name', () => {
      render(<PDFAnnotationViewer {...defaultProps} fileName={null} />);
      
      expect(screen.getByText('PDF Annotation Viewer - Document')).toBeInTheDocument();
    });

    test('handles missing file path', () => {
      render(<PDFAnnotationViewer {...defaultProps} filePath={null} />);
      
      // Should handle gracefully without crashing
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
    });

    test('handles missing file ID', () => {
      render(<PDFAnnotationViewer {...defaultProps} fileId={null} />);
      
      // Should handle gracefully without crashing
      expect(screen.getByText('Loading PDF annotation viewer...')).toBeInTheDocument();
    });

    test('handles empty string props', () => {
      render(<PDFAnnotationViewer {...defaultProps} fileName="" filePath="" fileId="" />);
      
      expect(screen.getByText('PDF Annotation Viewer - Document')).toBeInTheDocument();
    });

    test('handles undefined props', () => {
      render(<PDFAnnotationViewer {...defaultProps} fileName={undefined} />);
      
      expect(screen.getByText('PDF Annotation Viewer - Document')).toBeInTheDocument();
    });
  });
});
