import { useEffect, useId, useRef, type Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FlightLine from '@/components/FlightLine';
import { MAX_TRIP_NAME_LENGTH, type SaveSlot } from '@/store/types';
import InlineEditableText, { type InlineEditableTextHandle } from './InlineEditableText';
import SlotDetailsDrawer from './SlotDetailsDrawer';
import SlotStub from './SlotStub';
import { formatRelativeTime, formatSlotMoney, formatTripDates } from './slotFormat';
import { useSlotDetails } from './useSlotDetails';

export interface SlotCardAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'load' | 'plain';
  /** Looks disabled but stays focusable, e.g. "Saved" when there is nothing new to save. */
  inactive?: boolean;
}

export interface SlotCardOverlay {
  title: string;
  detail: string;
  onChoose: () => void;
}

interface SlotCardProps {
  slotIndex: number;
  slot: SaveSlot | null;
  label: string;
  /** The slot holds the live trip (same trip ID). */
  isActiveTrip: boolean;
  homeCurrency: string;
  /** The card's single action (Save / Load / Save here / Overwrite… …); none while it is a pick source. */
  action: SlotCardAction | null;
  /** Shown instead of an action, e.g. "Copying from here". */
  note?: string;
  /** Move mode: the swap/move target covering the card. */
  overlay?: SlotCardOverlay | null;
  /** Highlights the card being moved or copied from. */
  isSource: boolean;
  inert: boolean;
  /** Picking or moving: the "..." menu is concealed. */
  menuHidden: boolean;
  menuOpen: boolean;
  menuId: string;
  menuButtonRef: Ref<HTMLButtonElement>;
  onMenuToggle: () => void;
  tripNameRef: Ref<InlineEditableTextHandle>;
  seatRef: Ref<InlineEditableTextHandle>;
  onRenameTrip: (name: string) => void;
  onRenameSlot: (label: string) => void;
  editHintId: string;
  /** The in-card details drawer is open (the panel keeps at most one open). */
  drawerOpen: boolean;
  onDrawerToggle: (open: boolean) => void;
}

