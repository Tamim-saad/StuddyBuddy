# Frontend Testing Guide

This guide covers how to write and run unit tests for the StuddyBuddy frontend application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Testing Patterns](#testing-patterns)
5. [Mocking](#mocking)
6. [Best Practices](#best-practices)
7. [Common Testing Scenarios](#common-testing-scenarios)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

The project already has the necessary testing dependencies installed:

- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM assertions
- `@testing-library/user-event` - User interaction simulation
- `jest` - Testing framework (included with Create React App)

### Project Structure

```
src/
├── components/
│   ├── __tests__/           # Component tests
│   │   ├── SavedQuiz.test.jsx
│   │   ├── FileUpload.test.jsx
│   │   └── LoginForm.test.jsx
│   ├── ui/
│   │   └── test/           # UI component tests
│   │       ├── input.test.jsx
│   │       ├── label.test.jsx
│   │       └── toast.test.jsx
│   └── ...
├── test-utils.jsx          # Common testing utilities
├── setupTests.js           # Jest setup configuration
└── __mocks__/              # Mock files
    └── fileMock.js
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm test -- --watch

# Run tests with coverage
npm run coverage

# Run specific test file
npm test -- SavedQuiz.test.jsx

# Run tests matching a pattern
npm test -- --testNamePattern="renders"

# Run tests in a specific directory
npm test -- --testPathPattern="components/__tests__"
```

### Coverage Reports

The project is configured to generate coverage reports with a 70% threshold:

```bash
npm run coverage
```

This will:
- Run all tests
- Generate coverage reports in multiple formats (text, lcov, html)
- Show coverage in the terminal
- Create an HTML report in `coverage/lcov-report/index.html`

## Test Structure

### Basic Test File Structure

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '../ComponentName';
import { mockService } from '../../services';

// Mock dependencies
jest.mock('../../services');

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders component correctly', () => {
      render(<ComponentName />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles user input correctly', async () => {
      render(<ComponentName />);
      
      const input = screen.getByLabelText(/email/i);
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      expect(input.value).toBe('test@example.com');
    });
  });

  describe('API Calls', () => {
    test('calls API and handles response', async () => {
      mockService.getData.mockResolvedValue({ data: 'test' });
      
      render(<ComponentName />);
      
      await waitFor(() => {
        expect(mockService.getData).toHaveBeenCalled();
      });
    });
  });
});
```

### Test Organization

Organize tests using nested `describe` blocks:

1. **Component Name** - Top-level describe block
2. **Feature Groups** - Group related tests (e.g., "Initial Rendering", "User Interactions")
3. **Individual Tests** - Specific test cases

## Testing Patterns

### 1. Component Rendering Tests

```javascript
test('renders component with required elements', () => {
  render(<MyComponent />);
  
  expect(screen.getByText('Title')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});
```

### 2. User Interaction Tests

```javascript
test('handles form submission', async () => {
  const onSubmit = jest.fn();
  render(<MyForm onSubmit={onSubmit} />);
  
  const emailInput = screen.getByLabelText('Email');
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

### 3. Async Operation Tests

```javascript
test('loads data on mount', async () => {
  const mockData = [{ id: 1, name: 'Test' }];
  apiService.getData.mockResolvedValue(mockData);
  
  render(<DataComponent />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  expect(apiService.getData).toHaveBeenCalledTimes(1);
});
```

### 4. Error Handling Tests

```javascript
test('displays error message on API failure', async () => {
  apiService.getData.mockRejectedValue(new Error('API Error'));
  
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Mocking

### 1. Service Mocks

```javascript
// Mock entire service module
jest.mock('../../services/apiService');

// In test
beforeEach(() => {
  apiService.getData.mockResolvedValue([]);
  apiService.postData.mockResolvedValue({ success: true });
});
```

### 2. Component Mocks

```javascript
// Mock child components
jest.mock('../ChildComponent', () => ({
  ChildComponent: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="child-component">
      {children}
    </button>
  ),
}));
```

### 3. Router Mocks

```javascript
// Mock React Router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
}));
```

### 4. Global Object Mocks

```javascript
// Mock fetch
global.fetch = jest.fn();

beforeEach(() => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'test' }),
  });
});
```

## Best Practices

### 1. Test Organization

- **Arrange-Act-Assert**: Structure tests with clear sections
- **Descriptive Names**: Use clear, descriptive test names
- **Single Responsibility**: Each test should test one thing
- **Group Related Tests**: Use describe blocks to organize tests

### 2. Accessibility Testing

```javascript
test('has proper accessibility attributes', () => {
  render(<MyComponent />);
  
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label');
  expect(button).toHaveAttribute('type', 'submit');
});
```

### 3. Testing User Behavior

```javascript
test('user can complete the full workflow', async () => {
  render(<WorkflowComponent />);
  
  // Step 1: Fill form
  fireEvent.change(screen.getByLabelText('Name'), { 
    target: { value: 'John Doe' } 
  });
  
  // Step 2: Submit
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Step 3: Verify result
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

### 4. Avoiding Implementation Details

```javascript
// ❌ Bad - Testing implementation details
test('calls setState', () => {
  const setState = jest.fn();
  render(<MyComponent setState={setState} />);
  expect(setState).toHaveBeenCalled();
});

// ✅ Good - Testing user-visible behavior
test('shows success message after submission', async () => {
  render(<MyComponent />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

## Common Testing Scenarios

### 1. Form Testing

```javascript
describe('Form Component', () => {
  test('validates required fields', async () => {
    render(<MyForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<MyForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com'
      });
    });
  });
});
```

### 2. API Integration Testing

```javascript
describe('Data Component', () => {
  beforeEach(() => {
    apiService.getData.mockResolvedValue([]);
  });

  test('loads data on mount', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    apiService.getData.mockResolvedValue(mockData);
    
    render(<DataComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    apiService.getData.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<DataComponent />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    apiService.getData.mockRejectedValue(new Error('Failed'));
    
    render(<DataComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Component Integration Testing

```javascript
describe('Parent Component', () => {
  test('passes correct props to child', () => {
    render(<ParentComponent />);
    
    const childComponent = screen.getByTestId('child-component');
    expect(childComponent).toHaveAttribute('data-value', 'expected-value');
  });

  test('handles child component events', async () => {
    render(<ParentComponent />);
    
    fireEvent.click(screen.getByTestId('child-component'));
    
    await waitFor(() => {
      expect(screen.getByText('Child clicked!')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Async Test Failures**
   ```javascript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

2. **Mock Not Working**
   ```javascript
   // Ensure mocks are set up before render
   beforeEach(() => {
     jest.clearAllMocks();
     mockService.getData.mockResolvedValue([]);
   });
   ```

3. **Component Not Found**
   ```javascript
   // Use more specific queries
   screen.getByRole('button', { name: /submit/i });
   screen.getByLabelText('Email');
   screen.getByTestId('custom-element');
   ```

4. **Router Issues**
   ```javascript
   // Wrap component with Router in tests
   render(
     <BrowserRouter>
       <MyComponent />
     </BrowserRouter>
   );
   ```

### Debugging Tips

1. **Use screen.debug()** to see the rendered HTML
2. **Use screen.logTestingPlaygroundURL()** to get a URL for Testing Playground
3. **Check console for warnings** about missing mocks
4. **Use --verbose flag** for more detailed test output

### Performance Tips

1. **Mock heavy dependencies** (PDF libraries, chart libraries)
2. **Use shallow rendering** for simple component tests
3. **Avoid testing third-party libraries** (test your integration instead)
4. **Use test isolation** to prevent test interference

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [React Testing Examples](https://github.com/testing-library/react-testing-library#examples) 