import { useState, useRef, useEffect, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import type { Couple } from '@/store/types';
import { Plus, X } from 'lucide-react';
import { COUPLE_ICONS, getColorThemeValue, MAX_GROUPS, MAX_KIDS_PER_GROUP, MAX_GROUP_NAME_LENGTH } from '@/store/types';
import Modal from '../Modal';
import IconChoiceModal from '../IconChoiceModal';
import ColorChoiceModal from '../ColorChoiceModal';
import RegionSelector from '../RegionSelector';

export default function GroupSetup() {
  const couples = useTripStore((s) => s.couples);
  const nonPayingTravellers = useTripStore((s) => s.nonPayingTravellers);
  const theme = useTripStore((s) => s.theme);
  const addCouple = useTripStore((s) => s.addCouple);
  const removeCouple = useTripStore((s) => s.removeCouple);
  const renameCouple = useTripStore((s) => s.renameCouple);
  const reorderCouples = useTripStore((s) => s.reorderCouples);
  const updateCoupleIcon = useTripStore((s) => s.updateCoupleIcon);
  const updateCoupleColor = useTripStore((s) => s.updateCoupleColor);
  const addNonPayingTraveller = useTripStore((s) => s.addNonPayingTraveller);
  const removeNonPayingTraveller = useTripStore((s) => s.removeNonPayingTraveller);

  const [showChildPicker, setShowChildPicker] = useState(false);
  const [removingCouple, setRemovingCouple] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
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

  const handleDragStart = (coupleId: string) => {
    setDraggedId(coupleId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (targetCoupleId: string) => {
    if (!draggedId || draggedId === targetCoupleId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = couples.findIndex((c) => c.id === draggedId);
    const targetIndex = couples.findIndex((c) => c.id === targetCoupleId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...couples];
    const [movedCouple] = newOrder.splice(draggedIndex, 1) as [Couple];
    newOrder.splice(targetIndex, 0, movedCouple);

    reorderCouples(newOrder.map((c) => c.id));
    setDraggedId(null);
  };

  const coupleToRemove = couples.find((c) => c.id === removingCouple);

  return (
    <>
      <RegionSelector />
      <div className="card">
        <div className="card-header">
          <span className="card-title">Travelling Party</span>
          <div className="add-btns">
            <button className="btn-add" onClick={() => addCouple()} disabled={couples.length >= MAX_GROUPS}>
              <Plus size={12} /> Add Group
            </button>
            <div style={{ position: 'relative' }} ref={pickerRef}>
              <button
                className="btn-add"
                onClick={() => setShowChildPicker(!showChildPicker)}
                disabled={couples.length === 0}
              >
                <Plus size={12} /> Add Child
              </button>
              {showChildPicker && couples.length > 0 && (
                <div className="child-picker">
                  <div style={{ padding: '4px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Assign to group:
                  </div>
                  {couples.map((c) => {
                    const kidsCount = nonPayingTravellers.filter((t) => t.coupleId === c.id).length;
                    const atKidLimit = kidsCount >= MAX_KIDS_PER_GROUP;
                    return (
                      <button
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
              )}
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
              {couples.map((couple) => {
                const children = nonPayingTravellers.filter((t) => t.coupleId === couple.id);
                const coupleColor = getColorThemeValue(couple.colorIndex, theme);
                return (
                  <div
                    className="group-group"
                    key={couple.id}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(couple.id)}
                    style={{
                      opacity: draggedId === couple.id ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div className="group-group-row">
                      <div
                        className="chip"
                        style={{
                          background: `color-mix(in srgb, ${coupleColor} 18%, transparent)`,
                          borderColor: `color-mix(in srgb, ${coupleColor} 30%, white)`,
                          color: coupleColor,
                        }}
                      >
                        <span
                          className="chip-grip"
                          draggable
                          onDragStart={() => handleDragStart(couple.id)}
                          onDragEnd={handleDragEnd}
                          title="Drag to reorder group"
                          aria-label={`Drag to reorder ${couple.name}`}
                        >
                          ⠿
                        </span>
                        <div
                          className="icon-interactive"
                          onClick={() => {
                            setSelectedCoupleId(couple.id);
                            setColorModalOpen(false);
                            setIconModalOpen(true);
                          }}
                          style={{ position: 'relative', zIndex: 10 }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Change icon for ${couple.name}`}
                        >
                          <span className="chip-icon">
                            {COUPLE_ICONS[couple.iconIndex]?.symbol}
                          </span>
                        </div>
                        <div
                          className="color-dot-interactive"
                          onClick={() => {
                            setSelectedCoupleId(couple.id);
                            setIconModalOpen(false);
                            setColorModalOpen(true);
                          }}
                          style={{
                            position: 'relative',
                            zIndex: 10,
                            '--group-color': coupleColor
                          } as React.CSSProperties}
                          role="button"
                          tabIndex={0}
                          aria-label={`Change color for ${couple.name}`}
                        >
                          <span
                            className="chip-dot"
                            style={{ backgroundColor: coupleColor }}
                          ></span>
                        </div>
                        <input
                          className="group-name-input"
                          value={couple.name}
                          onChange={(e) => renameCouple(couple.id, e.target.value)}
                          style={{ color: 'inherit' }}
                          maxLength={MAX_GROUP_NAME_LENGTH}
                          aria-label={`Rename ${couple.name}`}
                        />
                        <button
                          className="chip-x"
                          onClick={() => setRemovingCouple(couple.id)}
                          aria-label={`Remove ${couple.name}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    {children.length > 0 && (
                      <div className="group-group-children">
                        <span className="child-connector"></span>
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="chip chip-child"
                            style={{
                              background: `color-mix(in srgb, ${coupleColor} 18%, transparent)`,
                              borderColor: `color-mix(in srgb, ${coupleColor} 30%, white)`,
                              color: coupleColor,
                            }}
                          >
                            👶 {child.label}
                            <button
                              className="chip-x"
                              onClick={() => removeNonPayingTraveller(child.id)}
                              aria-label={`Remove ${child.label}`}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
          compact
        />
      )}
    </>
  );
}
