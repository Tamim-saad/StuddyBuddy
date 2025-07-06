import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { CQDisplay } from '../quizz/CQDisplay';
import { getAIScore } from '../../services/aiScoring';
import { authServices } from '../../auth';

// Mock the dependencies
jest.mock('../../services/aiScoring');
jest.mock('../../auth');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Box: ({ children, ...props }) => <div data-testid="mui-box" {...props}>{children}</div>,
  Typography: ({ children, variant, ...props }) => (
    <div data-testid={`typography-${variant}`} {...props}>{children}</div>
  ),
  TextField: ({ value, onChange, placeholder, ...props }) => (
    <textarea
      data-testid="answer-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
  Button: ({ children, onClick, disabled, variant, ...props }) => (
    <button
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  Paper: ({ children, elevation, ...props }) => (
    <div data-testid="mui-paper" {...props}>{children}</div>
  ),
  List: ({ children, ...props }) => <ul data-testid="mui-list" {...props}>{children}</ul>,
  ListItem: ({ children, ...props }) => <li data-testid="mui-list-item" {...props}>{children}</li>,
  ListItemIcon: ({ children, ...props }) => (
    <span data-testid="mui-list-item-icon" {...props}>{children}</span>
  ),
  ListItemText: ({ primary, ...props }) => (
    <span data-testid="mui-list-item-text" {...props}>{primary}</span>
  ),
  CircularProgress: ({ size, ...props }) => (
    <div data-testid="circular-progress" {...props}>Loading...</div>
  ),
  Rating: ({ value, ...props }) => (
    <div data-testid="mui-rating" data-value={value} {...props}>Rating: {value}</div>
  ),
}));

// Mock Material-UI icons
jest.mock('@mui/icons-material/CheckCircleOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="check-circle-icon">✓</span>,
}));

jest.mock('@mui/icons-material/Star', () => ({
  __esModule: true,
  default: () => <span data-testid="star-icon">★</span>,
}));

jest.mock('@mui/icons-material/Save', () => ({
  __esModule: true,
  default: () => <span data-testid="save-icon">💾</span>,
}));

jest.mock('@mui/icons-material/Check', () => ({
  __esModule: true,
  default: () => <span data-testid="check-icon">✓</span>,
}));

const mockQuiz = {
  id: 'quiz1',
  title: 'Test CQ Quiz',
  file_id: 'file1',
  questions: {
    questions: [
      {
        question: 'What is the capital of France?',
        modelAnswer: 'The capital of France is Paris.',
        rubric: {
          keyPoints: ['Mention Paris', 'Correct spelling', 'Complete sentence']
        }
      },
      {
        question: 'Explain the water cycle.',
        modelAnswer: 'The water cycle involves evaporation, condensation, and precipitation.',
        rubric: {
          keyPoints: ['Evaporation', 'Condensation', 'Precipitation', 'Cycle process']
        }
      }
    ]
  }
};

const mockLocation = {
  state: { quiz: mockQuiz }
};

