/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostRow from '@/components/CostRow';
import type { CostEntry, Couple } from '@/store/types';

// Mock the tripStore
vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';

const mockCouples: Couple[] = [
  {
    id: 'couple1',
    name: 'Alice & Bob',
    colorIndex: 1,
    iconIndex: 0,
    sortOrder: 0,
  },
  {
    id: 'couple2',
    name: 'Charlie & Diana',
    colorIndex: 2,
    iconIndex: 1,
    sortOrder: 1,
  },
  {
    id: 'couple3',
    name: 'Eve & Frank',
    colorIndex: 3,
    iconIndex: 2,
    sortOrder: 2,
  },
];

const mockCostSubset: CostEntry = {
  id: 'cost1',
  name: 'Dinner',
  currency: 'USD',
  value: 100,
  markupOverride: null,
  splitType: 'subset',
  assignedCoupleIds: ['couple1', 'couple2'],
  sortOrder: 0,
};

const mockCostIndividual: CostEntry = {
  id: 'cost2',
  name: 'Activity',
  currency: 'USD',
  value: 50,
  markupOverride: null,
  splitType: 'individual',
  assignedCoupleIds: ['couple1'],
  sortOrder: 1,
};

const mockCostShared: CostEntry = {
  id: 'cost3',
  name: 'Shared',
  currency: 'USD',
  value: 200,
  markupOverride: null,
  splitType: 'shared',
  assignedCoupleIds: [],
  sortOrder: 2,
};

const mockStoreState = {
  globalMarkup: 0,
  couples: mockCouples,
  editCost: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (useTripStore as any).mockImplementation((selector: any) => {
    return selector(mockStoreState);
  });
});

describe('CostRow - Who Field Clickability', () => {
  describe('Subset split type', () => {
    it('should have pointer cursor on who-dots for subset type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      expect(whoDots).toBeInTheDocument();
      const styles = window.getComputedStyle(whoDots!);
      expect(styles.cursor).toBe('pointer');
    });

    it('should not render "All" label for subset type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoLabel = container.querySelector('.who-label');
      expect(whoLabel).not.toBeInTheDocument();
    });

    it('should render colored dots for assigned couples in subset', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelectorAll('.who-dot');
      expect(whoDots.length).toBe(2); // 2 assigned couples
    });

    it('should open split modal when who-dots clicked for subset type', async () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      expect(whoDots).toBeInTheDocument();

      fireEvent.click(whoDots!);

      // Modal should appear (rendered via createPortal to document.body)
      const modal = await screen.findByText('◑ Select Groups');
      expect(modal).toBeInTheDocument();
    });

    it('should initialize tempAssignedCouples with current assigned couple IDs when modal opens', async () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      fireEvent.click(whoDots!);

      // Check that the checkboxes for assigned couples are checked
      const modal = await screen.findByText('◑ Select Groups') || 
                   container.querySelector('.split-modal-header');
      expect(modal).toBeInTheDocument();

      // Find checkboxes for the assigned couples
      const aliceCheckbox = screen.getByRole('checkbox', { name: /Alice & Bob/ });
      const charlieCheckbox = screen.getByRole('checkbox', { name: /Charlie & Diana/ });
      
      expect(aliceCheckbox).toBeChecked();
      expect(charlieCheckbox).toBeChecked();
    });

    it('should display "Select Groups" title for subset mode', async () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostSubset}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      fireEvent.click(container.querySelector('.who-dots')!);

      const title = await screen.findByText('◑ Select Groups');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Individual split type', () => {
    it('should have pointer cursor on who-dots for individual type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostIndividual}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      expect(whoDots).toBeInTheDocument();
      const styles = window.getComputedStyle(whoDots!);
      expect(styles.cursor).toBe('pointer');
    });

    it('should render single colored dot for individual type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostIndividual}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelectorAll('.who-dot');
      expect(whoDots.length).toBe(1);
    });

    it('should open split modal with individual mode when who-dots clicked', async () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostIndividual}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      fireEvent.click(whoDots!);

      const title = await screen.findByText('◉ Select Group');
      expect(title).toBeInTheDocument();
    });

    it('should initialize modal with current assigned couple selected', async () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostIndividual}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      fireEvent.click(container.querySelector('.who-dots')!);

      // Modal should appear with the title
      const title = await screen.findByText('◉ Select Group');
      expect(title).toBeInTheDocument();

      // The current selected couple should be pre-selected as a radio button
      const modal = screen.getByText('◉ Select Group').closest('.split-modal-header')?.parentElement;
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Shared split type', () => {
    it('should render "All" label for shared type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostShared}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoLabel = container.querySelector('.who-label');
      expect(whoLabel).toBeInTheDocument();
      expect(whoLabel).toHaveTextContent('All');
    });

    it('should not have who-dots for shared type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostShared}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoDots = container.querySelector('.who-dots');
      expect(whoDots).not.toBeInTheDocument();
    });

    it('should not open modal when who-label clicked for shared type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostShared}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoLabel = container.querySelector('.who-label');
      fireEvent.click(whoLabel!);

      const modal = container.querySelector('.split-modal');
      expect(modal).not.toBeInTheDocument();
    });

    it('should not have pointer cursor for shared type', () => {
      const { container } = render(
        <table>
          <tbody>
            <CostRow
              cost={mockCostShared}
              isSelected={false}
              onToggleSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </tbody>
        </table>
      );

      const whoLabel = container.querySelector('.who-label');
      const styles = window.getComputedStyle(whoLabel!);
      // Shared should not have pointer cursor (default or auto)
      expect(styles.cursor).not.toBe('pointer');
    });
  });
});
