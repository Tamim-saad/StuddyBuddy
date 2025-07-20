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

// Mock window.Image
global.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }
};

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
  });

  test('renders component without crashing', () => {
    render(<PDFAnnotationViewer {...defaultProps} />);
    expect(screen.getByText('PDF Annotation Viewer - Test Document.pdf')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<PDFAnnotationViewer {...defaultProps} />);
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
