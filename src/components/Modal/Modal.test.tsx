/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/Modal';

const baseProps = {
  icon: '⚠️',
  title: 'Confirm Action',
  body: 'Do you want to continue?',
  confirmLabel: 'Confirm',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('Modal', () => {
  it('FE-MOD-001 renders icon, title, body, and action buttons', () => {
    render(<Modal {...baseProps} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Do you want to continue?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('FE-MOD-002 calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<Modal {...baseProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('FE-MOD-003 calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<Modal {...baseProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('FE-MOD-004 closes when backdrop is clicked', () => {
    const onCancel = vi.fn();
    render(<Modal {...baseProps} onCancel={onCancel} />);

    const backdrop = document.body.querySelector('.modal-bd');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('FE-MOD-005 renders the backdrop and dialog through a document body portal', () => {
    const { container } = render(<Modal {...baseProps} />);

    const backdrop = document.body.querySelector('.modal-bd');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop?.parentElement).toBe(document.body);
    expect(container.querySelector('.modal-bd')).not.toBeInTheDocument();
    expect(backdrop?.querySelector('.modal')).toBeInTheDocument();
  });

  it('FE-MOD-006 includes dialog accessibility attributes', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = screen.getByText('Confirm Action');
    const body = screen.getByText('Do you want to continue?');
    expect(title).toHaveAttribute('id');
    expect(body).toHaveAttribute('id');
    expect(dialog).toHaveAttribute('aria-labelledby', title.getAttribute('id'));
    expect(dialog).toHaveAttribute('aria-describedby', body.getAttribute('id'));
  });

  it('FE-MOD-007 moves initial focus to the first action button', () => {
    render(<Modal {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('FE-MOD-008 traps focus forward when tabbing from the last focusable element', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByRole('dialog');
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    confirmButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(cancelButton).toHaveFocus();
  });

  it('FE-MOD-009 traps focus backward when shift-tabbing from the first focusable element', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByRole('dialog');
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    cancelButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

    expect(confirmButton).toHaveFocus();
  });

  it('FE-MOD-010 closes the modal when Escape is pressed', () => {
    const onCancel = vi.fn();
    render(<Modal {...baseProps} onCancel={onCancel} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});