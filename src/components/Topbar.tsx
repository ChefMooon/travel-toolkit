import { useState, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import Modal from './Modal';

export default function Topbar() {
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const theme = useTripStore((s) => s.theme);
  const setTheme = useTripStore((s) => s.setTheme);
  const resetTrip = useTripStore((s) => s.resetTrip);

  const [showReset, setShowReset] = useState(false);
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

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">M</div>
          <span className="brand-wordmark">M<span style={{ color: '#ec4899' }}>K</span><span style={{ color: '#06b6d4' }}>T</span></span>
        </div>

        <div className="topbar-center">
          <div className="trip-pill">
            <input
              className="trip-pill-text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              aria-label="Trip name"
            />
            <span className="trip-pill-edit">✎</span>
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

          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-knob">
              <span>{theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}</span>
            </div>
          </button>

          <button className="btn-new-trip" onClick={() => setShowReset(true)}>
            <RotateCcw size={12} /> <span>New Trip</span>
          </button>
        </div>
      </header>

      {showReset && (
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
      )}
    </>
  );
}
