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

  it('renders an accessible remove button and compact settings disclosure', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    const removeButton = screen.getByRole('button', { name: 'Remove Zone 1' });
    expect(removeButton).toHaveClass('ibtn', 'del');
    expect(screen.getByRole('button', { name: 'Show settings for Zone 1' })).toHaveAttribute('aria-expanded', 'false');

    const reorderButton = screen.getByRole('button', { name: 'Reorder Zone 1' });
    expect(reorderButton).not.toHaveAttribute('title');
    fireEvent.focus(reorderButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Reorder Zone 1');
  });

  it('expands settings and updates the zone label', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show settings for Zone 1' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Timezone label for America/New_York' }), {
      target: { value: 'New York' },
    });

    expect(useTimezoneStore.getState().trackedZones[0]?.label).toBe('New York');
  });

  it('updates display mode and visibility controls while expanded', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show settings for Zone 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Analog' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show Date' }));

    expect(useTimezoneStore.getState().trackedZones[0]).toMatchObject({
      displayMode: 'analog',
      showDate: false,
    });
  });

  it('removes the zone when the remove button is clicked', () => {
    render(
      <DndContext>
        <SortableContext items={[zone.id]} strategy={verticalListSortingStrategy}>
          <ZoneConfigRow zone={zone} />
        </SortableContext>
      </DndContext>
    );

    const removeButton = screen.getByRole('button', { name: 'Remove Zone 1' });
    fireEvent.click(removeButton);

    expect(useTimezoneStore.getState().trackedZones).toHaveLength(0);
  });
});
