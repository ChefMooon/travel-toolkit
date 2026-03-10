import { useState, useRef, useEffect, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { Plus, X } from 'lucide-react';
import Modal from './Modal';

const colorClass = (i: number) => `chip-c${i}`;
const childColorClass = (i: number) => `chip-child-c${i}`;

export default function GroupSetup() {
  const couples = useTripStore((s) => s.couples);
  const nonPayingTravellers = useTripStore((s) => s.nonPayingTravellers);
  const addCouple = useTripStore((s) => s.addCouple);
  const removeCouple = useTripStore((s) => s.removeCouple);
  const renameCouple = useTripStore((s) => s.renameCouple);
  const addNonPayingTraveller = useTripStore((s) => s.addNonPayingTraveller);
  const removeNonPayingTraveller = useTripStore((s) => s.removeNonPayingTraveller);

  const [showChildPicker, setShowChildPicker] = useState(false);
  const [removingCouple, setRemovingCouple] = useState<string | null>(null);
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

  const coupleToRemove = couples.find((c) => c.id === removingCouple);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Travelling Party</span>
          <div className="add-btns">
            <button className="btn-add" onClick={addCouple}>
              <Plus size={12} /> Add Couple
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
                    Assign to couple:
                  </div>
                  {couples.map((c) => (
                    <button
                      key={c.id}
                      className="child-picker-item"
                      onClick={() => handleAddChild(c.id)}
                      style={{ color: `var(--c${c.colorIndex})` }}
                    >
                      ● {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card-body">
          {couples.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">No couples yet</div>
              <div className="empty-state-sub">Add couples to start splitting costs</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {couples.map((couple) => {
                const children = nonPayingTravellers.filter((t) => t.coupleId === couple.id);
                return (
                  <div className="couple-group" key={couple.id}>
                    <div className="couple-group-row">
                      <div className={`chip ${colorClass(couple.colorIndex)}`}>
                        <span className="chip-grip">⠿</span>
                        <span className="chip-dot"></span>
                        <input
                          className="couple-name-input"
                          value={couple.name}
                          onChange={(e) => renameCouple(couple.id, e.target.value)}
                          style={{ color: 'inherit' }}
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
                      <div className="couple-group-children">
                        <span className="child-connector"></span>
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className={`chip chip-child ${childColorClass(couple.colorIndex)}`}
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
