/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useTimezoneStore, type TrackedZone } from '@/store/timezoneStore';
import ConfigModal from './ConfigModal';

function makeZone(tz: string, order: number): TrackedZone {
  return {
    id: `zone-${order}`,
    tz,
    label: tz.split('/').pop() ?? tz,
    order,
    displayMode: 'digital',
    detailLevel: 'detailed',
    showUTC: true,
    showDate: true,
    showSeconds: false,
  };
}

describe('ConfigModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimezoneStore.setState({ localTz: 'UTC', trackedZones: [] });
  });

  it('adds a selected timezone immediately and keeps search ready for another', () => {
    render(<ConfigModal onClose={vi.fn()} />);

    const search = screen.getByLabelText('Search timezones');
    fireEvent.change(search, { target: { value: 'Tokyo' } });
    fireEvent.click(screen.getByRole('option', { name: /Asia\/Tokyo/ }));

    expect(useTimezoneStore.getState().trackedZones).toHaveLength(1);
    expect(useTimezoneStore.getState().trackedZones[0]).toMatchObject({
      tz: 'Asia/Tokyo',
      label: 'Tokyo',
      order: 0,
    });
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: 'Europe/Paris' } });
    fireEvent.click(screen.getByRole('option', { name: /Europe\/Paris/ }));
    expect(useTimezoneStore.getState().trackedZones).toHaveLength(2);
  });

  it('marks an already tracked timezone as added and prevents another addition', () => {
    useTimezoneStore.setState({
      localTz: 'UTC',
      trackedZones: [makeZone('Asia/Tokyo', 0)],
    });
    render(<ConfigModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'Tokyo' },
    });
    const result = screen.getByRole('option', { name: /Asia\/Tokyo/ });
    expect(result).toHaveAttribute('aria-disabled', 'true');
    expect(result).toHaveTextContent('Added');

    fireEvent.click(result);

    expect(useTimezoneStore.getState().trackedZones).toHaveLength(1);
  });

  it('assigns a new order after the greatest existing order', () => {
    useTimezoneStore.setState({
      localTz: 'UTC',
      trackedZones: [makeZone('Asia/Tokyo', 0), makeZone('Europe/London', 2)],
    });
    render(<ConfigModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'Europe/Paris' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Europe\/Paris/ }));

    const zones = useTimezoneStore.getState().trackedZones;
    expect(zones[zones.length - 1]).toMatchObject({
      tz: 'Europe/Paris',
      order: 3,
    });
  });

  it('focuses search, traps focus, closes with Escape, and restores focus on unmount', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { unmount } = render(<ConfigModal onClose={onClose} />);
    const search = screen.getByLabelText('Search timezones');
    const dialog = screen.getByRole('dialog', { name: 'Timezone Settings' });
    const closeButton = screen.getByRole('button', { name: 'Close settings' });

    expect(search).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(search).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => unmount());
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('closes only when the backdrop itself is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ConfigModal onClose={onClose} />);
    const backdrop = container.querySelector('.modal-bd');
    const dialog = screen.getByRole('dialog');

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});