import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Google OAuth provider to avoid network calls in tests
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children, clientId }) => (
    <div data-testid="google-oauth-provider" data-client-id={clientId}>
      {children}
    </div>
  ),
}));

// Mock the AppRouter to avoid complex routing in tests
jest.mock('./router', () => ({
  AppRouter: () => <div data-testid="app-router">App Router Content</div>,
}));

// Mock the context providers to test their presence
jest.mock('./context/MembersContext', () => ({
  MembersProvider: ({ children }) => (
    <div data-testid="members-provider">{children}</div>
  ),
}));

jest.mock('./context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

// Mock FontAwesome CSS import
jest.mock('@fortawesome/fontawesome-free/css/all.min.css', () => ({}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear any previous environment variable mocks
    delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
  });

  test('renders app with all providers in correct order', () => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id';
    
    render(<App />);
    
    // Check that all providers are present
    expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('members-provider')).toBeInTheDocument();
    expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-router')).toBeInTheDocument();
  });

  test('passes correct Google client ID to GoogleOAuthProvider', () => {
    const testClientId = 'test-google-client-id-123';
    process.env.REACT_APP_GOOGLE_CLIENT_ID = testClientId;
    
    render(<App />);
    
    const googleProvider = screen.getByTestId('google-oauth-provider');
    expect(googleProvider).toHaveAttribute('data-client-id', testClientId);
  });

  test('handles missing Google client ID gracefully', () => {
    // Don't set the environment variable
    
    render(<App />);
    
    const googleProvider = screen.getByTestId('google-oauth-provider');
    // When clientId is undefined, the attribute might be null or not set
    expect(googleProvider).toBeInTheDocument();
    expect(googleProvider.getAttribute('data-client-id')).toBeFalsy();
  });

  test('providers are nested in the correct hierarchy', () => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id';
    
    render(<App />);
    
    const googleProvider = screen.getByTestId('google-oauth-provider');
    const membersProvider = screen.getByTestId('members-provider');
    const notificationProvider = screen.getByTestId('notification-provider');
    const appRouter = screen.getByTestId('app-router');
    
    // Check nesting: Google > Members > Notification > Router
    expect(googleProvider).toContainElement(membersProvider);
    expect(membersProvider).toContainElement(notificationProvider);
    expect(notificationProvider).toContainElement(appRouter);
  });

  test('app renders without crashing with different client IDs', () => {
    const clientIds = [
      'short-id',
      'very-long-google-oauth-client-id-with-special-characters-123.apps.googleusercontent.com',
      '12345',
      undefined,
      ''
    ];
    
    clientIds.forEach(clientId => {
      if (clientId !== undefined) {
        process.env.REACT_APP_GOOGLE_CLIENT_ID = clientId;
      } else {
        delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
      }
      
      const { unmount } = render(<App />);
      expect(screen.getByTestId('app-router')).toBeInTheDocument();
      unmount();
    });
  });

  test('app component exports are accessible', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  test('environment variable is properly read from process.env', () => {
    const originalEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    // Test with different environment values
    const testValues = ['prod-client-id', 'dev-client-id', 'test-123'];
    
    testValues.forEach(value => {
      process.env.REACT_APP_GOOGLE_CLIENT_ID = value;
      
      const { unmount } = render(<App />);
      const googleProvider = screen.getByTestId('google-oauth-provider');
      expect(googleProvider).toHaveAttribute('data-client-id', value);
      unmount();
    });
    
    // Restore original value
    process.env.REACT_APP_GOOGLE_CLIENT_ID = originalEnv;
  });
});
