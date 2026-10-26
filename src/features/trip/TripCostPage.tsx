import App from '@/App';
import TripToolbar from '@/components/TripToolbar';
import { useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';

export default function TripCostPage() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.isComposing || !(event.ctrlKey || event.metaKey)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"], dialog[open]')) return;

      const key = event.key.toLowerCase();
      const undo = key === 'z' && !event.shiftKey;
      const redo = (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      if (!undo && !redo) return;
      event.preventDefault();
      const state = useTripStore.getState();
      if (undo && state.canUndo) state.undo();
      if (redo && state.canRedo) state.redo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <TripToolbar />
      <App />
    </>
  );
}
