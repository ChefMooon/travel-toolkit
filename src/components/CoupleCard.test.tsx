import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useTripStore } from '../store/tripStore';
import CoupleCard from './CoupleCard';
import type { CoupleSummary } from '../store/types';

// Mock the modals
vi.mock('./IconChoiceModal', () => ({
  default: ({ iconIndex, onConfirm, onCancel }: any) => (
    <div data-testid="icon-modal">
      <button onClick={() => onConfirm(5)} data-testid="select-icon-6">
        Icon 6
      </button>
      <button onClick={onCancel} data-testid="cancel-icon">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('./ColorChoiceModal', () => ({
  default: ({ _colorIndex, onConfirm, onCancel }: any) => (
    <div data-testid="color-modal">
      <button onClick={() => onConfirm(3)} data-testid="select-color-3">
        Color 3
      </button>
      <button onClick={onCancel} data-testid="cancel-color">
        Cancel
      </button>
    </div>
  ),
}));

describe('CoupleCard', () => {
  const mockSummary: CoupleSummary = {
    coupleId: 'couple-1',
    coupleName: 'Test Couple',
    colorIndex: 1,
    iconIndex: 0, // 🧳
    currencies: [
      {
        currency: 'USD',
        shared: 100,
        subset: 50,
        individual: 25,
        subtotal: 175,
        usdEquivalent: 175,
      },
    ],
    grandTotalUSD: 175,
  };

  beforeEach(() => {
    // Reset store before each test
    const store = useTripStore.getState();
    store.resetTrip();
    store.addCouple();
    const couple = store.couples[0];
    if (couple) {
      store.updateCoupleIcon(couple.id, 0);
      store.updateCoupleColor(couple.id, 1);
    }
  });

  it('should render icon in card header from couple.iconIndex', () => {
    render(<CoupleCard summary={mockSummary} />);
    expect(screen.getByText('🧳')).toBeInTheDocument();
  });

  it('should render color dot between icon and group name', () => {
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    expect(colorDot).toBeInTheDocument();
    expect(colorDot.textContent).toBe('●');
  });

  it('should render couple name in header', () => {
    render(<CoupleCard summary={mockSummary} />);
    expect(screen.getByText('Test Couple')).toBeInTheDocument();
  });

  it('should make icon clickable and open IconChoiceModal', async () => {
    render(<CoupleCard summary={mockSummary} />);
    const iconElement = screen.getByTestId('s-head-icon');
    fireEvent.click(iconElement);
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });
  });

  it('should make color dot clickable and open ColorChoiceModal', async () => {
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    fireEvent.click(colorDot);
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });
  });

  it('should confirm icon selection and update store', async () => {
    const store = useTripStore.getState();
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-icon-6'));
    
    await waitFor(() => {
      const couple = store.couples.find(c => c.id === 'couple-1');
      expect(couple?.iconIndex).toBe(5);
    });
  });

  it('should confirm color selection and update store', async () => {
    const store = useTripStore.getState();
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('color-dot'));
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-color-3'));
    
    await waitFor(() => {
      const couple = store.couples.find(c => c.id === 'couple-1');
      expect(couple?.colorIndex).toBe(3);
    });
  });

  it('should cancel icon modal without updating store', async () => {
    const store = useTripStore.getState();
    const initialIconIndex = mockSummary.iconIndex;
    
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-icon'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('icon-modal')).not.toBeInTheDocument();
    });

    const couple = store.couples[0];
    expect(couple?.iconIndex).toBe(initialIconIndex);
  });

  it('should cancel color modal without updating store', async () => {
    const store = useTripStore.getState();
    const initialColorIndex = mockSummary.colorIndex;
    
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('color-dot'));
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-color'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('color-modal')).not.toBeInTheDocument();
    });

    const couple = store.couples[0];
    expect(couple?.colorIndex).toBe(initialColorIndex);
  });

  it('should close icon modal after confirmation', async () => {
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-icon-6'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('icon-modal')).not.toBeInTheDocument();
    });
  });

  it('should close color modal after confirmation', async () => {
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('color-dot'));
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-color-3'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('color-modal')).not.toBeInTheDocument();
    });
  });

  it('should have only one modal open at a time', async () => {
    render(<CoupleCard summary={mockSummary} />);
    
    // Open icon modal
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    // Close it
    fireEvent.click(screen.getByTestId('cancel-icon'));
    await waitFor(() => {
      expect(screen.queryByTestId('icon-modal')).not.toBeInTheDocument();
    });

    // Open color modal
    fireEvent.click(screen.getByTestId('color-dot'));
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });

    // Color modal should exist, icon modal should not
    expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-modal')).not.toBeInTheDocument();
  });

  it('should render color dot with theme-aware color', () => {
    // Set light theme
    const store = useTripStore.getState();
    store.setTheme('light');
    
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    
    // Color dot should have inline style with computed color
    expect(colorDot).toHaveStyle('color: rgb');
  });

  it('should display color dot with correct styling attributes', () => {
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    
    expect(colorDot).toHaveStyle('cursor: pointer');
  });

  it('should render all currency breakdown sections', () => {
    render(<CoupleCard summary={mockSummary} />);
    
    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Subset')).toBeInTheDocument();
    expect(screen.getByText('Individual')).toBeInTheDocument();
  });

  it('should render grand total', () => {
    render(<CoupleCard summary={mockSummary} />);
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
    expect(screen.getByText('$175.00')).toBeInTheDocument();
  });

  it('should apply correct card styling class', () => {
    render(<CoupleCard summary={mockSummary} />);
    const card = screen.getByTestId('s-card');
    
    expect(card).toHaveClass('s-card');
    expect(card).toHaveClass('s-card-c1'); // color class from colorIndex 1
  });

  it('should update card header appearance after icon change', async () => {
    const updatedSummary: CoupleSummary = {
      ...mockSummary,
      iconIndex: 3, // 🌸
    };

    const { rerender } = render(<CoupleCard summary={mockSummary} />);
    expect(screen.getByText('🧳')).toBeInTheDocument();

    rerender(<CoupleCard summary={updatedSummary} />);
    expect(screen.getByText('🌸')).toBeInTheDocument();
  });

  it('should update card header appearance after color change', async () => {
    const updatedSummary: CoupleSummary = {
      ...mockSummary,
      colorIndex: 5,
    };

    const { rerender } = render(<CoupleCard summary={mockSummary} />);
    const card = screen.getByTestId('s-card');
    expect(card).toHaveClass('s-card-c1');

    rerender(<CoupleCard summary={updatedSummary} />);
    expect(card).toHaveClass('s-card-c5');
  });

  it('should use correct icon from COUPLE_ICONS array', () => {
    const iconIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const expectedIcons: string[] = [
      '🧳', '🌿', '🗺️', '🌸', '✨',
      '🎒', '🌊', '🏔️', '🎉', '🌙',
    ];

    iconIndices.forEach((idx) => {
      const summary: CoupleSummary = {
        ...mockSummary,
        iconIndex: idx,
      };
      const { unmount } = render(<CoupleCard summary={summary} />);
      expect(screen.getByText(expectedIcons[idx] as string)).toBeInTheDocument();
      unmount();
    });
  });
});
