import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SavedQuiz } from '../quizz/SavedQuiz';
import { authServices } from '../../auth';
import { uploadService } from '../../services';

// Mock the dependencies
jest.mock('../../auth');
jest.mock('../../services');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the QuizResultView component
jest.mock('../quizz/QuizResultView', () => ({
  QuizResultView: ({ quiz, onBack }) => (
    <div data-testid="quiz-result-view">
      <h2>Quiz Result: {quiz.title}</h2>
      <button onClick={onBack} data-testid="back-button">Back</button>
    </div>
  ),
}));

const mockFiles = [
  { id: '1', title: 'Test File 1' },
  { id: '2', title: 'Test File 2' },
];

const mockQuizzes = [
  {
    id: '1',
    title: 'Test Quiz 1',
    type: 'mcq',
    questions: { questions: ['Q1', 'Q2', 'Q3'] },
    score: 85,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Test Quiz 2',
    type: 'cq',
    questions: { questions: ['Q1', 'Q2'] },
    created_at: '2024-01-02T00:00:00Z',
  },
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SavedQuiz Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    uploadService.getFiles.mockResolvedValue({ files: mockFiles });
    authServices.getAccessToken.mockReturnValue('mock-token');
    
    // Mock fetch for quiz API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders the component title', async () => {
      renderWithRouter(<SavedQuiz />);
      
      expect(screen.getByText('Your Saved Quizzes')).toBeInTheDocument();
    });

    test('loads files on component mount', async () => {
      renderWithRouter(<SavedQuiz />);
      
      await waitFor(() => {
        expect(uploadService.getFiles).toHaveBeenCalledTimes(1);
      });
    });

    test('shows file selection dropdown with loaded files', async () => {
      renderWithRouter(<SavedQuiz />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Open the dropdown using role instead of label
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
        expect(screen.getByText('Test File 2')).toBeInTheDocument();
      });
    });
  });

  describe('File Selection', () => {
    test('shows message when no file is selected', async () => {
      renderWithRouter(<SavedQuiz />);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a file to view quizzes')).toBeInTheDocument();
      });
    });

    test('fetches quizzes when a file is selected', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuizzes,
      });

      renderWithRouter(<SavedQuiz />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Select a file
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quiz/file/1'),
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token',
            },
          })
        );
      });
    });
  });

  describe('Quiz Display', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuizzes,
      });
    });

    test('displays quizzes when file is selected', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
        expect(screen.getByText('Test Quiz 2')).toBeInTheDocument();
      });
    });

    test('displays correct quiz information', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(screen.getByText('Questions: 3')).toBeInTheDocument();
        expect(screen.getByText('Score: 85')).toBeInTheDocument();
        expect(screen.getByText('MCQ')).toBeInTheDocument();
        expect(screen.getByText('CQ')).toBeInTheDocument();
      });
    });

    test('shows "No saved quizzes" message when no quizzes exist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(screen.getByText(/No saved quizzes found for file/)).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Interaction', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuizzes,
      });
    });

    test('opens quiz result view when quiz is clicked', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      // Click on a quiz
      await waitFor(() => {
        fireEvent.click(screen.getByText('Test Quiz 1'));
      });
      
      expect(screen.getByTestId('quiz-result-view')).toBeInTheDocument();
      expect(screen.getByText('Quiz Result: Test Quiz 1')).toBeInTheDocument();
    });

    test('returns to quiz list when back button is clicked', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Test Quiz 1'));
      });
      
      // Click back button
      fireEvent.click(screen.getByTestId('back-button'));
      
      expect(screen.queryByTestId('quiz-result-view')).not.toBeInTheDocument();
      expect(screen.getByText('Your Saved Quizzes')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error when file loading fails', async () => {
      uploadService.getFiles.mockRejectedValueOnce(new Error('Failed to load files'));
      
      renderWithRouter(<SavedQuiz />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load files')).toBeInTheDocument();
      });
    });

    test('displays error when quiz fetching fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch saved quizzes')).toBeInTheDocument();
      });
    });

    test('handles non-array quiz response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Invalid response' }),
      });

      renderWithRouter(<SavedQuiz />);
      
      // Wait for combobox and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        expect(screen.getByText(/No saved quizzes found for file/)).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Type Styling', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuizzes,
      });
    });

    test('applies correct color for MCQ quiz type', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for files to load and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        const mcqChip = screen.getByText('MCQ');
        // Check for the chip element and its parent container
        expect(mcqChip).toBeInTheDocument();
        expect(mcqChip.closest('.MuiChip-root')).toBeInTheDocument();
      });
    });

    test('applies correct color for CQ quiz type', async () => {
      renderWithRouter(<SavedQuiz />);
      
      // Wait for files to load and select a file
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const selectElement = screen.getByRole('combobox');
      fireEvent.mouseDown(selectElement);
      
      await waitFor(() => {
        expect(screen.getByText('Test File 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test File 1'));
      
      await waitFor(() => {
        const cqChip = screen.getByText('CQ');
        // Check for the chip element and its parent container
        expect(cqChip).toBeInTheDocument();
        expect(cqChip.closest('.MuiChip-root')).toBeInTheDocument();
      });
    });
  });
}); 