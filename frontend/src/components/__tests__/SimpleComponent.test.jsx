import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const SimpleComponent = ({ title, children }) => (
  <div data-testid="simple-component">
    <h1>{title}</h1>
    <p>{children}</p>
  </div>
);

describe('SimpleComponent', () => {
  test('renders with title and children', () => {
    render(
      <SimpleComponent title="Test Title">
        Test content
      </SimpleComponent>
    );
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders without children', () => {
    render(<SimpleComponent title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });
}); 