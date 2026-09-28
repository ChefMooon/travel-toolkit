import { useState, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { findRelatedOlderSlotIndex, useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import Modal from '../Modal';
import Logo from '../Logo';
import SaveDataPanel from '@/components/SaveDataPanel';
import { getDefaultSlotLabel } from '@/store/types';
import Tooltip from '@/components/Tooltip';

export default function Topbar() {
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const theme = useTripStore((s) => s.theme);
  const setTheme = useTripStore((s) => s.setTheme);
  const isDirty = useTripStore((s) => s.isDirty);
  const getSnapshot = useTripStore((s) => s.getSnapshot);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const slots = useSaveSlotStore((s) => s.slots);
  const labels = useSaveSlotStore((s) => s.labels);
  const saveToSlot = useSaveSlotStore((s) => s.saveToSlot);
  const pushToast = useToastStore((s) => s.pushToast);

  const [showReset, setShowReset] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [tripNameFocused, setTripNameFocused] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState(String(globalMarkup));

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const handleMarkupBlur = useCallback(() => {
    const val = parseFloat(markupInput);
    if (!isNaN(val) && val >= 0) {
      setGlobalMarkup(val);
    } else {
      setMarkupInput(String(globalMarkup));
    }
    setEditingMarkup(false);
  }, [markupInput, setGlobalMarkup, globalMarkup]);

  const currentSnapshot = getSnapshot();
  const relatedSlotIndex = findRelatedOlderSlotIndex(slots, currentSnapshot);

  const handleSaveThenReset = useCallback(() => {
    if (relatedSlotIndex < 0) {
      return;
    }

    const ok = saveToSlot(relatedSlotIndex, currentSnapshot);
    if (!ok) {
      return;
    }

    const slotLabel = labels[relatedSlotIndex] ?? getDefaultSlotLabel(relatedSlotIndex);
    pushToast({
      type: 'success',
      title: 'Saved and started new trip',
      message: `Updated ${slotLabel} and cleared the current trip.`,
    });
    resetTrip();
    setShowReset(false);
  }, [currentSnapshot, labels, pushToast, relatedSlotIndex, resetTrip, saveToSlot]);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Go to home page">
          <Logo />
        </a>

        <div className="topbar-center">
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
                className="trip-pill-clear"
                onMouseDown={(e) => { e.preventDefault(); setTripName(''); }}
                tabIndex={-1}
                aria-label="Clear trip name"
              >×</button>
            ) : (
              <span className="trip-pill-edit">✎</span>
            )}
          </div>
        </div>

        <div className="topbar-right">
          <div className="markup-pill" onClick={() => setEditingMarkup(true)}>
            <span>Markup</span>
            {editingMarkup ? (
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
            ) : (
              <span className="markup-num">{globalMarkup}%</span>
            )}
          </div>

          <button className="btn-new-trip" onClick={() => setShowReset(true)}>
            <RotateCcw size={12} /> <span>New Trip</span>
          </button>

          <Tooltip content="Save slots">
            <button
              type="button"
              className="btn-save-panel"
              data-dirty={isDirty ? 'true' : 'false'}
              onClick={() => setShowSavePanel(true)}
              aria-label="Open save slots"
            >
              <img src="/save.svg" alt="" aria-hidden="true" />
            </button>
          </Tooltip>

          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-knob">
              <span>{theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}</span>
            </div>
          </button>
        </div>
      </header>

      {showReset && (
        <Modal
          icon="🗑️"
          title="Start a new trip?"
          body="This will permanently delete all current trip data including couples, costs, and exchange rates. This action cannot be undone."
          secondaryActionLabel={relatedSlotIndex >= 0 ? 'Update Save & Start Fresh' : undefined}
          onSecondaryAction={relatedSlotIndex >= 0 ? handleSaveThenReset : undefined}
          confirmLabel="Delete & Start Fresh"
          onConfirm={() => {
            resetTrip();
            setShowReset(false);
          }}
          onCancel={() => setShowReset(false)}
        />
      )}

      <SaveDataPanel open={showSavePanel} onClose={() => setShowSavePanel(false)} />
    </>
  );
}
