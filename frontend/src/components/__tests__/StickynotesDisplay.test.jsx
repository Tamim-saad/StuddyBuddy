import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StickynotesDisplay } from '../stickynotes/StickynotesDisplay';
import { authServices } from '../../auth';

// Mock the dependencies
jest.mock('../../auth');

// Mock fetch globally
global.fetch = jest.fn();

// Mock Material-UI icons
jest.mock('@mui/icons-material/Flip', () => () => <span data-testid="flip-icon">Flip</span>);
jest.mock('@mui/icons-material/ArrowBack', () => () => <span data-testid="arrow-back-icon">Back</span>);
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

const mockStickyNotes = [
  {
    front: 'What is React?',
    back: 'A JavaScript library for building user interfaces',
    tags: ['react', 'javascript', 'frontend'],
    importance: 'high',
  },
  {
    front: 'What is JSX?',
    back: 'A syntax extension for JavaScript that allows you to write HTML-like code',
    tags: ['jsx', 'react'],
    importance: 'medium',
  },
  {
    front: 'What is a Component?',
    back: 'A reusable piece of UI that can accept props and return JSX',
    tags: ['component', 'react'],
    importance: 'low',
  },
];

const mockLocationState = {
  stickynotes: mockStickyNotes,
  file_id: '123',
  title: 'React Study Notes',
};

const mockSaveResponse = {
  success: true,
  message: 'Notes saved successfully',
};

describe('StickynotesDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    authServices.getAccessToken.mockReturnValue('mock-token');
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSaveResponse),
    });
    
    // Set default location state
    mockUseLocation.mockReturnValue({ state: mockLocationState });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderWithRouter = (component, locationState = mockLocationState) => {
    mockUseLocation.mockReturnValue({ state: locationState });
    return render(
      <BrowserRouter>
        <StickynotesDisplay />
      </BrowserRouter>
    );
  };

  describe('Initial Rendering', () => {


    test('displays all sticky notes', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      expect(screen.getByText('What is React?')).toBeInTheDocument();
      expect(screen.getByText('What is JSX?')).toBeInTheDocument();
      expect(screen.getByText('What is a Component?')).toBeInTheDocument();
    });



    test('displays importance levels', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    test('shows save button', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });

    test('shows back button', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      expect(screen.getByTestId('arrow-back-icon')).toBeInTheDocument();
    });
  });

  describe('Card Flipping', () => {
    test('flips card when flip button is clicked', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const flipButtons = screen.getAllByTestId('flip-icon');
      expect(flipButtons).toHaveLength(3);
      
      // Click first flip button
      fireEvent.click(flipButtons[0]);
      
      // Should show back content
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
    });

    test('flips multiple cards independently', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const flipButtons = screen.getAllByTestId('flip-icon');
      
      // Click first and third flip buttons
      fireEvent.click(flipButtons[0]);
      fireEvent.click(flipButtons[2]);
      
      // Should show back content for both
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
      expect(screen.getByText('A reusable piece of UI that can accept props and return JSX')).toBeInTheDocument();
      
      // Second card should still show front content
      expect(screen.getByText('What is JSX?')).toBeInTheDocument();
    });

    test('unflips card when flip button is clicked again', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const flipButtons = screen.getAllByTestId('flip-icon');
      
      // Click flip button
      fireEvent.click(flipButtons[0]);
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
      
      // Click again to unflip
      fireEvent.click(flipButtons[0]);
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });
  });

  describe('Saving Functionality', () => {
    test('saves sticky notes successfully', async () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const saveButton = screen.getByTestId('save-icon').closest('button');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/stickynotes/save'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
            body: JSON.stringify({
              file_id: '123',
              notes: mockStickyNotes.map(note => ({
                front: note.front,
                back: note.back,
                tags: note.tags,
                importance: note.importance,
              })),
              title: 'React Study Notes',
            }),
          })
        );
      });
    });

    test('shows check icon after successful save', async () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const saveButton = screen.getByTestId('save-icon').closest('button');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    test('handles save error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Save failed' }),
      });
      
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithRouter(<StickynotesDisplay />);
      
      const saveButton = screen.getByTestId('save-icon').closest('button');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to save sticky notes: Save failed');
      });
      
      mockAlert.mockRestore();
    });

    test('handles network error during save', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithRouter(<StickynotesDisplay />);
      
      const saveButton = screen.getByTestId('save-icon').closest('button');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to save sticky notes: Network error');
      });
      
      mockAlert.mockRestore();
    });

    test('prevents multiple save attempts while saving', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSaveResponse),
        }), 100))
      );
      
      renderWithRouter(<StickynotesDisplay />);
      
      const saveButton = screen.getByTestId('save-icon').closest('button');
      
      // Click save button
      fireEvent.click(saveButton);
      
      // Try to click again immediately
      fireEvent.click(saveButton);
      
      // Should only make one API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back when back button is clicked', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const backButton = screen.getByTestId('arrow-back-icon').closest('button');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home/stickynotes');
    });

    test('shows error message and back button when no notes are provided', () => {
      renderWithRouter(<StickynotesDisplay />, { stickynotes: [] });
      
      expect(screen.getByText('No sticky notes found')).toBeInTheDocument();
      expect(screen.getByText('Back to Files')).toBeInTheDocument();
    });

    test('navigates to file list when back button is clicked in error state', () => {
      renderWithRouter(<StickynotesDisplay />, { stickynotes: [] });
      
      const backButton = screen.getByText('Back to Files');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home/file-list');
    });
  });

  describe('Importance Color Mapping', () => {
    test('applies correct colors for different importance levels', () => {
      renderWithRouter(<StickynotesDisplay />);
      
      const highImportanceChip = screen.getByText('high').closest('[class*="MuiChip"]');
      const mediumImportanceChip = screen.getByText('medium').closest('[class*="MuiChip"]');
      const lowImportanceChip = screen.getByText('low').closest('[class*="MuiChip"]');
      
      expect(highImportanceChip).toBeInTheDocument();
      expect(mediumImportanceChip).toBeInTheDocument();
      expect(lowImportanceChip).toBeInTheDocument();
    });


  });

  describe('Edge Cases', () => {

  });

}); 