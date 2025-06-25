import { render, screen } from '@testing-library/react';

// Simple test to verify the testing setup works
test('basic test setup works', () => {
  const TestComponent = () => <div data-testid="test-element">Test</div>;
  render(<TestComponent />);
  expect(screen.getByTestId('test-element')).toBeInTheDocument();
});

test('simple calculation test', () => {
  expect(2 + 2).toBe(4);
});
