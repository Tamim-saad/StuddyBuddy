import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FileView } from '../quizz/FileView';
import { authServices } from '../../auth';
import { uploadService } from '../../services';

// Mock the dependencies
jest.mock('../../auth');
jest.mock('../../services');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the child components
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
  FileList: ({ files, selectedFiles, onSelectFile, onStartIndexing }) => (
    <div data-testid="file-list">
      {files.map((file) => (
        <div key={file.id} data-testid={`file-${file.id}`}>
          <span>{file.title}</span>
          <button
            data-testid={`select-${file.id}`}
            onClick={() => onSelectFile(file.id)}
          >
            {selectedFiles.includes(file.id) ? 'Selected' : 'Select'}
          </button>
          <button
            data-testid={`index-${file.id}`}
            onClick={() => onStartIndexing(file.id, file.fileUrl)}
          >
            Index
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../quizz/MCQDisplay', () => ({
  MCQDisplay: ({ quiz }) => (
    <div data-testid="mcq-display">
      <h3>MCQ Quiz: {quiz?.title}</h3>
    </div>
  ),
}));

jest.mock('../quizz/CQDisplay', () => ({
  CQDisplay: ({ quiz }) => (
    <div data-testid="cq-display">
      <h3>CQ Quiz: {quiz?.title}</h3>
    </div>
  ),
}));

const mockFiles = [
  { 
    id: '1', 
    title: 'Test File 1',
    file_url: 'uploads/test1.pdf',
    indexing_status: 'completed'
  },
  { 
    id: '2', 
    title: 'Test File 2',
    file_url: 'uploads/test2.pdf',
    indexing_status: 'pending'
  },
];

const mockQuiz = {
  id: 'quiz1',
  title: 'Test Quiz',
  type: 'mcq',
  questions: ['Q1', 'Q2', 'Q3']
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('FileView Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    uploadService.getFiles.mockResolvedValue({ files: mockFiles });
    uploadService.searchFiles.mockResolvedValue({ files: mockFiles });
    uploadService.startIndexing.mockResolvedValue({ success: true });
    authServices.getAccessToken.mockReturnValue('mock-token');
    
    // Mock fetch for quiz generation API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders the component title and description', async () => {
      renderWithRouter(<FileView />);
      
      expect(screen.getByText('Select File for Quiz Generation')).toBeInTheDocument();
      expect(screen.getByText('Choose a file to generate questions from!')).toBeInTheDocument();
    });

    test('loads files on component mount', async () => {
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalledTimes(1);
      });
    });

    test('displays file list after loading', async () => {
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
        expect(screen.getByText('Test File 2')).toBeInTheDocument();
      });
    });


  });

  describe('File Selection', () => {
    test('allows selecting and deselecting files', async () => {
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Select a file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Check that the file is selected
      expect(screen.getByTestId('select-1')).toHaveTextContent('Selected');
      
      // Deselect the file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Check that the file is deselected
      expect(screen.getByTestId('select-1')).toHaveTextContent('Select');
    });

    test('enables quiz generation buttons when file is selected', async () => {
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Initially buttons should be disabled
      const cqButton = screen.getByText('Generate CQ');
      const mcqButton = screen.getByText('Generate MCQ');
      
      expect(cqButton).toBeDisabled();
      expect(mcqButton).toBeDisabled();
      
      // Select a file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Buttons should now be enabled
      expect(cqButton).not.toBeDisabled();
      expect(mcqButton).not.toBeDisabled();
    });
  });



  describe('File Indexing', () => {
    test('handles file indexing successfully', async () => {
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      const indexButton = screen.getByTestId('index-1');
      fireEvent.click(indexButton);
      
      await waitFor(() => {
        expect(uploadService.startIndexing).toHaveBeenCalledWith('test1.pdf');
      });
    });

    test('handles indexing error gracefully', async () => {
      uploadService.startIndexing.mockRejectedValueOnce(new Error('Indexing failed'));
      
      renderWithRouter(<FileView />);
      
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

  describe('Quiz Generation', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quiz: mockQuiz }),
      });
    });

    test('generates MCQ quiz successfully', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
      
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Select a file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Generate MCQ quiz
      const mcqButton = screen.getByText('Generate MCQ');
      fireEvent.click(mcqButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quiz/generate/mcq'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
            body: expect.stringContaining('"file_id":"1"'),
          })
        );
      });
    });

    test('generates CQ quiz successfully', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
      
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Select a file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Generate CQ quiz
      const cqButton = screen.getByText('Generate CQ');
      fireEvent.click(cqButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quiz/generate/cq'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
            body: expect.stringContaining('"file_id":"1"'),
          })
        );
      });
    });

    test('handles quiz generation error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Quiz generation failed' }),
      });
      
      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeInTheDocument();
      });
      
      // Select a file
      fireEvent.click(screen.getByTestId('select-1'));
      
      // Generate quiz
      const mcqButton = screen.getByText('Generate MCQ');
      fireEvent.click(mcqButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error generating quiz: Quiz generation failed');
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('handles file loading error gracefully', async () => {
      uploadService.getFiles.mockRejectedValueOnce(new Error('Failed to load files'));
      
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalled();
      });
      
      // Should still render the component with empty file list
      expect(screen.getByText('Select File for Quiz Generation')).toBeInTheDocument();
    });

    test('handles search error gracefully', async () => {
      uploadService.searchFiles.mockRejectedValueOnce(new Error('Search failed'));
      
      renderWithRouter(<FileView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(uploadService.searchFiles).toHaveBeenCalled();
      });
    });
  });


}); 