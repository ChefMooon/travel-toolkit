import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTimezoneStore, type TrackedZone } from '@/store/timezoneStore';
import ZoneConfigRow from './ZoneConfigRow';

const zone: TrackedZone = {
  id: 'zone-1',
  tz: 'America/New_York',
  label: 'Zone 1',
  order: 0,
  displayMode: 'digital',
  detailLevel: 'detailed',
  showUTC: true,
  showDate: true,
  showSeconds: false,
};

describe('ZoneConfigRow', () => {
  beforeEach(() => {
    useTimezoneStore.setState({
      localTz: 'America/New_York',
      trackedZones: [zone],
    });
  });

  it('renders remove button in top-right position without changing button style class', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    const removeButton = screen.getByRole('button', { name: 'Remove timezone' });
    expect(removeButton).toHaveClass('ibtn', 'del');
    expect(removeButton).toHaveStyle({ position: 'absolute', top: '10px', right: '12px' });
  });

  it('removes the zone when the remove button is clicked', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    const removeButton = screen.getByRole('button', { name: 'Remove timezone' });
    fireEvent.click(removeButton);

    expect(useTimezoneStore.getState().trackedZones).toHaveLength(0);
  });
});