const mockNavigate = jest.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CQDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocation.mockReturnValue(mockLocation);
    useNavigate.mockReturnValue(mockNavigate);
    getAIScore.mockResolvedValue(8);
    authServices.getAccessToken.mockReturnValue('mock-token');
    
    // Mock fetch for save functionality
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders quiz title and question counter', () => {
      renderWithRouter(<CQDisplay />);
      
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    });

    test('renders answer textarea with placeholder', () => {
      renderWithRouter(<CQDisplay />);
      
      const textarea = screen.getByTestId('answer-textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Write your answer here...');
    });



    test('shows "No quiz data found" when quiz is missing', () => {
      useLocation.mockReturnValue({ state: null });
      
      renderWithRouter(<CQDisplay />);
      
      expect(screen.getByText('No quiz data found')).toBeInTheDocument();
      expect(screen.getByTestId('button-back-to-quiz-selection')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    test('allows navigation to next question', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Answer the first question
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      // Click next
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
        expect(screen.getByText('Explain the water cycle.')).toBeInTheDocument();
      });
    });



    test('preserves answers when navigating between questions', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Answer first question
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      // Move to second question
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
      });
      
      // Answer second question
      const textarea2 = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      
      // Go back to first question
      const previousButton = screen.getByTestId('button-previous');
      fireEvent.click(previousButton);
      
      await waitFor(() => {
        const textarea1 = screen.getByTestId('answer-textarea');
        expect(textarea1.value).toBe('Paris is the capital');
      });
    });
  });

  describe('Answer Handling', () => {
    test('updates answer when typing in textarea', () => {
      renderWithRouter(<CQDisplay />);
      
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'My answer here' } });
      
      expect(textarea.value).toBe('My answer here');
    });


  });

  describe('Quiz Evaluation', () => {


    test('evaluates quiz and shows results', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ score: 8 })
      });
      
      renderWithRouter(<CQDisplay />);
      
      // Answer first question
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      // Move to last question
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-evaluate')).toBeInTheDocument();
      });
      
      // Answer last question
      const textarea2 = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      
      // Evaluate
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(getAIScore).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Quiz Review')).toBeInTheDocument();
        expect(screen.getByText(/Total Score: \d+ \/ 20/)).toBeInTheDocument();
      });
    });



    test('handles evaluation error gracefully', async () => {
      getAIScore.mockRejectedValue(new Error('Evaluation failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<CQDisplay />);
      
      // Answer first question
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      // Move to last question
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-evaluate')).toBeInTheDocument();
      });
      
      // Answer last question
      const textarea2 = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      
      // Evaluate
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Evaluation error:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Results Display', () => {
    beforeEach(async () => {
      // Setup quiz with answers and scores
      const quizWithAnswers = {
        ...mockQuiz,
        answers: {
          0: 'Paris is the capital',
          1: 'Water cycle explanation'
        },
        scores: {
          0: 8,
          1: 7
        }
      };
      
      useLocation.mockReturnValue({ state: { quiz: quizWithAnswers } });
    });

    test('displays quiz review with all questions', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation to show results
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Review')).toBeInTheDocument();
        expect(screen.getByText('Question 1: What is the capital of France?')).toBeInTheDocument();
        expect(screen.getByText('Question 2: Explain the water cycle.')).toBeInTheDocument();
      });
    });

    test('displays user answers in results', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Paris is the capital')).toBeInTheDocument();
        expect(screen.getByText('Water cycle explanation')).toBeInTheDocument();
      });
    });

    test('displays model answers in results', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByText('The capital of France is Paris.')).toBeInTheDocument();
        expect(screen.getByText('The water cycle involves evaporation, condensation, and precipitation.')).toBeInTheDocument();
      });
    });

    test('displays key points from rubric', async () => {
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mention Paris')).toBeInTheDocument();
        expect(screen.getByText('Correct spelling')).toBeInTheDocument();
        expect(screen.getByText('Complete sentence')).toBeInTheDocument();
        expect(screen.getByText('Evaporation')).toBeInTheDocument();
        expect(screen.getByText('Condensation')).toBeInTheDocument();
        expect(screen.getByText('Precipitation')).toBeInTheDocument();
      });
    });


  });

  describe('Quiz Saving', () => {
    beforeEach(async () => {
      // Setup quiz with answers and scores
      const quizWithAnswers = {
        ...mockQuiz,
        answers: {
          0: 'Paris is the capital',
          1: 'Water cycle explanation'
        },
        scores: {
          0: 8,
          1: 7
        }
      };
      
      useLocation.mockReturnValue({ state: { quiz: quizWithAnswers } });
    });

    test('saves quiz successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation to show results
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-save-quiz')).toBeInTheDocument();
      });
      
      // Save quiz
      const saveButton = screen.getByTestId('button-save-quiz');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quiz/save'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
            body: expect.stringContaining('"type":"cq"'),
          })
        );
      });
    });

    test('shows loading state while saving', async () => {
      // Mock delayed response
      global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));
      
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation to show results
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-save-quiz')).toBeInTheDocument();
      });
      
      // Save quiz
      const saveButton = screen.getByTestId('button-save-quiz');
      fireEvent.click(saveButton);
      
      // Check loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    test('shows saved state after successful save', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation to show results
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-save-quiz')).toBeInTheDocument();
      });
      
      // Save quiz
      const saveButton = screen.getByTestId('button-save-quiz');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
      });
    });

    test('handles save error gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Save failed' })
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<CQDisplay />);
      
      // Trigger evaluation to show results
      const textarea = screen.getByTestId('answer-textarea');
      fireEvent.change(textarea, { target: { value: 'Paris is the capital' } });
      
      const nextButton = screen.getByTestId('button-next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const textarea2 = screen.getByTestId('answer-textarea');
        fireEvent.change(textarea2, { target: { value: 'Water cycle explanation' } });
      });
      
      const evaluateButton = screen.getByTestId('button-evaluate');
      fireEvent.click(evaluateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-save-quiz')).toBeInTheDocument();
      });
      
      // Save quiz
      const saveButton = screen.getByTestId('button-save-quiz');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Save error:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

}); 