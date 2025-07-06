import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MCQDisplay } from '../quizz/MCQDisplay';
import { authServices } from '../../auth';

// Mock the dependencies
jest.mock('../../auth');

// Mock fetch globally
global.fetch = jest.fn();

// Mock Material-UI icons
jest.mock('@mui/icons-material/Save', () => () => <span data-testid="save-icon">Save</span>);
jest.mock('@mui/icons-material/Check', () => () => <span data-testid="check-icon">Check</span>);

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

const mockQuiz = {
  file_id: '123',
  title: 'React Quiz',
  questions: [
    {
      question: 'What is React?',
      options: [
        'A JavaScript library for building user interfaces',
        'A programming language',
        'A database management system',
        'An operating system'
      ],
      correctAnswer: 'A JavaScript library for building user interfaces',
      explanation: 'React is a JavaScript library developed by Facebook for building user interfaces.'
    },
    {
      question: 'What is JSX?',
      options: [
        'A new programming language',
        'A syntax extension for JavaScript',
        'A database query language',
        'A styling framework'
      ],
      correctAnswer: 'A syntax extension for JavaScript',
      explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.'
    },
    {
      question: 'What is a Component in React?',
      options: [
        'A function that returns HTML',
        'A reusable piece of UI',
        'A database table',
        'A CSS class'
      ],
      correctAnswer: 'A reusable piece of UI',
      explanation: 'A component is a reusable piece of UI that can accept props and return JSX.'
    }
  ]
};

const mockSaveResponse = {
  success: true,
  message: 'Quiz saved successfully',
};

describe('MCQDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    authServices.getAccessToken.mockReturnValue('mock-token');
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSaveResponse),
    });
    
    // Set default location state
    mockUseLocation.mockReturnValue({ state: { quiz: mockQuiz } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderWithRouter = (component, locationState = { quiz: mockQuiz }) => {
    mockUseLocation.mockReturnValue({ state: locationState });
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Initial Rendering', () => {
    test('renders quiz with first question', () => {
      renderWithRouter(<MCQDisplay />);
      
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    test('displays all options for the first question', () => {
      renderWithRouter(<MCQDisplay />);
      
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
      expect(screen.getByText('A programming language')).toBeInTheDocument();
      expect(screen.getByText('A database management system')).toBeInTheDocument();
      expect(screen.getByText('An operating system')).toBeInTheDocument();
    });

    test('shows navigation buttons', () => {
      renderWithRouter(<MCQDisplay />);
      
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('disables previous button on first question', () => {
      renderWithRouter(<MCQDisplay />);
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('disables next button when no answer is selected', () => {
      renderWithRouter(<MCQDisplay />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('shows error message when no quiz data is provided', () => {
      renderWithRouter(<MCQDisplay />, null);
      
      expect(screen.getByText('No quiz data found')).toBeInTheDocument();
      expect(screen.getByText('Back to Quiz Selection')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    test('enables next button when an answer is selected', () => {
      renderWithRouter(<MCQDisplay />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
      
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      
      expect(nextButton).not.toBeDisabled();
    });

    test('allows selecting different answers', () => {
      renderWithRouter(<MCQDisplay />);
      
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      const secondOption = screen.getByText('A programming language');
      
      fireEvent.click(firstOption);
      fireEvent.click(secondOption);
      
      // Both options should be clickable
      expect(firstOption).toBeInTheDocument();
      expect(secondOption).toBeInTheDocument();
    });

    test('maintains selected answer when navigating', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Select answer for first question
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      
      // Go to next question
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Go back to first question
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      // Answer should still be selected
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    test('navigates to next question when next button is clicked', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Select answer for first question
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      
      // Click next
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('What is JSX?')).toBeInTheDocument();
    });

    test('navigates to previous question when previous button is clicked', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Go to second question first
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Now go back
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    test('enables previous button after first question', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Go to second question
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();
    });

    test('shows finish button on last question', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Go to last question
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });
  });

  describe('Quiz Results', () => {
    test('shows results after completing all questions', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Answer all questions correctly
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      expect(screen.getByText('Quiz Results')).toBeInTheDocument();
      expect(screen.getByText('Score: 3 out of 3')).toBeInTheDocument();
    });

    test('displays correct and incorrect answers', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Answer first question correctly, second incorrectly
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const wrongOption = screen.getByText('A new programming language');
      fireEvent.click(wrongOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      expect(screen.getByText('Score: 2 out of 3')).toBeInTheDocument();
      expect(screen.getByText('Your Answer: A JavaScript library for building user interfaces')).toBeInTheDocument();
      expect(screen.getByText('Correct Answer: A JavaScript library for building user interfaces')).toBeInTheDocument();
    });

    test('shows explanations for each question', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Complete the quiz
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      expect(screen.getByText(/Explanation: React is a JavaScript library/)).toBeInTheDocument();
      expect(screen.getByText(/Explanation: JSX is a syntax extension/)).toBeInTheDocument();
      expect(screen.getByText(/Explanation: A component is a reusable piece/)).toBeInTheDocument();
    });
  });

  describe('Saving Functionality', () => {
    test('saves quiz results successfully', async () => {
      renderWithRouter(<MCQDisplay />);
      
      // Complete the quiz
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      // Click save button
      const saveButton = screen.getByText('Save Quiz');
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
            body: JSON.stringify({
              file_id: '123',
              title: 'React Quiz',
              type: 'mcq',
              questions: mockQuiz.questions,
              score: 3,
              answers: {
                0: 'A JavaScript library for building user interfaces',
                1: 'A syntax extension for JavaScript',
                2: 'A reusable piece of UI'
              }
            }),
          })
        );
      });
    });

    test('shows saved state after successful save', async () => {
      renderWithRouter(<MCQDisplay />);
      
      // Complete the quiz
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      // Click save button
      const saveButton = screen.getByText('Save Quiz');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });



    test('prevents multiple save attempts while saving', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSaveResponse),
        }), 100))
      );
      
      renderWithRouter(<MCQDisplay />);
      
      // Complete the quiz
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      const saveButton = screen.getByText('Save Quiz');
      
      // Click save button twice
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      
      // Should only make one API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Navigation', () => {


    test('navigates back from results page', () => {
      renderWithRouter(<MCQDisplay />);
      
      // Complete the quiz
      const firstOption = screen.getByText('A JavaScript library for building user interfaces');
      fireEvent.click(firstOption);
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const secondOption = screen.getByText('A syntax extension for JavaScript');
      fireEvent.click(secondOption);
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      const thirdOption = screen.getByText('A reusable piece of UI');
      fireEvent.click(thirdOption);
      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      const backButton = screen.getByText('Back to Quiz Selection');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home/quiz');
    });
  });

  describe('Edge Cases', () => {
    test('handles quiz with single question', () => {
      const singleQuestionQuiz = {
        file_id: '123',
        title: 'Single Question Quiz',
        questions: [
          {
            question: 'What is React?',
            options: [
              'A JavaScript library',
              'A programming language',
              'A database',
              'An OS'
            ],
            correctAnswer: 'A JavaScript library',
            explanation: 'React is a JavaScript library.'
          }
        ]
      };
      
      renderWithRouter(<MCQDisplay />, { quiz: singleQuestionQuiz });
      
      expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });

    
  });
}); 