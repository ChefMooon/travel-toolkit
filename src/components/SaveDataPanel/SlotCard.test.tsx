/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSummary, getTripTotal } from '@/lib/calculations';
import { formatCurrency } from '@/i18n/format';
import { SAVE_SLOT_SCHEMA_VERSION, type SaveSlot } from '@/store/types';
import SlotCard from './SlotCard';
import { flightNumber } from './SlotStub';
import { makeSlot } from './slotDetailsFixtures';
import { clearSlotDetailsCache } from './useSlotDetails';

const slot: SaveSlot = {
  slotIndex: 0,
  schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
  label: 'Autumn',
  tripId: '123456',
  tripName: 'Kyoto in Autumn',
  savedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  coupleCount: 2,
  costCount: 4,
  targetCurrency: 'JPY',
  data: {
    tripId: '123456',
    tripName: 'Kyoto in Autumn',
    globalMarkup: 0,
    couples: [],
    nonPayingTravellers: [],
    costs: [],
    exchangeRates: [],
    region: 'Asia',
    targetCurrency: 'JPY',
    tripStartDate: '2026-10-08',
    tripEndDate: '2026-10-21',
  },
};

function renderCard(props: Partial<React.ComponentProps<typeof SlotCard>> = {}) {
  const handlers = { onMenuToggle: vi.fn(), onRenameTrip: vi.fn(), onRenameSlot: vi.fn() };
  render(
    <ul>
      <SlotCard
        slotIndex={0}
        slot={slot}
        label="Autumn"
        isActiveTrip={false}
        homeCurrency="CAD"
        action={{ label: 'Load', variant: 'load', onClick: vi.fn() }}
        isSource={false}
        inert={false}
        menuHidden={false}
        menuOpen={false}
        menuId="menu"
        menuButtonRef={() => {}}
        tripNameRef={() => {}}
        seatRef={() => {}}
        editHintId="hint"
        drawerOpen={false}
        onDrawerToggle={() => {}}
        {...handlers}
        {...props}
      />
    </ul>
  );
  return { ...handlers, card: within(screen.getByRole('listitem')) };
}

