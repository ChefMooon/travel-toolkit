/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNav from '@/components/MobileNav';

describe('MobileNav', () => {
  it('FE-NAV-001 renders all navigation tabs', () => {
    render(<MobileNav activeTab="party" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Party' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Costs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Summary' })).toBeInTheDocument();
  });

  it('FE-NAV-002 marks the active tab with active class', () => {
    render(<MobileNav activeTab="summary" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Summary' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Party' })).not.toHaveClass('active');
  });

  it('FE-NAV-003 emits onChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<MobileNav activeTab="party" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Costs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }));

    expect(onChange).toHaveBeenNthCalledWith(1, 'costs');
    expect(onChange).toHaveBeenNthCalledWith(2, 'summary');
  });
});