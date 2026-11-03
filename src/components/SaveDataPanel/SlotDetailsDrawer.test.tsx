/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SlotDetailsDrawer from './SlotDetailsDrawer';
import { computeSlotDetails, isUnavailable } from './slotDetails';
import { makeSlot } from './slotDetailsFixtures';
import type { SlotDetailsView } from './useSlotDetails';

function readyView(slot = makeSlot()): SlotDetailsView {
  const result = computeSlotDetails(slot);
  if (isUnavailable(result)) return { state: 'unavailable', details: null, unavailable: result.unavailable, fade: false, busy: false };
  return { state: 'ready', details: result, unavailable: null, fade: false, busy: false };
}

function renderDrawer(view: SlotDetailsView, slot = makeSlot(), props: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  render(<SlotDetailsDrawer slot={slot} view={view} open={props.open ?? true} id="drawer" onClose={onClose} />);
  return { onClose, drawer: within(screen.getByRole('region', { name: 'Trip details' })) };
}

describe('SlotDetailsDrawer', () => {
  it('shows the costs tab: large total, bar with an aria-label, legend, entries, rates and markup', () => {
    const slot = makeSlot();
    const view = readyView(slot);
    const { drawer } = renderDrawer(view, slot);

    expect(drawer.getByText('Total · USD')).toBeInTheDocument();
    expect(drawer.getByText(/^\$/, { selector: '.dr-big' })).toBeInTheDocument();
    const bar = drawer.getByRole('img');
    expect(bar).toHaveAttribute('aria-label', expect.stringMatching(/^Split by cost type: Accommodation \d+%, .*Other \d+%/));
    expect(bar.querySelectorAll('i')).toHaveLength(3);
    expect(bar.querySelector('i')).toHaveStyle('--c: #5B8DD9');
    const legend = drawer.getAllByRole('listitem').filter((item) => item.querySelector('.dr-swatch'));
    expect(legend).toHaveLength(3);
    expect(drawer.getByText('3 entries')).toBeInTheDocument();
    expect(drawer.getByText('1 cached · 1 overridden')).toBeInTheDocument();
    expect(drawer.getByText('10% global')).toBeInTheDocument();
  });

  it('shows groups with their saved colours, icons, totals and children, and a footer line', () => {
    const { drawer } = renderDrawer(readyView());
    fireEvent.click(drawer.getByRole('tab', { name: 'Group' }));
    const panel = within(drawer.getByRole('tabpanel', { name: 'Group' }));
    expect(panel.getByText('Rivera family').closest('.dr-chip')).toHaveStyle('--g: #C4737A');
    expect(panel.getByText('Okafor pair')).toBeInTheDocument();
    expect(panel.getAllByText(/^\$/)).toHaveLength(2);
    expect(panel.getByText('1 child', { selector: '.dr-people' })).toBeInTheDocument();
    expect(panel.getByText('2 groups · 1 child', { selector: '.dr-foot' })).toBeInTheDocument();
  });

  it('shows the trip facts', () => {
    const { drawer } = renderDrawer(readyView());
    fireEvent.click(drawer.getByRole('tab', { name: 'Trip' }));
    const panel = within(drawer.getByRole('tabpanel', { name: 'Trip' }));
    expect(panel.getByText('Oct 8 – 21, 2026 · 13 nights')).toBeInTheDocument();
    expect(panel.getByText('Asia')).toBeInTheDocument();
    expect(panel.getByText('123456')).toHaveClass('dr-mono');
    expect(panel.getByText('Version 1')).toBeInTheDocument();
    expect(panel.getByText(/Nov 3, 2026/)).toBeInTheDocument();
    expect(panel.getByText('Local · this device')).toBeInTheDocument();
  });

  it.each([
    ['rates', { exchangeRates: [] }, {}, 'An exchange rate is missing for one of the currencies used.'],
    ['schema', {}, { schemaVersion: 2 }, 'This slot uses a different save format.'],
    ['invalid', { costs: [null as never] }, {}, 'This slot’s data could not be read.'],
  ])('shows "Total unavailable" and no numbers when %s', (_reason, data, overrides, reasonText) => {
    const slot = makeSlot(overrides, data);
    const { drawer } = renderDrawer(readyView(slot), slot);
    for (const name of ['Costs', 'Group']) {
      fireEvent.click(drawer.getByRole('tab', { name }));
      const panel = within(drawer.getByRole('tabpanel', { name }));
      expect(panel.getByText('Total unavailable')).toBeInTheDocument();
      expect(panel.getByText(reasonText)).toBeInTheDocument();
      expect(panel.queryByText(/[$€¥]|\d+%/)).not.toBeInTheDocument();
      expect(panel.queryByRole('img')).not.toBeInTheDocument();
    }
  });

  it('has tabs with roving tabindex and ARIA relationships', () => {
    const { drawer } = renderDrawer(readyView());
    const tabs = drawer.getAllByRole('tab');
    expect(drawer.getByRole('tablist')).toBeInTheDocument();
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Costs', 'Group', 'Trip']);
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    for (const tab of tabs) {
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    }
    expect(drawer.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('moves between tabs with Arrow, Home and End keys, wrapping at the ends', () => {
    const { drawer } = renderDrawer(readyView());
    const [costs, group, trip] = drawer.getAllByRole('tab') as [HTMLElement, HTMLElement, HTMLElement];
    costs.focus();
    fireEvent.keyDown(costs, { key: 'ArrowRight' });
    expect(group).toHaveFocus();
    expect(group).toHaveAttribute('aria-selected', 'true');
    expect(group).toHaveAttribute('tabindex', '0');
    expect(costs).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(group, { key: 'End' });
    expect(trip).toHaveFocus();
    fireEvent.keyDown(trip, { key: 'ArrowRight' });
    expect(costs).toHaveFocus();
    fireEvent.keyDown(costs, { key: 'ArrowLeft' });
    expect(trip).toHaveFocus();
    fireEvent.keyDown(trip, { key: 'Home' });
    expect(costs).toHaveFocus();
    expect(drawer.getByRole('tabpanel', { name: 'Costs' })).toBeInTheDocument();
  });

  it('moves focus to Hide when opened, and Hide and Escape both close it', () => {
    const { drawer, onClose } = renderDrawer(readyView());
    expect(drawer.getByRole('button', { name: 'Hide' })).toHaveFocus();
    fireEvent.click(drawer.getByRole('button', { name: 'Hide' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    const stop = vi.spyOn(event, 'stopPropagation');
    drawer.getByRole('tab', { name: 'Costs' }).dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(event.defaultPrevented).toBe(true);
    expect(stop).toHaveBeenCalled();
  });

  it('is inert and holds no controls while closed', () => {
    render(<SlotDetailsDrawer slot={makeSlot()} view={readyView()} open={false} id="drawer" onClose={vi.fn()} />);
    const drawer = document.getElementById('drawer');
    expect(drawer).toHaveClass('slot-drawer');
    expect(drawer).not.toHaveClass('is-open');
    expect(drawer).toHaveAttribute('inert');
    expect(drawer?.querySelectorAll('button, [tabindex]')).toHaveLength(0);
  });

  it('marks panels busy and shows the skeleton region while loading', () => {
    renderDrawer({ state: 'skeleton', details: null, unavailable: null, fade: true, busy: true });
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-busy', 'true');
    const body = document.querySelector('.slot-drawer-body');
    expect(body).toHaveAttribute('data-state', 'skeleton');
    expect(body).toHaveAttribute('data-fade');
    expect(document.querySelector('.slot-drawer-skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the card size fixed by structure: drawer positioned over the card, panels scroll themselves', async () => {
    renderDrawer(readyView());
    expect(document.querySelector('.slot-drawer-panel')).toBeInTheDocument();
    // The app tsconfig has no node types, and vitest does not expose CSS through ?raw.
    const nodeFs = 'node:fs';
    const { readFileSync } = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync: (path: string, encoding: string) => string };
    const css = readFileSync('src/index.css', 'utf8').split('\r\n').join('\n');
    const rule = (selector: string) => {
      const start = css.indexOf(`\n${selector} {`);
      expect(start).toBeGreaterThan(-1);
      return css.slice(start, css.indexOf('}', start));
    };
    expect(rule('.slot-drawer')).toMatch(/position: absolute;\s+inset: 0;/);
    expect(rule('.slot-drawer')).toMatch(/visibility: hidden/);
    expect(rule('.slot-drawer-panel')).toMatch(/height: 100%;\s+overflow: auto;/);
    expect(rule('.slot-main')).toMatch(/overflow: hidden/);
    expect(rule('.slot-ticket')).toMatch(/height: 240px/);
    // Motion only inside a no-preference block.
    const motionStart = css.indexOf('@media (prefers-reduced-motion: no-preference) {\n  .slot-overlay');
    expect(css.indexOf('.slot-drawer { transition', motionStart)).toBeGreaterThan(motionStart);
    expect(css.slice(0, motionStart)).not.toMatch(/\.slot-drawer[^{]*\{[^}]*transition/);
  });
});
