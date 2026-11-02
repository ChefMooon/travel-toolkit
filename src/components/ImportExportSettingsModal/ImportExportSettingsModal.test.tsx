import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImportExportSettingsModal from './ImportExportSettingsModal';

describe('ImportExportSettingsModal', () => {
  it('renders a dialog with an accessible name', () => {
    render(<ImportExportSettingsModal onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const heading = screen.getByRole('heading', { level: 2 });
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(screen.getByRole('dialog', { name: heading.textContent ?? '' })).toBeTruthy();
  });

  it('calls onClose when Escape is pressed inside the dialog', () => {
    const onClose = vi.fn();
    render(<ImportExportSettingsModal onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click but not on dialog click', () => {
    const onClose = vi.fn();
    const { baseElement } = render(<ImportExportSettingsModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(baseElement.querySelector('.ie-settings-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps Tab focus within the dialog', () => {
    render(<ImportExportSettingsModal onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
