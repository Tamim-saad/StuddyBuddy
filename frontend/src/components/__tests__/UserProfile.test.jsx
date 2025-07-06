import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../auth/UserProfile';
import { authServices } from '../../auth';
import { toast } from '../../lib/toast';
import { render } from '../../test-utils';

// Mock the auth services
jest.mock('../../auth');
jest.mock('../../lib/toast');

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.REACT_APP_BASE_URL = 'http://localhost:3000';

describe('UserProfile Component', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    id: 'user-123'
  };

  const mockAuthUser = {
    name: 'John Doe',
    email: 'john@example.com',
    id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authServices.getAuthUser.mockReturnValue(mockAuthUser);
    authServices.getAccessToken.mockReturnValue('mock-token');
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders user profile with user data from auth service', () => {
      render(<UserProfile />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });

    test('renders avatar with user initial', () => {
      render(<UserProfile />);
      
      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    test('renders avatar with fallback when no name', () => {
      authServices.getAuthUser.mockReturnValue({ ...mockAuthUser, name: null });
      
      render(<UserProfile />);
      
      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
    });

    test('renders anonymous user when no name', () => {
      authServices.getAuthUser.mockReturnValue({ ...mockAuthUser, name: null });
      
      render(<UserProfile />);
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });

    test('renders profile update form with current values', () => {
      render(<UserProfile />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
    });

    test('renders password change form', () => {
      render(<UserProfile />);
      
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByText(/security settings/i)).toBeInTheDocument();
      expect(screen.getByText(/update your password to keep your account secure/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {


    test('fetches user profile when no auth user', async () => {
      authServices.getAuthUser.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
      
      render(<UserProfile />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/user/profile',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer mock-token'
            }
          })
        );
      });
    });
  });

  describe('Profile Information Form', () => {
    test('updates form data when input changes', () => {
      render(<UserProfile />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      
      expect(nameInput).toHaveValue('Jane Doe');
      expect(emailInput).toHaveValue('jane@example.com');
    });

    test('submits profile update form successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { name: 'Jane Doe', email: 'jane@example.com' } })
      });
      
      render(<UserProfile />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/user/profile',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-token'
            },
            body: JSON.stringify({
              name: 'Jane Doe',
              email: 'jane@example.com'
            })
          })
        );
      });
      
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    test('shows loading state during profile update', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<UserProfile />);
      
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(updateButton);
      
      expect(screen.getByText('Updating Profile...')).toBeInTheDocument();
      expect(updateButton).toBeDisabled();
    });

    test('handles profile update error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' })
      });
      
      render(<UserProfile />);
      
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    test('handles network error during profile update', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<UserProfile />);
      
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Password Change Form', () => {









  });

  describe('Error Handling', () => {
    test('handles profile fetch error', async () => {
      authServices.getAuthUser.mockReturnValue(null);
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      render(<UserProfile />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error loading profile: Failed to fetch');
      });
    });

    test('handles profile fetch with non-ok response', async () => {
      authServices.getAuthUser.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      render(<UserProfile />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error loading profile: Failed to fetch profile');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles user with empty name and email', () => {
      authServices.getAuthUser.mockReturnValue({ id: 'user-123' });
      
      render(<UserProfile />);
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    test('handles user with only name', () => {
      authServices.getAuthUser.mockReturnValue({ name: 'John Doe', id: 'user-123' });
      
      render(<UserProfile />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    test('handles user with only email', () => {
      authServices.getAuthUser.mockReturnValue({ email: 'john@example.com', id: 'user-123' });
      
      render(<UserProfile />);
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    test('handles profile update with empty fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { name: '', email: '' } })
      });
      
      render(<UserProfile />);
      
      const updateButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/user/profile',
          expect.objectContaining({
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com'
            })
          })
        );
      });
    });
  });

  describe('Accessibility', () => {


    test('has proper button text', () => {
      render(<UserProfile />);
      
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    test('has proper headings', () => {
      render(<UserProfile />);
      
      expect(screen.getByRole('heading', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /profile information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /security settings/i })).toBeInTheDocument();
    });
  });
}); 