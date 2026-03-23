import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTimezoneStore } from '@/store/timezoneStore';
import ZoneConfigRow from './ZoneConfigRow';

export default function ZoneList() {
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const reorderZones = useTimezoneStore((state) => state.reorderZones);

  const orderedZones = useMemo(
    () => [...trackedZones].sort((a, b) => a.order - b.order),
    [trackedZones]
  );
  const zoneIds = useMemo(() => orderedZones.map((zone) => zone.id), [orderedZones]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = zoneIds.indexOf(String(active.id));
      const newIndex = zoneIds.indexOf(String(over.id));
      const newOrder = [...zoneIds];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, String(active.id));
      reorderZones(newOrder);
    }
  };

  if (orderedZones.length === 0) {
    return <p className="tool-status">No zones added yet.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={zoneIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orderedZones.map((zone) => (
            <ZoneConfigRow key={zone.id} zone={zone} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
