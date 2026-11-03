/// <reference types="vitest" />

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { initialPanelMode, isPickSourceSlot, panelModeReducer, usePanelMode } from './usePanelMode';

describe('usePanelMode', () => {
  it('starts in browse, or in pick for the live trip when opened with mode "pick"', () => {
    expect(initialPanelMode()).toEqual({ type: 'browse' });
    expect(initialPanelMode('pick')).toEqual({ type: 'pick', source: 'live', purpose: 'save' });
  });

  it('switches between browse, pick and move', () => {
    const { result } = renderHook(() => usePanelMode());
    act(() => result.current[1]({ type: 'move', slotIndex: 1 }));
    expect(result.current[0]).toEqual({ type: 'move', slotIndex: 1 });
    act(() => result.current[1]({ type: 'pick', source: { slotIndex: 2, tripId: '222222' }, purpose: 'copy' }));
    expect(result.current[0]).toEqual({ type: 'pick', source: { slotIndex: 2, tripId: '222222' }, purpose: 'copy' });
    act(() => result.current[1]({ type: 'browse' }));
    expect(result.current[0]).toEqual({ type: 'browse' });
  });

  it('keeps the same browse state object when already browsing', () => {
    const browse = { type: 'browse' } as const;
    expect(panelModeReducer(browse, { type: 'browse' })).toBe(browse);
  });

  it('identifies the slot a copy is taken from', () => {
    const mode = panelModeReducer({ type: 'browse' }, { type: 'pick', source: { slotIndex: 1, tripId: '222222' }, purpose: 'copy' });
    expect(isPickSourceSlot(mode, 1)).toBe(true);
    expect(isPickSourceSlot(mode, 0)).toBe(false);
    expect(isPickSourceSlot(initialPanelMode('pick'), 0)).toBe(false);
    expect(isPickSourceSlot({ type: 'move', slotIndex: 1 }, 1)).toBe(false);
  });
});
