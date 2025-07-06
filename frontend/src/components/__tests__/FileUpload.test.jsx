import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../file/FileUpload';
import { uploadService } from '../../services';
import { toast } from '../../lib/toast';

// Mock the dependencies
jest.mock('../../services');
jest.mock('../../lib/toast');
jest.mock('../files/SearchBar', () => ({
  SearchBar: ({ onSearch }) => (
    <input
      data-testid="search-input"
      placeholder="Search files..."
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));
jest.mock('../files/FileList', () => ({
  FileList: ({ files, onStartIndexing, onAnnotate, onViewFile, onDeleteFile }) => (
    <div data-testid="file-list">
      {files.map((file) => (
        <div key={file.id} data-testid={`file-${file.id}`}>
          <span>{file.title}</span>
          <button onClick={() => onStartIndexing(file.id, file.fileUrl)} data-testid={`index-${file.id}`}>
            Index
          </button>
          <button onClick={() => onAnnotate(file)} data-testid={`annotate-${file.id}`}>
            Annotate
          </button>
          <button onClick={() => onViewFile(file)} data-testid={`view-${file.id}`}>
            View
          </button>
          <button onClick={() => onDeleteFile(file.id)} data-testid={`delete-${file.id}`}>
            Delete
          </button>
        </div>
      ))}
    </div>
  ),
}));
jest.mock('../file/UploadButton', () => ({
  UploadButton: ({ onUpload }) => (
    <input
      type="file"
      data-testid="file-input"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          onUpload(e.target.files[0]);
        }
      }}
    />
  ),
}));
jest.mock('../PDFAnnotationViewer', () => ({
  __esModule: true,
  default: ({ fileId, fileName, onClose }) => (
    <div data-testid="pdf-annotation-viewer">
      <h2>PDF Annotation Viewer: {fileName}</h2>
      <button onClick={onClose} data-testid="close-annotation">Close</button>
    </div>
  ),
}));

const mockFiles = [
  {
    id: '1',
    title: 'Test File 1.pdf',
    file_url: 'uploads/test1.pdf',
    type: 'application/pdf',
    indexing_status: 'completed',
  },
  {
    id: '2',
    title: 'Test File 2.pdf',
    file_url: 'uploads/test2.pdf',
    type: 'application/pdf',
    indexing_status: 'pending',
  },
];

const mockUploadResponse = {
  data: {
    id: '3',
    title: 'New File.pdf',
    file_url: 'uploads/newfile.pdf',
    type: 'application/pdf',
    indexing_status: 'pending',
  },
};

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadService.getFiles.mockResolvedValue({ files: mockFiles });
    uploadService.uploadFile.mockResolvedValue(mockUploadResponse);
    uploadService.startIndexing.mockResolvedValue({ success: true });
    uploadService.deleteFile.mockResolvedValue({ success: true });
    uploadService.searchFiles.mockResolvedValue({ files: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders the component title and description', async () => {
      render(<FileUpload />);
      
      expect(screen.getByText('Uploads')).toBeInTheDocument();
      expect(screen.getByText('Manage all your uploads here!')).toBeInTheDocument();
    });

    test('loads files on component mount', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalledTimes(1);
      });
    });

    test('displays file list after loading', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
        expect(screen.getByText('Test File 1.pdf')).toBeInTheDocument();
        expect(screen.getByText('Test File 2.pdf')).toBeInTheDocument();
      });
    });

    test('shows loading spinner while loading files', async () => {
      // Delay the response to test loading state
      uploadService.getFiles.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ files: mockFiles }), 100))
      );
      
      render(<FileUpload />);
      
      // Should show loading spinner initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    test('handles file upload successfully', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-input')).toBeInTheDocument();
      });
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(uploadService.uploadFile).toHaveBeenCalledWith(file, expect.any(Object));
      });
      
      // Should show progress bar during upload
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows upload progress', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-input')).toBeInTheDocument();
      });
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/^\d+%$/)).toBeInTheDocument();
      });
    });

    test('handles upload error gracefully', async () => {
      uploadService.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));
      
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-input')).toBeInTheDocument();
      });
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(uploadService.uploadFile).toHaveBeenCalled();
      });
    });
  });

  describe('File Operations', () => {
    test('handles file indexing', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const indexButton = screen.getByTestId('index-1');
      fireEvent.click(indexButton);
      
      await waitFor(() => {
        expect(uploadService.startIndexing).toHaveBeenCalledWith('test1.pdf');
      });
    });

    test('handles file annotation', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const annotateButton = screen.getByTestId('annotate-1');
      fireEvent.click(annotateButton);
      
      expect(screen.getByTestId('pdf-annotation-viewer')).toBeInTheDocument();
      expect(screen.getByText('PDF Annotation Viewer: Test File 1.pdf')).toBeInTheDocument();
    });

    test('handles file viewing', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const viewButton = screen.getByTestId('view-1');
      fireEvent.click(viewButton);
      
      expect(screen.getByTestId('pdf-annotation-viewer')).toBeInTheDocument();
    });

    test('handles file deletion', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByTestId('delete-1');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(uploadService.deleteFile).toHaveBeenCalledWith('1');
        expect(toast.success).toHaveBeenCalledWith('File deleted successfully');
      });
    });

    test('handles deletion error', async () => {
      uploadService.deleteFile.mockRejectedValueOnce(new Error('Delete failed'));
      
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByTestId('delete-1');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete file');
      });
    });
  });

  describe('Search Functionality', () => {
    test('handles file search', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(uploadService.searchFiles).toHaveBeenCalledWith('test');
      });
    });


  });

  describe('Error Handling', () => {
    test('handles file loading error', async () => {
      uploadService.getFiles.mockRejectedValueOnce(new Error('Failed to load files'));
      
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalled();
      });
      
      // Should still render the component with empty file list
      expect(screen.getByText('Uploads')).toBeInTheDocument();
    });

    test('handles indexing error', async () => {
      uploadService.startIndexing.mockRejectedValueOnce(new Error('Indexing failed'));
      
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const indexButton = screen.getByTestId('index-1');
      fireEvent.click(indexButton);
      
      await waitFor(() => {
        expect(uploadService.startIndexing).toHaveBeenCalled();
      });
    });
  });

  describe('Component State Management', () => {
    test('closes annotation viewer when close button is clicked', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Open annotation viewer
      const annotateButton = screen.getByTestId('annotate-1');
      fireEvent.click(annotateButton);
      
      expect(screen.getByTestId('pdf-annotation-viewer')).toBeInTheDocument();
      
      // Close annotation viewer
      const closeButton = screen.getByTestId('close-annotation');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('pdf-annotation-viewer')).not.toBeInTheDocument();
    });

    test('refreshes file list after annotation viewer closes', async () => {
      render(<FileUpload />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Open and close annotation viewer
      const annotateButton = screen.getByTestId('annotate-1');
      fireEvent.click(annotateButton);
      
      const closeButton = screen.getByTestId('close-annotation');
      fireEvent.click(closeButton);
      
      // Should reload files
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });
  });
}); 