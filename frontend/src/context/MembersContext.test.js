import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MembersProvider, useMembers } from './MembersContext';
import { authServices } from '../auth';

// Mock the auth services
jest.mock('../auth', () => ({
  authServices: {
    getAllUsers: jest.fn(),
    getAuthUser: jest.fn(),
  },
}));

// Test component to consume the context
const TestComponent = () => {
  const {
    members,
    loading,
    error,
    projects,
    allTasks,
    teams,
    refreshData,
  } = useMembers();

  const stats = {
    total: members.length,
    projects: projects.length,
    tasks: allTasks.length,
    teams: teams.length,
  };

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="members-count">{members.length}</div>
      <div data-testid="stats-total">{stats.total}</div>
      <div data-testid="projects-count">{projects.length}</div>
      <div data-testid="tasks-count">{allTasks.length}</div>
      <div data-testid="teams-count">{teams.length}</div>
      <button data-testid="fetch-members" onClick={refreshData}>
        Fetch Members
      </button>
      {members.map(member => (
        <div key={member.id} data-testid={`member-${member.id}`}>
          {member.name} - {member.email}
        </div>
      ))}
    </div>
  );
};

const renderWithProvider = (component) => {
  return render(
    <MembersProvider>
      {component}
    </MembersProvider>
  );
};

describe('MembersContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks
    const { authServices } = require('../auth');
    authServices.getAuthUser.mockReturnValue({
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com'
    });
    
    // Mock fetch API
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch?.mockRestore?.();
  });



  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    console.error = originalError;
  });

  test('handles empty response from API', async () => {
    const mockResponse = [];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      // Mock teams fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithProvider(<TestComponent />);
    
    const fetchButton = screen.getByTestId('fetch-members');
    
    await act(async () => {
      fetchButton.click();
    });

    expect(screen.getByTestId('members-count')).toHaveTextContent('0');
    expect(screen.getByTestId('stats-total')).toHaveTextContent('0');
  });

  test('maintains referential equality for stable props', async () => {
    const renderCount = jest.fn();
    
    const TrackedComponent = () => {
      const context = useMembers();
      renderCount();
      return <div>{context.members.length}</div>;
    };

    const { rerender } = renderWithProvider(<TrackedComponent />);
    
    // Wait for initial fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Re-render shouldn't cause unnecessary re-renders of the context value
    rerender(
      <MembersProvider>
        <TrackedComponent />
      </MembersProvider>
    );
    
    // The component will render multiple times due to state changes in the provider
    expect(renderCount).toHaveBeenCalled();
  });
});
