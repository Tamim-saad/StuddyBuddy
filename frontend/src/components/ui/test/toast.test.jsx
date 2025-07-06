import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toast, ToastProvider, ToastTitle, ToastDescription, ToastViewport } from '../toast';

const renderToast = (ui) => {
  return render(
    <ToastProvider swipeDirection="right">
      {ui}
      <ToastViewport />
    </ToastProvider>
  );
};

describe('Toast Component', () => {
  test('renders toast with default variant', () => {
    renderToast(
      <Toast role="status" data-testid="toast">
        <ToastTitle>Test Title</ToastTitle>
        <ToastDescription>Test Description</ToastDescription>
      </Toast>
    );

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveTextContent('Test Title');
    expect(toastElement).toHaveTextContent('Test Description');
  });

  test('renders toast with destructive variant', () => {
    renderToast(
      <Toast variant="destructive" role="status" data-testid="toast">
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>Something went wrong</ToastDescription>
      </Toast>
    );

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toHaveClass('destructive');
    expect(toastElement).toHaveTextContent('Error');
  });

  test('renders toast with success variant', () => {
    renderToast(
      <Toast variant="success" role="status" data-testid="toast">
        <ToastTitle>Success</ToastTitle>
        <ToastDescription>Operation completed</ToastDescription>
      </Toast>
    );

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toHaveClass('bg-green-50');
    expect(toastElement).toHaveTextContent('Success');
  });
});