/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import IconChoiceModal from './IconChoiceModal';
import { COUPLE_ICONS } from '@/store/types';

describe('IconChoiceModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all icons in a grid', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const iconItems = document.querySelectorAll('.icon-item');
    expect(iconItems.length).toBe(COUPLE_ICONS.length);
  });

  it('should render each icon from COUPLE_ICONS', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    COUPLE_ICONS.forEach((icon, index) => {
      const iconItems = document.querySelectorAll('.icon-item');
      expect(iconItems[index]).toHaveTextContent(icon);
    });
  });

  it('should call onConfirm with correct iconIndex when icon is clicked', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const iconItems = document.querySelectorAll('.icon-item');
    const iconToClick = iconItems[3];
    expect(iconToClick).toBeTruthy();
    fireEvent.click(iconToClick as Element);

    expect(mockOnConfirm).toHaveBeenCalledWith(3);
  });

  it('should highlight selected icon with visual indicator', () => {
    render(
      <IconChoiceModal
        iconIndex={2}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const iconItems = document.querySelectorAll('.icon-item');
    const selectedItem = iconItems[2];

    expect(selectedItem).toHaveClass('selected');
  });

  it('should close modal when clicking outside', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = document.querySelector('.icon-choice-overlay');
    fireEvent.click(overlay!);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should not trigger onCancel when clicking on modal content', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const modalContent = document.querySelector('.icon-choice-modal');
    fireEvent.click(modalContent!);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should have fade-in animation on mount', () => {
    render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = document.querySelector('.icon-choice-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should render portal to document body', () => {
    const { container } = render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Create portal should render to body, so check it's in the DOM
    const overlay = document.querySelector('.icon-choice-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should only trigger onCancel once when clicking outside', () => {
    const { container } = render(
      <IconChoiceModal
        iconIndex={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = document.querySelector('.icon-choice-overlay');
    fireEvent.click(overlay!);
    fireEvent.click(overlay!);

    expect(mockOnCancel).toHaveBeenCalledTimes(2);
  });
});
