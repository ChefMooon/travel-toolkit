/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GridPanel from '@/components/GridPanel';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

describe('GridPanel', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders nothing when closed', () => {
    const triggerRef = { current: document.createElement('button') };
    const { container } = render(<GridPanel open={false} onClose={vi.fn()} triggerRef={triggerRef} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders tool entries when open', () => {
    const triggerRef = { current: document.createElement('button') };
    render(<GridPanel open={true} onClose={vi.fn()} triggerRef={triggerRef} />);

    expect(screen.getByRole('dialog', { name: 'Tool navigation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close tool navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trip Cost' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Currency Converter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Timezone Converter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Destination Forecast' })).toBeInTheDocument();
  });

  it('navigates and closes when selecting a tool', () => {
    const onClose = vi.fn();
    const triggerRef = { current: document.createElement('button') };
    render(<GridPanel open={true} onClose={onClose} triggerRef={triggerRef} />);

    fireEvent.click(screen.getByRole('button', { name: 'Trip Cost' }));

    expect(navigateMock).toHaveBeenCalledWith({ to: '/trip' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
