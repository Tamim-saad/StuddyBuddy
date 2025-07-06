import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component', () => {
  test('renders input with correct type and handles user input', () => {
    // Arrange
    const testPlaceholder = 'Enter your text';
    const testValue = 'Hello World';
    const handleChange = jest.fn();

    // Act
    render(
      <Input 
        type="text"
        placeholder={testPlaceholder}
        onChange={handleChange}
        data-testid="test-input"
      />
    );
    
    const inputElement = screen.getByTestId('test-input');

    // Test placeholder
    expect(inputElement).toHaveAttribute('placeholder', testPlaceholder);
    
    // Test type
    expect(inputElement).toHaveAttribute('type', 'text');
    
    // Test user input
    fireEvent.change(inputElement, { target: { value: testValue } });
    expect(handleChange).toHaveBeenCalled();
    expect(inputElement.value).toBe(testValue);
  });
});