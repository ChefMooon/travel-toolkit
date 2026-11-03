import { useReducer } from 'react';

/** A slot source records the trip it held when picking began, so a changed slot is never copied. */
export type PickSource = 'live' | { slotIndex: number; tripId: string };
export type PickPurpose = 'save' | 'copy';

export type PanelMode =
  | { type: 'browse' }
  | { type: 'pick'; source: PickSource; purpose: PickPurpose }
  | { type: 'move'; slotIndex: number };

export type PanelModeAction =
  | { type: 'browse' }
  | { type: 'pick'; source: PickSource; purpose: PickPurpose }
  | { type: 'move'; slotIndex: number };

export function initialPanelMode(mode: 'browse' | 'pick' = 'browse'): PanelMode {
  return mode === 'pick' ? { type: 'pick', source: 'live', purpose: 'save' } : { type: 'browse' };
}

export function panelModeReducer(state: PanelMode, action: PanelModeAction): PanelMode {
  switch (action.type) {
    case 'browse':
      return state.type === 'browse' ? state : { type: 'browse' };
    case 'pick':
      return { type: 'pick', source: action.source, purpose: action.purpose };
    case 'move':
      return { type: 'move', slotIndex: action.slotIndex };
  }
}

export function isPickSourceSlot(mode: PanelMode, slotIndex: number): boolean {
  return mode.type === 'pick' && mode.source !== 'live' && mode.source.slotIndex === slotIndex;
}

/**
 * Browse / pick-a-slot / move state for one opening of the panel. The panel body is re-keyed per
 * opening, so this starts fresh each time (from the `mode` prop).
 */
export function usePanelMode(mode: 'browse' | 'pick' = 'browse') {
  return useReducer(panelModeReducer, mode, initialPanelMode);
}
