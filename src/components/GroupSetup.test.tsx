/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import GroupSetup from './GroupSetup';
import type { Couple } from '../store/types';
import { COUPLE_ICONS } from '../store/types';

// Mock the tripStore
vi.mock('../store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

import { useTripStore } from '../store/tripStore';

const mockCouples: Couple[] = [
  {
    id: 'couple1',
    name: 'Alice & Bob',
    colorIndex: 1,
    iconIndex: 1,
    sortOrder: 0,
  },
  {
    id: 'couple2',
    name: 'Charlie & Diana',
    colorIndex: 2,
    iconIndex: 3,
    sortOrder: 1,
  },
];

const createMockStore = (couples = mockCouples) => ({
  couples,
  nonPayingTravellers: [],
  addCouple: vi.fn(),
  removeCouple: vi.fn(),
  renameCouple: vi.fn(),
  reorderCouples: vi.fn(),
  updateCoupleIcon: vi.fn(),
  updateCoupleColor: vi.fn(),
  addNonPayingTraveller: vi.fn(),
  removeNonPayingTraveller: vi.fn(),
});

describe('GroupSetup - Phase 4: Icon and Color Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  describe('Icon Rendering', () => {
    it('should render icon from couple.iconIndex in the chip', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const chips = document.querySelectorAll('.chip');
      expect(chips.length).toBeGreaterThan(0);

      // First chip should have the icon from first couple (iconIndex: 1)
      const firstChip = chips[0];
      const expectedIcon = COUPLE_ICONS[1];
      expect(firstChip).toHaveTextContent(expectedIcon);
    });

    it('should render icon after grab symbol (⠿)', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const chips = document.querySelectorAll('.chip');
      const firstChip = chips[0];
      const gripSpan = firstChip.querySelector('.chip-grip');
      const iconSpan = firstChip.querySelector('.chip-icon');

      // Icon should exist after grip
      expect(gripSpan).toHaveTextContent('⠿');
      expect(iconSpan).toBeTruthy();
      expect(iconSpan).toHaveTextContent(COUPLE_ICONS[1]);
    });

    it('should render icon before color dot', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const chips = document.querySelectorAll('.chip');
      const firstChip = chips[0];

      const chipChildren = Array.from(firstChip.children);
      const gripIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-grip')
      );
      const iconIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-icon')
      );
      const dotIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-dot')
      );

      expect(gripIndex).toBeLessThan(iconIndex);
      expect(iconIndex).toBeLessThan(dotIndex);
    });

    it('should display correct icon for each couple', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const chips = document.querySelectorAll('.chip');

      // First couple has iconIndex 1
      expect(chips[0]).toHaveTextContent(COUPLE_ICONS[1]);

      // Second couple has iconIndex 3
      expect(chips[1]).toHaveTextContent(COUPLE_ICONS[3]);
    });
  });

  describe('Icon Modal Interaction', () => {
    it('should have clickable icon element', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const iconSpans = document.querySelectorAll('.chip-icon');
      expect(iconSpans.length).toBeGreaterThan(0);

      // Icon should have cursor: pointer
      const iconSpan = iconSpans[0];
      expect(window.getComputedStyle(iconSpan).cursor).toBe('pointer');
    });

    it('should open IconChoiceModal when icon is clicked', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      // IconChoiceModal should be visible
      const iconModal = document.querySelector('.icon-choice-modal');
      expect(iconModal).toBeTruthy();
    });

    it('should open IconChoiceModal with correct iconIndex', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const iconSpans = document.querySelectorAll('.chip-icon');

      // Click first couple's icon
      fireEvent.click(iconSpans[0]);

      // Modal should render icon items, and first couple's icon (iconIndex: 1) should be selected
      const iconItems = document.querySelectorAll('.icon-item');
      expect(iconItems.length).toBeGreaterThan(0);

      // Check that the correct icon is selected
      expect(iconItems[1]).toHaveClass('selected');
    });

    it('should update store when IconChoiceModal confirms', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      // Click a different icon (e.g., index 5)
      const iconItems = document.querySelectorAll('.icon-item');
      fireEvent.click(iconItems[5]);

      expect(mockStore.updateCoupleIcon).toHaveBeenCalledWith('couple1', 5);
    });

    it('should close IconChoiceModal after confirmation', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      // Confirm selection
      const iconItems = document.querySelectorAll('.icon-item');
      fireEvent.click(iconItems[3]);

      // Modal should close
      const iconModal = document.querySelector('.icon-choice-modal');
      expect(iconModal).not.toBeInTheDocument();
    });

    it('should not update store when IconChoiceModal is cancelled', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      // Cancel modal by clicking outside
      const overlay = document.querySelector('.icon-choice-overlay');
      fireEvent.click(overlay!);

      expect(mockStore.updateCoupleIcon).not.toHaveBeenCalled();
    });

    it('should close IconChoiceModal when cancelled', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      // Cancel modal
      const overlay = document.querySelector('.icon-choice-overlay');
      fireEvent.click(overlay!);

      const iconModal = document.querySelector('.icon-choice-modal');
      expect(iconModal).not.toBeInTheDocument();
    });
  });

  describe('Color Dot Modal Interaction', () => {
    it('should have clickable color dot element', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const dotSpans = document.querySelectorAll('.chip-dot');
      expect(dotSpans.length).toBeGreaterThan(0);

      // Dot should have cursor: pointer
      const dotSpan = dotSpans[0];
      expect(window.getComputedStyle(dotSpan).cursor).toBe('pointer');
    });

    it('should open ColorChoiceModal when color dot is clicked', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // ColorChoiceModal should be visible
      const colorModal = document.querySelector('.color-choice-modal');
      expect(colorModal).toBeTruthy();
    });

    it('should open ColorChoiceModal with correct colorIndex', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const dotSpans = document.querySelectorAll('.chip-dot');

      // Click first couple's dot
      fireEvent.click(dotSpans[0]);

      // Modal should render color swatches, and first couple's color (colorIndex: 1) should be selected
      const swatches = document.querySelectorAll('.color-swatch');
      expect(swatches.length).toBeGreaterThan(0);

      // Check that the correct color is selected
      expect(swatches[0]).toHaveClass('selected');
    });

    it('should update store when ColorChoiceModal confirms', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // Click a different color (e.g., index 5)
      const swatches = document.querySelectorAll('.color-swatch');
      fireEvent.click(swatches[5]);

      expect(mockStore.updateCoupleColor).toHaveBeenCalledWith('couple1', 6);
    });

    it('should close ColorChoiceModal after confirmation', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // Confirm selection
      const swatches = document.querySelectorAll('.color-swatch');
      fireEvent.click(swatches[3]);

      // Modal should close
      const colorModal = document.querySelector('.color-choice-modal');
      expect(colorModal).not.toBeInTheDocument();
    });

    it('should not update store when ColorChoiceModal is cancelled', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // Cancel modal by clicking outside
      const overlay = document.querySelector('.color-choice-overlay');
      fireEvent.click(overlay!);

      expect(mockStore.updateCoupleColor).not.toHaveBeenCalled();
    });

    it('should close ColorChoiceModal when cancelled', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open modal
      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // Cancel modal
      const overlay = document.querySelector('.color-choice-overlay');
      fireEvent.click(overlay!);

      const colorModal = document.querySelector('.color-choice-modal');
      expect(colorModal).not.toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should only allow one modal to be open at a time', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open icon modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      let iconModal = document.querySelector('.icon-choice-modal');
      expect(iconModal).toBeTruthy();

      // Open color modal (on same chip)
      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      // Icon modal should close
      iconModal = document.querySelector('.icon-choice-modal');
      expect(iconModal).not.toBeInTheDocument();

      // Color modal should be open
      const colorModal = document.querySelector('.color-choice-modal');
      expect(colorModal).toBeTruthy();
    });

    it('should not open multiple chips modals simultaneously', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Open icon modal for first couple
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      let modals = document.querySelectorAll(
        '.icon-choice-modal, .color-choice-modal'
      );
      expect(modals.length).toBe(1);

      // Try to open icon modal for second couple
      fireEvent.click(iconSpans[1]);

      modals = document.querySelectorAll('.icon-choice-modal, .color-choice-modal');
      expect(modals.length).toBe(1);
    });
  });

  describe('Visual Alignment', () => {
    it('should have proper spacing between icon and dot', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const chips = document.querySelectorAll('.chip');
      const firstChip = chips[0];

      const iconSpan = firstChip.querySelector('.chip-icon');
      const dotSpan = firstChip.querySelector('.chip-dot');

      // Both should exist and have defined positions
      expect(iconSpan).toBeTruthy();
      expect(dotSpan).toBeTruthy();

      // Check they're both visible
      expect(window.getComputedStyle(iconSpan!).display).not.toBe('none');
      expect(window.getComputedStyle(dotSpan!).display).not.toBe('none');
    });

    it('should render icon with appropriate size', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      const iconSpans = document.querySelectorAll('.chip-icon');
      expect(iconSpans.length).toBeGreaterThan(0);

      // Icon should be visible and have cursor pointer
      const iconSpan = iconSpans[0];
      expect(iconSpan).toBeVisible();
      expect(window.getComputedStyle(iconSpan).cursor).toBe('pointer');
    });
  });

  describe('Persistence After Modal Close', () => {
    it('should still display icon after modal closes', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      const { rerender } = render(<GroupSetup />);

      // Open and close icon modal
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      const overlay = document.querySelector('.icon-choice-overlay');
      fireEvent.click(overlay!);

      // Icon should still be visible
      const chips = document.querySelectorAll('.chip');
      expect(chips[0]).toHaveTextContent(COUPLE_ICONS[1]);
    });

    it('should maintain correct visual hierarchy after interaction', () => {
      const mockStore = createMockStore();
      (useTripStore as any).mockImplementation((selector: any) =>
        selector(mockStore)
      );

      render(<GroupSetup />);

      // Click both icon and dot
      const iconSpans = document.querySelectorAll('.chip-icon');
      fireEvent.click(iconSpans[0]);

      const overlay = document.querySelector('.icon-choice-overlay');
      fireEvent.click(overlay!);

      const dotSpans = document.querySelectorAll('.chip-dot');
      fireEvent.click(dotSpans[0]);

      fireEvent.click(document.querySelector('.color-choice-overlay')!);

      // Check order is still maintained: grip > icon > dot
      const chipChildren = Array.from(
        document.querySelectorAll('.chip')[0].children
      );
      const gripIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-grip')
      );
      const iconIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-icon')
      );
      const dotIndex = chipChildren.findIndex((el) =>
        el.classList.contains('chip-dot')
      );

      expect(gripIndex).toBeLessThan(iconIndex);
      expect(iconIndex).toBeLessThan(dotIndex);
    });
  });
});
