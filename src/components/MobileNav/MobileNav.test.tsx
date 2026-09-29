/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNav from '@/components/MobileNav';

describe('MobileNav', () => {
  it('FE-NAV-001 renders named tabs with stable panel relationships and roving focus', () => {
    render(<MobileNav activeTab="party" onChange={vi.fn()} />);

    const partyTab = screen.getByRole('tab', { name: 'Party' });
    const costsTab = screen.getByRole('tab', { name: 'Costs' });
    const summaryTab = screen.getByRole('tab', { name: 'Summary' });

    expect(partyTab).toHaveAttribute('aria-selected', 'true');
    expect(partyTab).toHaveAttribute('aria-controls', 'trip-panel-party');
    expect(partyTab).toHaveAttribute('tabindex', '0');
    expect(costsTab).toHaveAttribute('tabindex', '-1');
    expect(summaryTab).toHaveAttribute('tabindex', '-1');
  });

  it('FE-NAV-002 marks the selected tab with active class and selected state', () => {
    render(<MobileNav activeTab="summary" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveClass('active');
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Party' })).toHaveAttribute('aria-selected', 'false');
  });

  it('FE-NAV-003 emits onChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<MobileNav activeTab="party" onChange={onChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Costs' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Summary' }));

    expect(onChange).toHaveBeenNthCalledWith(1, 'costs');
    expect(onChange).toHaveBeenNthCalledWith(2, 'summary');
  });

  it('moves selection and focus with arrow, Home, and End keys', () => {
    const onChange = vi.fn();
    render(<MobileNav activeTab="costs" onChange={onChange} />);

    const costsTab = screen.getByRole('tab', { name: 'Costs' });
    const partyTab = screen.getByRole('tab', { name: 'Party' });
    const summaryTab = screen.getByRole('tab', { name: 'Summary' });

    costsTab.focus();
    fireEvent.keyDown(costsTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('summary');
    expect(summaryTab).toHaveFocus();

    fireEvent.keyDown(summaryTab, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('summary');
    expect(summaryTab).toHaveFocus();

    fireEvent.keyDown(summaryTab, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('party');
    expect(partyTab).toHaveFocus();

    fireEvent.keyDown(partyTab, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('summary');
    expect(summaryTab).toHaveFocus();
  });
});