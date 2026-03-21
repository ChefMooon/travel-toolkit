import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTripStore } from '@/store/tripStore';
import Modal from '@/components/Modal';

export default function TripToolbar() {
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const resetTrip = useTripStore((s) => s.resetTrip);

  const [showReset, setShowReset] = useState(false);
  const [tripNameFocused, setTripNameFocused] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState(String(globalMarkup));

  useEffect(() => {
    if (editingMarkup) return;
    setMarkupInput(String(globalMarkup));
  }, [globalMarkup, editingMarkup]);

  const handleMarkupBlur = useCallback(() => {
    const val = parseFloat(markupInput);
    if (!Number.isNaN(val) && val >= 0) {
      setGlobalMarkup(val);
    } else {
      setMarkupInput(String(globalMarkup));
    }
    setEditingMarkup(false);
  }, [markupInput, setGlobalMarkup, globalMarkup]);

  return (
    <>
      <header className="trip-toolbar">
        <div className="trip-toolbar-center">
          <div className="trip-pill">
            <input
              className="trip-pill-text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onFocus={() => setTripNameFocused(true)}
              onBlur={() => setTripNameFocused(false)}
              aria-label="Trip name"
            />
            {tripNameFocused && tripName ? (
              <button
                type="button"
                className="trip-pill-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTripName('');
                }}
                aria-label="Clear trip name"
              >
                ×
              </button>
            ) : (
              <span className="trip-pill-edit">✎</span>
            )}
          </div>
        </div>

        <div className="trip-toolbar-right">
          {editingMarkup ? (
            <div className="markup-pill" role="group" aria-label="Markup editor">
              <span>Markup</span>
              <input
                className="markup-num"
                type="number"
                step="0.1"
                min="0"
                value={markupInput}
                onChange={(e) => setMarkupInput(e.target.value)}
                onBlur={handleMarkupBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleMarkupBlur()}
                autoFocus
                aria-label="Global markup percentage"
              />
            </div>
          ) : (
            <button type="button" className="markup-pill" onClick={() => setEditingMarkup(true)}>
              <span>Markup</span>
              <span className="markup-num">{globalMarkup}%</span>
            </button>
          )}

          <button type="button" className="btn-new-trip" onClick={() => setShowReset(true)}>
            <RotateCcw size={12} /> <span>New Trip</span>
          </button>
        </div>
      </header>

      {showReset ? (
        <Modal
          icon="🗑️"
          title="Start a new trip?"
          body="This will permanently delete all current trip data including couples, costs, and exchange rates. This action cannot be undone."
          confirmLabel="Delete & Start Fresh"
          onConfirm={() => {
            resetTrip();
            setShowReset(false);
          }}
          onCancel={() => setShowReset(false)}
        />
      ) : null}
    </>
  );
}