describe('SlotCard', () => {
  it('shows the ticket: kicker, saved time, name, conversion line, dates, party and stub', () => {
    const { card } = renderCard();

    expect(card.getByText('Boarding pass')).toBeInTheDocument();
    expect(card.getByText('Saved 3 hours ago').tagName).toBe('TIME');
    expect(card.getByText('Saved 3 hours ago')).toHaveAttribute('dateTime', slot.savedAt);
    expect(card.getByRole('heading', { name: 'Autumn: Kyoto in Autumn' })).toBeInTheDocument();
    expect(card.getByText('CAD')).toBeInTheDocument();
    expect(card.getByText('JPY')).toBeInTheDocument();
    expect(card.getByText('Oct 8 – 21, 2026')).toBeInTheDocument();
    expect(card.getByText('2 groups')).toBeInTheDocument();
    expect(card.queryByText(/child/)).not.toBeInTheDocument();
    expect(card.getByText('TT-01')).toBeInTheDocument();
    expect(card.getByText('123456')).toBeInTheDocument();
    expect(card.getByRole('button', { name: 'Autumn' })).toBeInTheDocument();
    expect(document.querySelector('.slot-stub-barcode')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the active trip and renders an inactive action that does not fire', () => {
    const onClick = vi.fn();
    const { card } = renderCard({ isActiveTrip: true, action: { label: 'Saved', variant: 'primary', inactive: true, onClick } });

    expect(screen.getByRole('listitem')).toHaveClass('slot-card--active');
    expect(card.getByText('Active trip')).toBeInTheDocument();
    const button = card.getByRole('button', { name: 'Saved' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders an empty slot as a blank ticket with its action', () => {
    const onClick = vi.fn();
    const { card } = renderCard({ slot: null, label: 'Slot 3', slotIndex: 2, action: { label: 'Save current trip here', variant: 'plain', onClick } });

    expect(card.getByText('Blank ticket')).toBeInTheDocument();
    expect(card.getByRole('heading', { name: 'Slot 3: empty' })).toBeInTheDocument();
    expect(card.getByText('—')).toBeInTheDocument();
    expect(card.getByText('TT-03')).toBeInTheDocument();
    fireEvent.click(card.getByRole('button', { name: 'Save current trip here' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exposes the menu button with its label, state and controls only while open', () => {
    const { card, onMenuToggle } = renderCard({ menuOpen: true });
    const trigger = card.getByRole('button', { name: 'More actions for Autumn' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', 'menu');
    fireEvent.click(trigger);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('conceals the menu button while picking or moving', () => {
    const { card, onMenuToggle } = renderCard({ menuHidden: true });
    const trigger = card.getByRole('button', { name: 'More actions for Autumn' });
    expect(trigger).toHaveClass('is-concealed');
    expect(trigger).toHaveAttribute('tabindex', '-1');
    fireEvent.click(trigger);
    expect(onMenuToggle).not.toHaveBeenCalled();
  });

  it('shows the move overlay and makes the ticket inert while moving', () => {
    const onChoose = vi.fn();
    const { card } = renderCard({ action: null, inert: true, overlay: { title: 'Swap here', detail: 'with Autumn', onChoose } });

    expect(document.querySelector('.slot-ticket')).toHaveAttribute('inert');
    fireEvent.click(card.getByRole('button', { name: 'Swap here with Autumn' }));
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('shows a note instead of an action for the copy source', () => {
    const { card } = renderCard({ action: null, note: 'Copying from here', isSource: true });
    expect(card.getByText('Copying from here')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('is-source');
    expect(card.queryByRole('button', { name: 'Load' })).not.toBeInTheDocument();
  });

  it('commits trip and seat renames through the inline editors', () => {
    const { card, onRenameTrip, onRenameSlot } = renderCard();
    fireEvent.click(card.getByRole('button', { name: 'Kyoto in Autumn' }));
    const trip = card.getByRole('textbox', { name: 'Trip name' });
    expect(trip).toHaveAttribute('maxLength', '100');
    fireEvent.change(trip, { target: { value: 'Osaka' } });
    fireEvent.keyDown(trip, { key: 'Enter' });
    expect(onRenameTrip).toHaveBeenCalledWith('Osaka');

    fireEvent.click(card.getByRole('button', { name: 'Autumn' }));
    const seat = card.getByRole('textbox', { name: 'Slot name' });
    expect(seat).toHaveAttribute('maxLength', '30');
    fireEvent.change(seat, { target: { value: 'Fall' } });
    fireEvent.keyDown(seat, { key: 'Enter' });
    expect(onRenameSlot).toHaveBeenCalledWith('Fall');
  });

  it('numbers flights by position with two digits', () => {
    expect(flightNumber(0)).toBe('TT-01');
    expect(flightNumber(9)).toBe('TT-10');
  });
});

describe('SlotCard total and details drawer', () => {
  beforeEach(() => clearSlotDetailsCache());

  const totalCell = () => document.querySelector('.slot-meta-total');
  const props = (slot: SaveSlot | null, extra: Partial<React.ComponentProps<typeof SlotCard>> = {}) => ({
    slotIndex: 0,
    slot,
    label: 'Autumn',
    isActiveTrip: false,
    homeCurrency: 'CAD',
    action: { label: 'Load', variant: 'load' as const, onClick: vi.fn() },
    isSource: false,
    inert: false,
    menuHidden: false,
    menuOpen: false,
    menuId: 'menu',
    menuButtonRef: () => {},
    onMenuToggle: vi.fn(),
    tripNameRef: () => {},
    seatRef: () => {},
    onRenameTrip: vi.fn(),
    onRenameSlot: vi.fn(),
    editHintId: 'hint',
    drawerOpen: false,
    onDrawerToggle: vi.fn(),
    ...extra,
  });
  const renderIn = (slot: SaveSlot | null, extra: Partial<React.ComponentProps<typeof SlotCard>> = {}) =>
    render(<ul><SlotCard {...props(slot, extra)} /></ul>);

  it('shows the same total as the dashboard for the same snapshot, reserving its space until then', async () => {
    const slot = makeSlot();
    const d = slot.data;
    const total = getTripTotal(buildSummary(d.couples, d.costs, d.globalMarkup, d.exchangeRates, d.targetCurrency));
    renderIn(slot);

    expect(totalCell()).toHaveClass('is-pending');
    expect(totalCell()).toHaveAttribute('aria-hidden', 'true');
    const expected = formatCurrency(total as number, 'USD');
    const value = await screen.findByText(expected);
    expect(value.tagName).toBe('DD');
    expect(totalCell()).not.toHaveClass('is-pending');
    expect(within(totalCell() as HTMLElement).getByText('Total')).toBeInTheDocument();
  });

  it.each([
    ['a missing exchange rate', makeSlot({}, { exchangeRates: [] })],
    ['schema version 2', makeSlot({ schemaVersion: 2 })],
    ['corrupt data', (() => { const slot = makeSlot(); (slot.data as unknown as { costs: unknown }).costs = [null]; return slot; })()],
  ])('does not render the total cell for %s', async (_name, slot) => {
    renderIn(slot);
    await waitFor(() => expect(totalCell()).toBeNull());
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  // The component drops the cell entirely once the result is unavailable (the aria-hidden placeholder
  // exists only while pending), so nothing labelled Total, reserved or not, is left in the card.
  it.each([
    ['rates', makeSlot({}, { exchangeRates: [] })],
    ['schema', makeSlot({ schemaVersion: 2 })],
    ['invalid', (() => { const slot = makeSlot(); (slot.data as unknown as { costs: unknown }).costs = [null]; return slot; })()],
  ])('leaves no Total label, value or placeholder once details are unavailable (%s)', async (_reason, slot) => {
    renderIn(slot);
    await waitFor(() => expect(totalCell()).toBeNull());

    const card = within(screen.getByRole('listitem'));
    expect(card.queryByText('Total')).not.toBeInTheDocument();
    expect(document.querySelector('.slot-meta-total')).toBeNull();
    expect(document.querySelector('.slot-meta [aria-hidden="true"]')).toBeNull();
    // The rest of the meta row is still there.
    expect(card.getByText('2 groups')).toBeInTheDocument();
  });

  it('shows the Total label and value for a computable slot (positive control)', async () => {
    const slot = makeSlot();
    const d = slot.data;
    const total = getTripTotal(buildSummary(d.couples, d.costs, d.globalMarkup, d.exchangeRates, d.targetCurrency));
    renderIn(slot);

    expect(await screen.findByText(formatCurrency(total as number, 'USD'))).toBeInTheDocument();
    expect(within(screen.getByRole('listitem')).getByText('Total')).toBeInTheDocument();
    expect(totalCell()).not.toHaveAttribute('aria-hidden');
  });

  it('offers a Details toggle wired to the drawer, and none on an empty slot', () => {
    const onDrawerToggle = vi.fn();
    const { unmount } = renderIn(makeSlot(), { onDrawerToggle });
    const toggle = screen.getByRole('button', { name: 'Details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const drawer = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(drawer).toHaveClass('slot-drawer');
    expect(drawer?.closest('.slot-main')).not.toBeNull();
    fireEvent.click(toggle);
    expect(onDrawerToggle).toHaveBeenCalledWith(true);
    unmount();

    renderIn(null);
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
    expect(document.querySelector('.slot-drawer')).toBeNull();
  });

  it('covers the ticket (inert) while open, and Hide returns focus to the toggle', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <ul><SlotCard {...props(makeSlot(), { drawerOpen: open, onDrawerToggle: setOpen })} /></ul>;
    }
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.slot-main-content')).toHaveAttribute('inert');
    const hide = screen.getByRole('button', { name: 'Hide' });
    expect(hide).toHaveFocus();
    expect(document.querySelector('.slot-drawer')).toHaveClass('is-open');

    fireEvent.click(hide);
    expect(document.querySelector('.slot-main-content')).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Details' })).toHaveFocus();
  });
});
