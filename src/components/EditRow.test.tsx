/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditRow from '@/components/EditRow';
import type { Couple, Region } from '@/store/types';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/store/toastStore', () => ({
  useToastStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';
import { useToastStore } from '@/store/toastStore';

const mockCouples: Couple[] = [
  { id: 'c1', name: 'Group 1', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
  { id: 'c2', name: 'Group 2', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
  { id: 'c3', name: 'Group 3', colorIndex: 3, iconIndex: 3, sortOrder: 2 },
];

const mockStoreState: {
  couples: Couple[];
  globalMarkup: number;
  region: Region;
  addCouple: ReturnType<typeof vi.fn>;
} = {
  couples: mockCouples,
  globalMarkup: 66,
  region: 'Europe',
  addCouple: vi.fn(() => 'c4'),
};

const mockToastState = {
  pushToast: vi.fn(),
};

const renderEditRow = (props?: Partial<React.ComponentProps<typeof EditRow>>) => {
  const onSave = vi.fn();
  const onCancel = vi.fn();

  const result = render(
    <table>
      <tbody>
        <EditRow onSave={onSave} onCancel={onCancel} {...props} />
      </tbody>
    </table>
  );

  return { ...result, onSave, onCancel };
};

describe('EditRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockStoreState.couples = mockCouples;
    mockStoreState.globalMarkup = 66;
    mockStoreState.region = 'Europe';
    mockStoreState.addCouple = vi.fn(() => 'c4');

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );

    (useToastStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockToastState) => unknown) => selector(mockToastState)
    );
  });

  it('FE-EDT-001 saves a valid shared cost with global markup', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: 'Dinner' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '123.45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      name: 'Dinner',
      currency: 'USD',
      value: 123.45,
      markupOverride: null,
      splitType: 'shared',
      assignedCoupleIds: [],
    });
  });

  it('FE-EDT-002 does not save when required fields are invalid', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(mockToastState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'Save blocked',
      })
    );
  });

  it('FE-EDT-003 requires assignment when split type is subset', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: 'Museum' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(mockToastState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'Save blocked',
      })
    );
  });

  it('FE-EDT-004 keeps only first assigned group for individual split when multiple are preset', () => {
    const { onSave } = renderEditRow({
      initial: {
        id: 'cost-1',
        name: 'Taxi',
        currency: 'USD',
        value: 30,
        markupOverride: null,
        splitType: 'individual',
        assignedCoupleIds: ['c2', 'c1'],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        splitType: 'individual',
        assignedCoupleIds: ['c2'],
      })
    );
  });

  it('FE-EDT-005 saves custom markup when global markup is disabled', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: 'Brunch' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '88' },
    });

    const useGlobalCheckbox = screen.getByRole('checkbox', {
      name: /Use global markup/i,
    });
    fireEvent.click(useGlobalCheckbox);

    const markupInput = screen.getByPlaceholderText('0');
    fireEvent.change(markupInput, { target: { value: '12.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        markupOverride: 12.5,
      })
    );
  });

  it('FE-EDT-006 reset button restores global markup mode', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: 'Boat' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '20' },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Use global markup/i }));
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        markupOverride: null,
      })
    );
  });

  it('FE-EDT-007 shows region-filtered currency options plus always available currencies', () => {
    mockStoreState.region = 'Europe';
    renderEditRow();

    const currencySelect = screen.getByRole('combobox');
    const options = Array.from(currencySelect.querySelectorAll('option')).map((o) => o.value);

    expect(options).toEqual(['CAD', 'EUR', 'GBP', 'USD']);
  });

  it('FE-EDT-008 calls onCancel when cancel button is clicked', () => {
    const { onCancel } = renderEditRow();
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('FE-EDT-009 creates and assigns a new group from solo split modal', () => {
    const { onSave } = renderEditRow();

    fireEvent.change(screen.getByPlaceholderText('e.g. Hotel Night 1'), {
      target: { value: 'Taxi' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '25' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Solo' }));
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockStoreState.addCouple).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        splitType: 'individual',
        assignedCoupleIds: ['c4'],
      })
    );
  });
});