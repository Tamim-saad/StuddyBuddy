import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Rendering', () => {
    test('renders button with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    test('renders button with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button', { name: /custom button/i });
      expect(button).toHaveClass('custom-class');
    });

    test('renders button with different variants', () => {
      const { rerender } = render(<Button variant="destructive">Destructive</Button>);
      
      let button = screen.getByRole('button', { name: /destructive/i });
      expect(button).toHaveClass('bg-destructive');
      
      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button', { name: /outline/i });
      expect(button).toHaveClass('border');
      
      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-secondary');
      
      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('hover:bg-accent');
      
      rerender(<Button variant="link">Link</Button>);
      button = screen.getByRole('button', { name: /link/i });
      expect(button).toHaveClass('text-primary');
    });

    test('renders button with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      
      let button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('h-8');
      
      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('h-10');
      
      rerender(<Button size="icon">Icon</Button>);
      button = screen.getByRole('button', { name: /icon/i });
      expect(button).toHaveClass('h-9 w-9');
    });
  });

  describe('User Interactions', () => {
    test('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles disabled state', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles focus and blur events', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Test
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /focus test/i });
      
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper button role', () => {
      render(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      
      const button = screen.getByLabelText('Custom label');
      expect(button).toBeInTheDocument();
    });

    test('supports aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="description">Button</Button>
          <div id="description">Button description</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    test('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Props Forwarding', () => {
    test('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Ref Test</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test('forwards additional props', () => {
      render(
        <Button 
          data-testid="custom-button"
          data-custom="value"
          title="Tooltip"
        >
          Props Test
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
      expect(button).toHaveAttribute('title', 'Tooltip');
    });
  });

  describe('Edge Cases', () => {
    test('renders with empty children', () => {
      render(<Button></Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('renders with null children', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles multiple class names', () => {
      render(<Button className="class1 class2">Multiple Classes</Button>);
      
      const button = screen.getByRole('button', { name: /multiple classes/i });
      expect(button).toHaveClass('class1');
      expect(button).toHaveClass('class2');
    });
  });
}); 