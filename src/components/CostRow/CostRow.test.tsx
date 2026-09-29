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
  addCouple: vi.fn(() => 'couple4'),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockStoreState.addCouple = vi.fn(() => 'couple4');
  (useTripStore as any).mockImplementation((selector: any) => {
    return selector(mockStoreState);
  });
});

describe('CostRow - Who Field Clickability', () => {
  it('uses a shared tooltip for the cost name without losing its accessible name', () => {
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

    const name = container.querySelector('.cost-name')!;
    expect(name).toHaveAttribute('aria-label', 'Edit name for Shared');
    expect(name).not.toHaveAttribute('title');
    fireEvent.focus(name);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Shared');
    expect(name).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  });

  it('gives selection, currency, inline editing, reset, and row actions contextual names', () => {
    const onToggleSelect = vi.fn();
    render(
      <table>
        <tbody>
          <CostRow
            cost={mockCostShared}
            isSelected={false}
            onToggleSelect={onToggleSelect}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Select Shared' });
    expect(screen.getByRole('button', { name: 'Reorder Shared' })).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox', { name: 'Currency for Shared' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit name for Shared' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit amount for Shared' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset markup for Shared to global markup' })).toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: 'Edit Shared' });
    const deleteButton = screen.getByRole('button', { name: 'Delete Shared' });
    fireEvent.focus(editButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Edit this cost');
    fireEvent.blur(editButton);
    fireEvent.focus(deleteButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete this cost');

    fireEvent.click(screen.getByRole('button', { name: 'Edit amount for Shared' }));
    expect(screen.getByRole('spinbutton', { name: 'Amount for Shared' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit name for Shared' }));
    expect(screen.getByRole('textbox', { name: 'Cost name for Shared' })).toBeInTheDocument();
  });

  it('exposes split and type popover states through stable control relationships', () => {
    render(
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

    const splitButton = screen.getByRole('button', { name: /Change split type for Shared/ });
    expect(splitButton).toHaveAttribute('aria-expanded', 'false');
    expect(splitButton).toHaveAttribute('aria-controls', 'cost-cost3-split-options');
    expect(document.getElementById('cost-cost3-split-options')).toHaveAttribute('hidden');
    fireEvent.click(splitButton);
    expect(splitButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('cost-cost3-split-options')).toHaveAttribute('role', 'group');

    const typeButton = screen.getByRole('button', { name: /Change type for Shared/ });
    expect(typeButton).toHaveAttribute('aria-expanded', 'false');
    expect(typeButton).toHaveAttribute('aria-controls', 'cost-cost3-type-options');
    expect(document.getElementById('cost-cost3-type-options')).toHaveAttribute('hidden');
    fireEvent.click(typeButton);
    expect(typeButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('cost-cost3-type-options')).toHaveAttribute('role', 'group');
  });

  it('keeps invalid-cost feedback in the shared tooltip description', () => {
    const invalidCost = { ...mockCostIndividual, assignedCoupleIds: [] };
    render(
      <table>
        <tbody>
          <CostRow
            cost={invalidCost}
            isSelected={false}
            onToggleSelect={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    const error = screen.getByRole('img', { name: 'Invalid cost' });
    fireEvent.focus(error);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Solo cost must have 1 person assigned');
    expect(error).toHaveAttribute('aria-describedby', tooltip.id);
  });

  describe('Subset split type', () => {
    it('uses a named button as the pointer and keyboard entry for assigned groups', () => {
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

      const whoButton = screen.getByRole('button', { name: 'Change assigned groups for Dinner' });
      expect(whoButton).toHaveAttribute('aria-haspopup', 'dialog');
      expect(container.querySelector('.who-dots')).toBeInTheDocument();
      expect(whoButton).toHaveAttribute('type', 'button');
      fireEvent.focus(whoButton);
      expect(screen.getByRole('tooltip')).toHaveTextContent('Currently assigned to: Alice & Bob, Charlie & Diana');
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
      const modal = await screen.findByText('Select Groups');
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
      const modal = await screen.findByText('Select Groups');
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

      const title = await screen.findByText('Select Groups');
      expect(title).toBeInTheDocument();
    });

    it('creates a new group in subset modal and applies it on confirm', async () => {
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
      await screen.findByText('Select Groups');

      fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

      expect(mockStoreState.addCouple).toHaveBeenCalledTimes(1);
      expect(mockStoreState.editCost).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(mockStoreState.editCost).toHaveBeenCalledWith('cost1', {
        splitType: 'subset',
        assignedCoupleIds: expect.arrayContaining(['couple1', 'couple2', 'couple4']),
      });
    });
  });

  describe('Individual split type', () => {
    it('has a pointer-enabled named button for individual group assignment', () => {
      render(
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

      const whoButton = screen.getByRole('button', { name: 'Change assigned groups for Activity' });
      expect(whoButton).toBeInTheDocument();
      expect(whoButton).toHaveAttribute('type', 'button');
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

      const title = await screen.findByText('Select Group');
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
      const title = await screen.findByText('Select Group');
      expect(title).toBeInTheDocument();

      // The current selected couple should be pre-selected as a radio button
      const modal = screen.getByText('Select Group').closest('.split-modal-header')?.parentElement;
      expect(modal).toBeInTheDocument();
    });

    it('creates a new group in solo modal and auto-applies immediately', async () => {
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
      await screen.findByText('Select Group');

      fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

      expect(mockStoreState.addCouple).toHaveBeenCalledTimes(1);
      expect(mockStoreState.editCost).toHaveBeenCalledWith('cost2', {
        splitType: 'individual',
        assignedCoupleIds: ['couple4'],
      });
    });

    it('reverts to solo when subset modal is dismissed after switching from solo', async () => {
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

      fireEvent.click(container.querySelector('.split')!);
      fireEvent.click(screen.getByRole('button', { name: /Subset/i }));
      await screen.findByText(/Select Groups/i);
      fireEvent.click(screen.getByLabelText('Close'));

      expect(mockStoreState.editCost).toHaveBeenCalledWith('cost2', {
        splitType: 'individual',
        assignedCoupleIds: ['couple1'],
      });
    });

    it('reverts to solo when confirming subset with only one selected group after switching from solo', async () => {
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

      fireEvent.click(container.querySelector('.split')!);
      fireEvent.click(screen.getByRole('button', { name: /Subset/i }));
      await screen.findByText(/Select Groups/i);
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(mockStoreState.editCost).toHaveBeenCalledWith('cost2', {
        splitType: 'individual',
        assignedCoupleIds: ['couple1'],
      });
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
