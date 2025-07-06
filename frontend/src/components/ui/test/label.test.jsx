import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label Component', () => {
  test('renders label with correct text and className', () => {
    // Arrange
    const testText = 'Test Label';
    const testClass = 'test-class';

    // Act
    render(<Label className={testClass}>{testText}</Label>);
    
    // Assert
    const labelElement = screen.getByText(testText);
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveClass(testClass);
    expect(labelElement).toHaveClass('text-sm', 'font-medium', 'leading-none');
  });
});