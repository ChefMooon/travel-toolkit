/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastViewport from '@/components/ToastViewport';
import { useToastStore } from '@/store/toastStore';

describe('ToastViewport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useToastStore.getState().clearToasts();
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    act(() => {
      useToastStore.getState().clearToasts();
    });
  });

  it('renders toasts and dismisses one manually', () => {
    act(() => {
      useToastStore.getState().pushToast({
        type: 'warning',
        title: 'Save blocked',
        message: 'Enter a valid amount.',
        durationMs: 8000,
      });
    });

    render(<ToastViewport />);

    expect(screen.getByText('Save blocked')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid amount.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByText('Save blocked')).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts when their duration elapses', () => {
    act(() => {
      useToastStore.getState().pushToast({
        type: 'error',
        title: 'Could not save new cost entry',
        message: 'Browser storage is full.',
        durationMs: 1200,
      });
    });

    render(<ToastViewport />);

    expect(screen.getByText('Could not save new cost entry')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.queryByText('Could not save new cost entry')).not.toBeInTheDocument();
  });

  it('uses assertive live region for errors and polite for non-errors', () => {
    act(() => {
      useToastStore.getState().pushToast({
        type: 'error',
        title: 'Error toast',
        message: 'Error detail',
        durationMs: 3000,
      });
    });

    act(() => {
      useToastStore.getState().pushToast({
        type: 'success',
        title: 'Success toast',
        message: 'Success detail',
        durationMs: 3000,
      });
    });

    render(<ToastViewport />);

    const errorToast = screen.getByText('Error toast').closest('article');
    const successToast = screen.getByText('Success toast').closest('article');

    expect(errorToast).toHaveAttribute('aria-live', 'assertive');
    expect(successToast).toHaveAttribute('aria-live', 'polite');
  });
});
