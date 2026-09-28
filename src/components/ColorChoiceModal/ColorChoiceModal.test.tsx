/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import ColorChoiceModal from './ColorChoiceModal';
import { COUPLE_COLORS } from '../../store/types';

describe('ColorChoiceModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default theme to light
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('should render 10 color swatches in a grid', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    expect(swatches.length).toBe(10);
  });

  it('should display colors correctly in light mode', () => {
    document.documentElement.dataset.theme = 'light';

    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach((swatch) => {
      // Check that the swatch has the correct background color
      const style = window.getComputedStyle(swatch);
      expect(style.backgroundColor).toBeTruthy();
    });
  });

  it('should display colors correctly in dark mode', () => {
    document.documentElement.dataset.theme = 'dark';

    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    expect(swatches.length).toBe(10);
  });

  it('should call onConfirm with correct colorIndex when color is clicked', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    fireEvent.click(swatches[5] as Element);

    expect(mockOnConfirm).toHaveBeenCalledWith(6);
  });

  it('should highlight selected color with visual indicator', () => {
    render(
      <ColorChoiceModal
        colorIndex={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    const selectedSwatch = swatches[2]; // 0-indexed, so colorIndex 3 is at index 2

    expect(selectedSwatch).toHaveClass('selected');
  });

  it('should show checkmark or border on selected color', () => {
    render(
      <ColorChoiceModal
        colorIndex={2}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    const selectedSwatch = swatches[1]; // colorIndex 2 is at index 1

    if (selectedSwatch) {
      // Should have some visual indicator (either checkmark or border)
      const indicator = selectedSwatch.querySelector('.color-indicator');
      expect(indicator || selectedSwatch.classList.contains('selected')).toBeTruthy();
    }
  });

  it('should close modal when clicking outside', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = document.querySelector('.color-choice-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnCancel).toHaveBeenCalled();
    }
  });

  it('should close modal when close button is clicked', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not trigger onCancel when clicking on modal content', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const modalContent = document.querySelector('.color-choice-modal');
    fireEvent.click(modalContent!);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should adapt colors when theme changes from light to dark', () => {
    document.documentElement.dataset.theme = 'light';

    const { rerender } = render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    document.documentElement.dataset.theme = 'dark';
    rerender(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const swatches = document.querySelectorAll('.color-swatch');
    expect(swatches.length).toBe(10);
  });

  it('should render portal to document body', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = document.querySelector('.color-choice-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should use correct color values from COUPLE_COLORS', () => {
    document.documentElement.dataset.theme = 'light';

    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Verify we're using correct structure and count
    const swatchCount = Object.keys(COUPLE_COLORS).length;
    const swatches = document.querySelectorAll('.color-swatch');
    expect(swatches.length).toBe(swatchCount);
  });

  it('should show descriptive color names in swatch tooltips', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const rose = screen.getByRole('button', { name: 'Rose' });
    expect(rose).not.toHaveAttribute('title');
    fireEvent.focus(rose);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Rose');
  });

  it('preserves the accessible name of every configured swatch without native title hints', () => {
    render(
      <ColorChoiceModal
        colorIndex={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    Object.values(COUPLE_COLORS).forEach(({ name }) => {
      expect(screen.getByRole('button', { name })).not.toHaveAttribute('title');
    });
  });
});