// Locked slots (future paid/cloud tier) are not rendered yet: every slot is available. A locked card
// would reuse this ticket shape with a lock kicker, a dimmed body and stub (cloud chip), no "..." menu,
// never a move/pick target, and an "Upgrade for more slots" button in the action row as the upgrade
// CTA hook. The all-slots-full pick message (PanelModeBanner) would link to the same CTA.
export default function SlotCard({
  slotIndex,
  slot,
  label,
  isActiveTrip,
  homeCurrency,
  action,
  note,
  overlay,
  isSource,
  inert,
  menuHidden,
  menuOpen,
  menuId,
  menuButtonRef,
  onMenuToggle,
  tripNameRef,
  seatRef,
  onRenameTrip,
  onRenameSlot,
  editHintId,
  drawerOpen,
  onDrawerToggle,
}: SlotCardProps) {
  const { t } = useTranslation();
  const drawerId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef(false);
  // Totals are calculated for every filled card (cached, off the render path), never stored.
  const details = useSlotDetails(slot, true);
  const dates = slot ? formatTripDates(slot.data.tripStartDate, slot.data.tripEndDate) : null;
  const childCount = slot?.data.nonPayingTravellers.length ?? 0;

  // Closing from inside the drawer hands focus back to the toggle once the card behind is no longer inert.
  useEffect(() => {
    if (drawerOpen || !returnFocusRef.current) return;
    returnFocusRef.current = false;
    toggleRef.current?.focus();
  }, [drawerOpen]);
  const closeDrawer = () => {
    returnFocusRef.current = true;
    onDrawerToggle(false);
  };

  const actionButton = action ? (
    <button
      type="button"
      className={`slot-action slot-action--${action.variant}`}
      aria-disabled={action.inactive || undefined}
      onClick={action.inactive ? undefined : action.onClick}
    >
      {action.label}
    </button>
  ) : null;

  const classes = ['slot-card'];
  if (!slot) classes.push('slot-card--empty');
  if (isActiveTrip) classes.push('slot-card--active');
  if (isSource) classes.push('is-source');

  return (
    <li className={classes.join(' ')} data-slot-index={slotIndex}>
      {/* While moving, the tickets are inert: only the swap/move targets (and Cancel) are reachable. */}
      <div className="slot-ticket" inert={inert ? true : undefined}>
        <div className="slot-main">
          {slot ? (
            <>
              {/* display: contents; inert while the drawer covers it so nothing behind is reachable. */}
              <div className="slot-main-content" inert={drawerOpen ? true : undefined}>
              <div className="slot-main-kicker">
                <span className="slot-kicker">{isActiveTrip ? t('activeTripKicker') : t('boardingPass')}</span>
                <time dateTime={slot.savedAt}>{t('savedAgo', { time: formatRelativeTime(slot.savedAt) })}</time>
              </div>
              <h3 className="slot-headline">
                <span className="sr-only">{t('slotHeadingPrefix', { label })}</span>
                <InlineEditableText
                  ref={tripNameRef}
                  value={slot.tripName}
                  placeholder={t('untitledTrip')}
                  onCommit={onRenameTrip}
                  maxLength={MAX_TRIP_NAME_LENGTH}
                  aria-label={t('tripName')}
                  aria-describedby={editHintId}
                />
              </h3>
              <FlightLine
                variant="conversion"
                start={{ code: homeCurrency, caption: t('homeCurrencyCaption') }}
                end={{ code: slot.targetCurrency, caption: t('tripCurrencyCaption') }}
                srLabel={t('conversionSrLabel', { from: homeCurrency, to: slot.targetCurrency })}
              />
              <dl className="slot-meta">
                {dates ? (
                  <div>
                    <dt>{t('datesLabel')}</dt>
                    <dd>{dates}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{t('partyLabel')}</dt>
                  <dd>
                    {t('groupCount', { count: slot.coupleCount })}
                    {childCount > 0 ? <span className="slot-meta-extra">{t('childCount', { count: childCount })}</span> : null}
                  </dd>
                </div>
                {/* Hidden when unavailable; while pending it reserves its space so nothing shifts. */}
                {details.state !== 'unavailable' ? (
                  <div className={`slot-meta-total${details.details ? '' : ' is-pending'}`} aria-hidden={details.details ? undefined : true}>
                    <dt>{t('total')}</dt>
                    <dd>{details.details ? formatSlotMoney(details.details.total, details.details.currency) : ' '}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="slot-actions">
                {actionButton}
                {note ? <span className="slot-note">{note}</span> : null}
                <button
                  ref={toggleRef}
                  type="button"
                  className="slot-details-toggle"
                  aria-expanded={drawerOpen}
                  aria-controls={drawerId}
                  onClick={() => onDrawerToggle(!drawerOpen)}
                >
                  {t('details')}
                  <ChevronDown size={14} aria-hidden="true" className="slot-details-chevron" />
                </button>
              </div>
              </div>
              <SlotDetailsDrawer slot={slot} view={details} open={drawerOpen} id={drawerId} onClose={closeDrawer} />
            </>
          ) : (
            <>
              <div className="slot-main-kicker">
                <span className="slot-kicker">{t('blankTicket')}</span>
              </div>
              <h3 className="sr-only">{t('emptySlotHeading', { label })}</h3>
              <div className="slot-blank">
                <strong>{t('nothingSavedYet')}</strong>
                <p>{t('saveTripHereHint')}</p>
                {actionButton}
              </div>
            </>
          )}
        </div>
        <SlotStub
          slotIndex={slotIndex}
          label={label}
          tripId={slot?.tripId ?? null}
          onRenameSlot={onRenameSlot}
          seatRef={seatRef}
          editHintId={editHintId}
          menuButtonRef={menuButtonRef}
          menuId={menuId}
          menuOpen={menuOpen}
          menuHidden={menuHidden}
          onMenuToggle={onMenuToggle}
        />
      </div>
      {overlay ? (
        <button type="button" className="slot-overlay" onClick={overlay.onChoose}>
          <b>{overlay.title}</b> <small>{overlay.detail}</small>
        </button>
      ) : null}
    </li>
  );
}
