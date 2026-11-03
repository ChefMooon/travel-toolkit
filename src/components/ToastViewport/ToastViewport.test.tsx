/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastViewport, { useToastHost } from '@/components/ToastViewport';
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

  it('runs an action callback and closes the toast', () => {
    const onAction = vi.fn();
    act(() => {
      useToastStore.getState().pushToast({
        type: 'success',
        title: 'Saved',
        message: 'Slot saved.',
        action: { label: 'Undo', onAction },
      });
    });

    render(<ToastViewport />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('defaults to 8000ms with an action and 4800ms without', () => {
    let plain = '';
    let withAction = '';
    act(() => {
      plain = useToastStore.getState().pushToast({ type: 'success', title: 'A', message: 'a' });
      withAction = useToastStore.getState().pushToast({
        type: 'success',
        title: 'B',
        message: 'b',
        action: { label: 'Undo', onAction: vi.fn() },
      });
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.find((x) => x.id === plain)?.durationMs).toBe(4800);
    expect(toasts.find((x) => x.id === withAction)?.durationMs).toBe(8000);
  });

  it('pauses auto-dismiss while hovered and resumes with the remaining time', () => {
    act(() => {
      useToastStore.getState().pushToast({ type: 'success', title: 'Hover me', message: 'm', durationMs: 1000 });
    });
    render(<ToastViewport />);
    const toast = screen.getByText('Hover me').closest('article')!;

    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.mouseEnter(toast);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Hover me')).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Hover me')).not.toBeInTheDocument();
  });

  it('pauses auto-dismiss while focus is within the toast', () => {
    act(() => {
      useToastStore.getState().pushToast({ type: 'success', title: 'Focus me', message: 'm', durationMs: 1000 });
    });
    render(<ToastViewport />);
    const button = screen.getByRole('button', { name: 'Dismiss notification' });

    fireEvent.focus(button);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Focus me')).toBeInTheDocument();

    fireEvent.blur(button);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Focus me')).not.toBeInTheDocument();
  });

  it('renders inside a registered toast host', () => {
    function Host() {
      const ref = useToastHost();
      return <div data-testid="host" ref={ref} />;
    }
    act(() => {
      useToastStore.getState().pushToast({ type: 'success', title: 'Hosted', message: 'm' });
    });

    const { unmount } = render(
      <>
        <Host />
        <ToastViewport />
      </>
    );
    expect(screen.getByTestId('host')).toContainElement(screen.getByText('Hosted'));
    unmount();
  });

  it('stops hosting toasts once the host is released (e.g. a closing, inert dialog)', () => {
    function Host({ id, active }: { id: string; active: boolean }) {
      const ref = useToastHost(active);
      return <div data-testid={id} ref={ref} />;
    }
    const tree = (closing: boolean) => (
      <>
        <Host id="outer" active />
        <Host id="closing" active={!closing} />
        <ToastViewport />
      </>
    );

    const { container, rerender, unmount } = render(tree(false));
    act(() => {
      useToastStore.getState().pushToast({ type: 'success', title: 'Before closing', message: 'm' });
    });
    expect(screen.getByTestId('closing')).toContainElement(screen.getByText('Before closing'));

    rerender(tree(true));
    act(() => {
      useToastStore.getState().pushToast({ type: 'success', title: 'Saved and started new trip', message: 'm' });
    });

    const toast = screen.getByText('Saved and started new trip');
    expect(screen.getByTestId('closing')).not.toContainElement(toast);
    expect(screen.getByTestId('outer')).toContainElement(toast);

    // With no other host left, toasts fall back to the global viewport.
    rerender(
      <>
        <Host id="closing" active={false} />
        <ToastViewport />
      </>
    );
    const fallback = screen.getByText('Saved and started new trip');
    expect(screen.getByTestId('closing')).not.toContainElement(fallback);
    expect(fallback.closest('.toast-viewport')?.parentElement).toBe(container);
    unmount();
  });
});
