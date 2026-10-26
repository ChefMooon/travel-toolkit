import { useState, useRef, useEffect, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { Plus, X } from 'lucide-react';
import { COUPLE_ICONS, getColorThemeValue, MAX_GROUPS, MAX_KIDS_PER_GROUP, MAX_GROUP_NAME_LENGTH } from '@/store/types';
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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../Modal';
import IconChoiceModal from '../IconChoiceModal';
import ColorChoiceModal from '../ColorChoiceModal';
import RegionSelector from '../RegionSelector';
import Tooltip from '@/components/Tooltip';
import { useResolvedTheme } from '@/store/theme';
import { getGroupPresentation } from '@/lib/groupPresentation';

interface SortableGroupProps {
  couple: { id: string; name: string; iconIndex: number; colorIndex: number };
  children: { id: string; label: string; coupleId: string }[];
  theme: 'light' | 'dark';
  onRename: (id: string, name: string) => void;
  onChangeIcon: (id: string) => void;
  onChangeColor: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveChild: (id: string) => void;
}

function SortableGroup({
  couple,
  children,
  theme,
  onRename,
  onChangeIcon,
  onChangeColor,
  onRemove,
  onRemoveChild,
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: couple.id });
  const groupPresentation = getGroupPresentation(couple.colorIndex, theme);
  const coupleColor = groupPresentation.foreground;

  return (
    <div
      ref={setNodeRef}
      className="group-group"
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="group-group-row">
        <div
          className="chip"
          style={{
            background: groupPresentation.softBackground,
            borderColor: groupPresentation.borderColor,
            color: coupleColor,
          }}
        >
          <Tooltip content="Drag to reorder group">
            <button
              type="button"
              className="chip-grip"
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${couple.name}`}
            >
              ⠿
            </button>
          </Tooltip>
          <Tooltip content="Choose a different group icon">
            <button
              type="button"
              className="icon-interactive"
              onClick={() => onChangeIcon(couple.id)}
              style={{ position: 'relative', zIndex: 10 }}
              aria-label={`Change icon for ${couple.name}`}
            >
              <span className="chip-icon">{COUPLE_ICONS[couple.iconIndex]?.symbol}</span>
            </button>
          </Tooltip>
          <Tooltip content="Change the group's color">
            <button
              type="button"
              className="color-dot-interactive"
              onClick={() => onChangeColor(couple.id)}
              style={{
                position: 'relative',
                zIndex: 10,
                '--group-color': coupleColor,
              } as React.CSSProperties}
              aria-label={`Change color for ${couple.name}`}
            >
              <span className="chip-dot" />
            </button>
          </Tooltip>
          <input
            className="group-name-input"
            value={couple.name}
            onChange={(e) => onRename(couple.id, e.target.value)}
            style={{ color: 'inherit' }}
            maxLength={MAX_GROUP_NAME_LENGTH}
            aria-label={`Rename ${couple.name}`}
          />
          <Tooltip content="Remove this group">
            <button
              type="button"
              className="chip-x"
              onClick={() => onRemove(couple.id)}
              aria-label={`Remove ${couple.name}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>
      {children.length > 0 && (
        <div className="group-group-children">
          <span className="child-connector" />
          {children.map((child) => (
            <div
              key={child.id}
              className="chip chip-child"
              style={{
                background: groupPresentation.softBackground,
                borderColor: groupPresentation.borderColor,
                color: coupleColor,
              }}
            >
              👶 {child.label}
              <Tooltip content="Remove this child from the group">
                <button
                  type="button"
                  className="chip-x"
                  onClick={() => onRemoveChild(child.id)}
                  aria-label={`Remove ${child.label}`}
                >
                  <X size={10} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroupSetup() {
  const couples = useTripStore((s) => s.couples);
  const nonPayingTravellers = useTripStore((s) => s.nonPayingTravellers);
  const theme = useResolvedTheme();
  const addCouple = useTripStore((s) => s.addCouple);
  const removeCouple = useTripStore((s) => s.removeCouple);
  const renameCouple = useTripStore((s) => s.renameCouple);
  const reorderCouples = useTripStore((s) => s.reorderCouples);
  const updateCoupleIcon = useTripStore((s) => s.updateCoupleIcon);
  const updateCoupleColor = useTripStore((s) => s.updateCoupleColor);
  const addNonPayingTraveller = useTripStore((s) => s.addNonPayingTraveller);
  const removeNonPayingTraveller = useTripStore((s) => s.removeNonPayingTraveller);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [showChildPicker, setShowChildPicker] = useState(false);
  const [removingCouple, setRemovingCouple] = useState<string | null>(null);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showChildPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowChildPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showChildPicker]);

  const handleAddChild = useCallback(
    (coupleId: string) => {
      addNonPayingTraveller(coupleId);
      setShowChildPicker(false);
    },
    [addNonPayingTraveller]
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = couples.findIndex((couple) => couple.id === String(active.id));
    const newIndex = couples.findIndex((couple) => couple.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderCouples(arrayMove(couples, oldIndex, newIndex).map((couple) => couple.id));
  };

  const coupleToRemove = couples.find((c) => c.id === removingCouple);

  return (
    <>
      <RegionSelector />
      <div className="card">
        <div className="card-header">
          <h2 id="party-heading" className="card-title">Travelling Party</h2>
          <div className="add-btns">
            <button type="button" className="btn-add" onClick={() => addCouple()} disabled={couples.length >= MAX_GROUPS}>
              <Plus size={12} /> Add Group
            </button>
            <div style={{ position: 'relative' }} ref={pickerRef}>
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowChildPicker(!showChildPicker)}
                disabled={couples.length === 0}
                aria-expanded={showChildPicker && couples.length > 0}
                aria-controls="group-child-picker"
              >
                <Plus size={12} /> Add Child
              </button>
              <div
                id="group-child-picker"
                className="child-picker"
                role="group"
                aria-label="Assign child to group"
                hidden={!showChildPicker || couples.length === 0}
              >
                  <div style={{ padding: '4px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Assign to group:
                  </div>
                  {couples.map((c) => {
                    const kidsCount = nonPayingTravellers.filter((t) => t.coupleId === c.id).length;
                    const atKidLimit = kidsCount >= MAX_KIDS_PER_GROUP;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className="child-picker-item"
                        onClick={() => handleAddChild(c.id)}
                        disabled={atKidLimit}
                        style={{ color: atKidLimit ? 'var(--text-3)' : getColorThemeValue(c.colorIndex, theme) }}
                      >
                        ● {c.name}{atKidLimit ? ' (max)' : ''}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {couples.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">No groups yet</div>
              <div className="empty-state-sub">Add groups to start splitting costs</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={couples.map((couple) => couple.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {couples.map((couple) => (
                    <SortableGroup
                      key={couple.id}
                      couple={couple}
                      children={nonPayingTravellers.filter((child) => child.coupleId === couple.id)}
                      theme={theme}
                      onRename={renameCouple}
                      onChangeIcon={(id) => {
                        setSelectedCoupleId(id);
                        setColorModalOpen(false);
                        setIconModalOpen(true);
                      }}
                      onChangeColor={(id) => {
                        setSelectedCoupleId(id);
                        setIconModalOpen(false);
                        setColorModalOpen(true);
                      }}
                      onRemove={setRemovingCouple}
                      onRemoveChild={removeNonPayingTraveller}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      {iconModalOpen && selectedCoupleId && (
        <IconChoiceModal
          iconIndex={couples.find((c) => c.id === selectedCoupleId)?.iconIndex || 0}
          onConfirm={(iconIndex) => {
            updateCoupleIcon(selectedCoupleId, iconIndex);
            setIconModalOpen(false);
            setSelectedCoupleId(null);
          }}
          onCancel={() => {
            setIconModalOpen(false);
            setSelectedCoupleId(null);
          }}
        />
      )}

      {colorModalOpen && selectedCoupleId && (
        <ColorChoiceModal
          colorIndex={couples.find((c) => c.id === selectedCoupleId)?.colorIndex || 1}
          onConfirm={(colorIndex) => {
            updateCoupleColor(selectedCoupleId, colorIndex);
            setColorModalOpen(false);
            setSelectedCoupleId(null);
          }}
          onCancel={() => {
            setColorModalOpen(false);
            setSelectedCoupleId(null);
          }}
        />
      )}

      {removingCouple && coupleToRemove && (
        <Modal
          icon="👋"
          title={`Remove ${coupleToRemove.name}?`}
          body={`This will remove ${coupleToRemove.name} and their children from the trip. Costs assigned to them will be unassigned.`}
          confirmLabel="Remove"
          onConfirm={() => {
            removeCouple(removingCouple);
            setRemovingCouple(null);
          }}
          onCancel={() => setRemovingCouple(null)}
        />
      )}
    </>
  );
}
