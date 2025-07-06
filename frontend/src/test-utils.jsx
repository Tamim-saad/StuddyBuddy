import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Create a custom theme for testing
const testTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Custom render function that includes common providers
const AllTheProviders = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId="test-client-id">
      <BrowserRouter>
        <ThemeProvider theme={testTheme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

// Custom render function
const customRender = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <AllTheProviders {...options.wrapperProps}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock data generators
export const createMockFile = (overrides = {}) => ({
  id: '1',
  title: 'Test File.pdf',
  file_url: 'uploads/test.pdf',
  type: 'application/pdf',
  indexing_status: 'completed',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockQuiz = (overrides = {}) => ({
  id: '1',
  title: 'Test Quiz',
  type: 'mcq',
  questions: { questions: ['Q1', 'Q2', 'Q3'] },
  score: 85,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides,
});

// Mock service responses
export const mockServiceResponses = {
  files: {
    success: { files: [createMockFile()] },
    empty: { files: [] },
    error: new Error('Failed to load files'),
  },
  upload: {
    success: { data: createMockFile({ id: '2', title: 'New File.pdf' }) },
    error: new Error('Upload failed'),
  },
  quiz: {
    success: [createMockQuiz()],
    empty: [],
    error: new Error('Failed to fetch quizzes'),
  },
};

// Common test helpers
export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to finish
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockFetch = (response, options = {}) => {
  const mockResponse = {
    ok: true,
    json: async () => response,
    ...options,
  };
  
  global.fetch = jest.fn().mockResolvedValue(mockResponse);
  return global.fetch;
};

export const mockFetchError = (error = 'Network error', status = 500) => {
  const mockResponse = {
    ok: false,
    status,
    json: async () => ({ error }),
  };
  
  global.fetch = jest.fn().mockResolvedValue(mockResponse);
  return global.fetch;
};

// Custom matchers for common assertions
export const expectElementToBeVisible = (element) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element, text) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element, className) => {
  expect(element).toHaveClass(className);
};

// Re-export everything from testing library
export * from '@testing-library/react';

// Export custom render as default
export { customRender as render }; 