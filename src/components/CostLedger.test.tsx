/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostLedger from '@/components/CostLedger';
import type { CostEntry } from '@/store/types';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
}));

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/CostRow', () => ({
  default: ({
    cost,
    isSelected,
    onToggleSelect,
    onEdit,
    onDelete,
  }: {
    cost: CostEntry;
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <tr data-testid={`cost-row-${cost.id}`}>
      <td>{cost.name}</td>
      <td>{isSelected ? 'selected' : 'unselected'}</td>
      <td><button onClick={onToggleSelect}>Toggle {cost.id}</button></td>
      <td><button onClick={onEdit}>Edit {cost.id}</button></td>
      <td><button onClick={onDelete}>Delete {cost.id}</button></td>
    </tr>
  ),
}));

vi.mock('@/components/EditRow', () => ({
  default: ({
    onSave,
    onCancel,
  }: {
    onSave: (data: {
      name: string;
      currency: string;
      value: number;
      markupOverride: number | null;
      splitType: 'shared' | 'subset' | 'individual';
      assignedCoupleIds: string[];
    }) => void;
    onCancel: () => void;
  }) => (
    <tr>
      <td>
        <button
          onClick={() =>
            onSave({
              name: 'Saved Cost',
              currency: 'USD',
              value: 100,
              markupOverride: null,
              splitType: 'shared',
              assignedCoupleIds: [],
            })
          }
        >
          Save Edit Row
        </button>
        <button onClick={onCancel}>Cancel Edit Row</button>
      </td>
    </tr>
  ),
}));

vi.mock('@/components/BulkActionBar', () => ({
  default: ({
    selectedCount,
    onApply,
    onClear,
  }: {
    selectedCount: number;
    onApply: (currency: string) => void;
    onClear: () => void;
  }) => (
    <div data-testid="bulk-bar">
      <span>Selected Count: {selectedCount}</span>
      <button onClick={() => onApply('JPY')}>Apply Bulk</button>
      <button onClick={onClear}>Clear Bulk</button>
    </div>
  ),
}));

vi.mock('@/components/Modal', () => ({
  default: ({
    title,
    onConfirm,
    onCancel,
  }: {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div>
      <div>{title}</div>
      <button onClick={onConfirm}>Confirm Delete</button>
      <button onClick={onCancel}>Cancel Delete</button>
    </div>
  ),
}));

import { useTripStore } from '@/store/tripStore';

const mockCosts: CostEntry[] = [
  {
    id: 'cost-2',
    name: 'Second',
    currency: 'USD',
    value: 20,
    markupOverride: null,
    splitType: 'shared',
    assignedCoupleIds: [],
    sortOrder: 1,
  },
  {
    id: 'cost-1',
    name: 'First',
    currency: 'USD',
    value: 10,
    markupOverride: null,
    splitType: 'shared',
    assignedCoupleIds: [],
    sortOrder: 0,
  },
];

const mockStoreState = {
  costs: mockCosts,
  addCost: vi.fn(),
  editCost: vi.fn(),
  deleteCost: vi.fn(),
  reorderCosts: vi.fn(),
  bulkSetCurrency: vi.fn(),
};

describe('CostLedger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.costs = [...mockCosts];

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );
  });

  it('FE-LED-001 renders costs sorted by sortOrder', () => {
    const { container } = render(<CostLedger />);
    const rows = container.querySelectorAll('tbody tr[data-testid^="cost-row-"]');

    expect(rows[0]).toHaveTextContent('First');
    expect(rows[1]).toHaveTextContent('Second');
  });

  it('FE-LED-002 adds a new cost via add flow', () => {
    render(<CostLedger />);

    fireEvent.click(screen.getByRole('button', { name: /Add Cost Entry/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Edit Row' }));

    expect(mockStoreState.addCost).toHaveBeenCalledWith({
      name: 'Saved Cost',
      currency: 'USD',
      value: 100,
      markupOverride: null,
      splitType: 'shared',
      assignedCoupleIds: [],
    });
  });

  it('FE-LED-003 edits an existing cost via edit flow', () => {
    render(<CostLedger />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit cost-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Edit Row' }));

    expect(mockStoreState.editCost).toHaveBeenCalledWith('cost-1', {
      name: 'Saved Cost',
      currency: 'USD',
      value: 100,
      markupOverride: null,
      splitType: 'shared',
      assignedCoupleIds: [],
    });
  });

  it('FE-LED-004 deletes a cost after confirmation', () => {
    render(<CostLedger />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete cost-2' }));
    expect(screen.getByText('Delete this cost?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    expect(mockStoreState.deleteCost).toHaveBeenCalledWith('cost-2');
  });

  it('FE-LED-005 applies bulk currency to selected costs and clears selection', () => {
    render(<CostLedger />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle cost-1' }));
    expect(screen.getByText('Selected Count: 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Bulk' }));

    expect(mockStoreState.bulkSetCurrency).toHaveBeenCalledWith(['cost-1'], 'JPY');
    expect(screen.getByText('Selected Count: 0')).toBeInTheDocument();
  });
});