/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SplitAssignmentModal from '@/components/SplitAssignmentModal';
import type { Couple } from '@/store/types';

const mockCouples: Couple[] = [
  { id: 'c1', name: 'Alpha', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
  { id: 'c2', name: 'Beta', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
];

const baseProps = {
  open: true,
  mode: 'subset' as const,
  couples: mockCouples,
  selectedCoupleIds: [],
  onToggleCouple: vi.fn(),
  onConfirmSubset: vi.fn(),
  onClose: vi.fn(),
  onCreateGroup: vi.fn(),
};

describe('SplitAssignmentModal', () => {
  it('FE-SAM-001 subset mode renders "Select Groups" header and checkboxes', () => {
    render(<SplitAssignmentModal {...baseProps} mode="subset" />);

    expect(screen.getByText('Select Groups')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('FE-SAM-002 individual mode renders "Select Group" header and radio buttons', () => {
    render(<SplitAssignmentModal {...baseProps} mode="individual" />);

    expect(screen.getByText('Select Group')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('FE-SAM-003 each couple row is labelled with the couple name', () => {
    render(<SplitAssignmentModal {...baseProps} mode="subset" />);

    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/Beta/)).toBeInTheDocument();
  });

  it('FE-SAM-004 clicking a row calls onToggleCouple with the correct coupleId', () => {
    const onToggleCouple = vi.fn();
    render(<SplitAssignmentModal {...baseProps} mode="subset" onToggleCouple={onToggleCouple} />);

    fireEvent.click(screen.getAllByRole('checkbox')[0]!);

    expect(onToggleCouple).toHaveBeenCalledWith('c1');
  });

  it('FE-SAM-005 confirm button is disabled when no couples are selected (subset mode)', () => {
    render(<SplitAssignmentModal {...baseProps} mode="subset" selectedCoupleIds={[]} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('FE-SAM-006 confirm button calls onConfirmSubset when ≥1 couple is selected', () => {
    const onConfirmSubset = vi.fn();
    render(
      <SplitAssignmentModal
        {...baseProps}
        mode="subset"
        selectedCoupleIds={['c1']}
        onConfirmSubset={onConfirmSubset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirmSubset).toHaveBeenCalledTimes(1);
  });

  it('FE-SAM-007 empty state message renders when couples array is empty', () => {
    render(<SplitAssignmentModal {...baseProps} mode="subset" couples={[]} />);

    expect(screen.getByText(/No groups yet/i)).toBeInTheDocument();
  });

  it('FE-SAM-008 backdrop overlay click calls onClose', () => {
    const onClose = vi.fn();
    render(<SplitAssignmentModal {...baseProps} mode="subset" onClose={onClose} />);

    const overlay = document.body.querySelector('.modal-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-SAM-009 Create Group button calls onCreateGroup', () => {
    const onCreateGroup = vi.fn();
    render(<SplitAssignmentModal {...baseProps} mode="subset" onCreateGroup={onCreateGroup} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    expect(onCreateGroup).toHaveBeenCalledTimes(1);
  });
});
