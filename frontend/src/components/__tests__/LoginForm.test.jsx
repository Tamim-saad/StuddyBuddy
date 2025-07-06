import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../auth/LoginForm';
import { authServices } from '../../auth';
import { render } from '../../test-utils';

// Mock the auth services
jest.mock('../../auth');

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authServices.login.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders login form with all required fields', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('renders form with correct input types', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    test('shows validation error for empty email', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    test('shows validation error for invalid email format', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    test('shows validation error for empty password', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    test('shows validation error for short password', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(authServices.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          type: 'email',
        });
      });
    });

    test('disables submit button during submission', async () => {
      // Make the login call take some time
      authServices.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(authServices.login).toHaveBeenCalled();
      });
    });

    test('shows loading state during submission', async () => {
      // Make the login call take some time
      authServices.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(authServices.login).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays login error message', async () => {
      authServices.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument();
      });
    });

    test('clears error message when user starts typing again', async () => {
      authServices.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument();
      });
      
      // Start typing again
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      
      // Error should be cleared
      expect(screen.queryByText(/failed to login/i)).not.toBeInTheDocument();
    });
  });

  describe('Success Handling', () => {
    test('calls onSuccess callback after successful login', async () => {
      const onSuccess = jest.fn();
      render(<LoginForm onSuccess={onSuccess} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    test('resets form after successful login', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      // MUI TextField handles label association, so getByLabelText is sufficient
    });

    test('has proper ARIA attributes', () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('announces errors to screen readers', async () => {
      authServices.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElement = screen.getByText(/failed to login/i);
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });
  });
}); 