import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SignupForm } from '../auth/SignupForm';
import { authServices } from '../../auth';
import { render } from '../../test-utils';

// Mock the auth services
jest.mock('../../auth');

describe('SignupForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authServices.signup.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders signup form with all required fields', () => {
      render(<SignupForm />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /I agree to the terms & policy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signup/i })).toBeInTheDocument();
    });

    test('renders form with correct input types', () => {
      render(<SignupForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    test('shows validation error for empty name', async () => {
      render(<SignupForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(checkbox);
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    test('shows validation error for empty email', async () => {
      render(<SignupForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(checkbox);
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
    });






  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      render(<SignupForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(checkbox);
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(authServices.signup).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          projectId: null
        });
      });
    });

    test('displays error message on signup failure', async () => {
      authServices.signup.mockRejectedValueOnce(new Error('Signup failed'));
      
      render(<SignupForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(checkbox);
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to signup/i)).toBeInTheDocument();
      });
    });


  });

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility when clicking the visibility icon', () => {
      render(<SignupForm />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Find the IconButton within the password field's InputAdornment
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      expect(toggleButton).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Navigation', () => {
    test('contains link to login page', () => {
      render(<SignupForm />);
      
      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });
});