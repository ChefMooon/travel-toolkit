import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, fireEvent, waitFor, screen } from '@testing-library/react';
import { useTripStore } from '../../store/tripStore';
import CoupleCard from './CoupleCard';
import { COUPLE_ICONS, type CoupleSummary } from '../../store/types';
import { useSettingsStore } from '../../store/settingsStore';

// Mock the modals
vi.mock('../IconChoiceModal', () => ({
  default: ({ onConfirm, onCancel }: any) => (
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

vi.mock('../ColorChoiceModal', () => ({
  default: ({ onConfirm, onCancel }: any) => (
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
        targetEquivalent: 175,
      },
    ],
    grandTotal: 175,
    targetCurrency: 'USD',
  };

  beforeEach(() => {
    // Reset store before each test
    const store = useTripStore.getState();
    store.resetTrip();
    store.addCouple();
    const couple = useTripStore.getState().couples[0];
    if (couple) {
      mockSummary.coupleId = couple.id;
      useTripStore.getState().updateCoupleIcon(couple.id, 0);
      useTripStore.getState().updateCoupleColor(couple.id, 1);
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

  it('exposes named keyboard-operable icon and color buttons with tooltips', () => {
    render(<CoupleCard summary={mockSummary} />);

    const iconButton = screen.getByRole('button', { name: 'Change icon for Test Couple' });
    const colorButton = screen.getByRole('button', { name: 'Change color for Test Couple' });
    expect(iconButton).toHaveAttribute('type', 'button');
    expect(colorButton).toHaveAttribute('type', 'button');

    fireEvent.focus(iconButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Choose a different group icon');
    fireEvent.blur(iconButton);
    fireEvent.focus(colorButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent("Change the group's color");
  });

  it('should confirm icon selection and update store', async () => {
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-icon-6'));
    
    await waitFor(() => {
      const couple = useTripStore.getState().couples.find(c => c.id === mockSummary.coupleId);
      expect(couple?.iconIndex).toBe(5);
    });
  });

  it('should confirm color selection and update store', async () => {
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('color-dot'));
    await waitFor(() => {
      expect(screen.getByTestId('color-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-color-3'));
    
    await waitFor(() => {
      const couple = useTripStore.getState().couples.find(c => c.id === mockSummary.coupleId);
      expect(couple?.colorIndex).toBe(3);
    });
  });

  it('should cancel icon modal without updating store', async () => {
    const initialIconIndex = useTripStore.getState().couples[0]?.iconIndex;
    
    render(<CoupleCard summary={mockSummary} />);
    
    fireEvent.click(screen.getByTestId('s-head-icon'));
    await waitFor(() => {
      expect(screen.getByTestId('icon-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-icon'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('icon-modal')).not.toBeInTheDocument();
    });

    const couple = useTripStore.getState().couples[0];
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
    useSettingsStore.setState({ themePreference: 'light' });
    
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    
    // Color dot should carry the resolved group color variable
    expect(colorDot.getAttribute('style')).toContain('--group-color');
  });

  it('should display color dot with correct styling attributes', () => {
    render(<CoupleCard summary={mockSummary} />);
    const colorDot = screen.getByTestId('color-dot');
    
    expect(colorDot.tagName).toBe('BUTTON');
    expect(colorDot).toHaveAttribute('type', 'button');
    expect(colorDot).toHaveAttribute('aria-label', 'Change color for Test Couple');
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
    expect(screen.getAllByText('$175.00').length).toBeGreaterThan(0);
  });

  it('should display the derived group share beside the grand total', () => {
    render(<CoupleCard summary={mockSummary} share={0.3333} />);

    expect(screen.getByTestId('group-share')).toHaveTextContent('33.3%');
    expect(screen.getByTestId('s-card').querySelector('.s-grand-num')).toHaveTextContent('$175.00');
  });

  it('should display a zero share for a zero-total group', () => {
    render(<CoupleCard summary={{ ...mockSummary, grandTotal: 0 }} share={0} />);

    expect(screen.getByTestId('group-share')).toHaveTextContent('0%');
    expect(screen.getByTestId('s-card').querySelector('.s-grand-num')).toHaveTextContent('$0.00');
  });

  it('should omit an unavailable share and preserve the grand-total dash', () => {
    render(<CoupleCard summary={{ ...mockSummary, grandTotal: null }} />);

    expect(screen.queryByTestId('group-share')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
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
    const expectedIcons = COUPLE_ICONS.map((icon) => icon.symbol);

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

  describe('rate row states', () => {
    const eurSummary: CoupleSummary = {
      coupleId: 'couple-1',
      coupleName: 'Test Couple',
      colorIndex: 1,
      iconIndex: 0,
      currencies: [
        {
          currency: 'EUR',
          shared: 100,
          subset: 0,
          individual: 0,
          subtotal: 100,
          targetEquivalent: 110,
        },
      ],
      grandTotal: 110,
      targetCurrency: 'USD',
    };

    beforeEach(() => {
      useTripStore.getState().resetTrip();
      useTripStore.getState().addCouple();
      const couple = useTripStore.getState().couples[0];
      if (couple) {
        eurSummary.coupleId = couple.id;
      }
    });

    it('no-rate state: shows dash and edit affordance when no rate exists', () => {
      render(<CoupleCard summary={eurSummary} />);
      expect(screen.getByText('1 EUR = — USD')).toBeInTheDocument();
      expect(screen.getByLabelText('Add rate for EUR')).toBeInTheDocument();
      fireEvent.focus(screen.getByLabelText('Add rate for EUR'));
      expect(screen.getByRole('tooltip')).toHaveTextContent('Add an exchange rate');
    });

    it('auto-state: shows read-only rate text and pencil when rate exists and not overridden', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      render(<CoupleCard summary={eurSummary} />);
      expect(screen.getByText(/1 EUR = .* USD/)).toBeInTheDocument();
      expect(screen.getByLabelText('Edit rate for EUR')).toBeInTheDocument();
    });

    it('override-state: shows input and lock icon when isOverridden is true', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      render(<CoupleCard summary={eurSummary} />);
      expect(screen.getByLabelText('rate overridden')).toBeInTheDocument();
      expect(screen.getByText('Reset to live')).toBeInTheDocument();
      expect(screen.getByLabelText('Exchange rate for EUR in US dollars')).toHaveValue(1.5);
    });

    it('override-state: Reset to live calls clearExchangeRateOverride', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      render(<CoupleCard summary={eurSummary} />);
      fireEvent.click(screen.getByText('Reset to live'));
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate?.isOverridden).toBe(false);
    });

    it('clicking pencil in auto-state activates inline number input', async () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      render(<CoupleCard summary={eurSummary} />);
      fireEvent.click(screen.getByLabelText('Edit rate for EUR'));
      await waitFor(() => {
        expect(screen.getByLabelText('Exchange rate for EUR in US dollars')).toBeInTheDocument();
      });
    });

    it('inline input blur calls setExchangeRate and marks rate as overridden', async () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      render(<CoupleCard summary={eurSummary} />);
      fireEvent.click(screen.getByLabelText('Edit rate for EUR'));
      await waitFor(() => expect(screen.getByLabelText('Exchange rate for EUR in US dollars')).toBeInTheDocument());
      const input = screen.getByLabelText('Exchange rate for EUR in US dollars');
      fireEvent.change(input, { target: { value: '1.25' } });
      act(() => input.focus());
      const outside = document.createElement('button');
      document.body.append(outside);
      act(() => outside.focus());
      outside.remove();
      await waitFor(() => {
        const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
        expect(rate?.rateToUSD).toBe(1.25);
        expect(rate?.isOverridden).toBe(true);
      });
    });

    it('keeps rate editing active while tabbing to and activating its step button', async () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      render(<CoupleCard summary={eurSummary} />);
      fireEvent.click(screen.getByLabelText('Edit rate for EUR'));
      const input = await screen.findByLabelText('Exchange rate for EUR in US dollars');
      const increase = screen.getByRole('button', { name: 'Increase Exchange rate for EUR in US dollars' });
      const originalRate = useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD;
      fireEvent.change(input, { target: { value: '1.2500' } });
      act(() => input.focus());
      act(() => increase.focus());
      expect(input).toBeInTheDocument();
      expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD).toBe(originalRate);
      act(() => increase.focus());
      fireEvent.keyDown(increase, { key: 'ArrowUp' });
      fireEvent.click(increase);
      expect(input).toHaveValue(1.2501);
      expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD).toBe(originalRate);
      const outside = document.createElement('button');
      document.body.append(outside);
      act(() => outside.focus());
      outside.remove();
      await waitFor(() => {
        expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD).toBe(1.2501);
      });
    });

    it('implied rate row renders when target is non-USD and cost currency is USD', () => {
      const usdWithNonUsdTarget: CoupleSummary = {
        ...mockSummary,
        targetCurrency: 'EUR',
        grandTotal: 159.09,
      };
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      render(<CoupleCard summary={usdWithNonUsdTarget} />);
      expect(screen.getByTestId('implied-rate-USD')).toBeInTheDocument();
    });

    it('grand total sub-label shows target currency symbol when target is not USD', () => {
      const eurTarget: CoupleSummary = {
        ...mockSummary,
        targetCurrency: 'EUR',
        grandTotal: 159.09,
      };
      render(<CoupleCard summary={eurTarget} />);
      expect(screen.getByText('(€)')).toBeInTheDocument();
    });
  });
});
