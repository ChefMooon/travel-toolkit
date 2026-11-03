import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { usePresence } from '@/lib/motion';
import { useSettingsStore } from '@/store/settingsStore';
import { useResolvedTheme } from '@/store/theme';
import { COUPLE_ICONS, getColorThemeValue, type SaveSlot } from '@/store/types';
import type { CostTypeShare, SlotDetails, SlotUnavailableReason } from './slotDetails';
import { formatSavedAt, formatSlotMoney, formatTripDates } from './slotFormat';
import type { SlotDetailsView } from './useSlotDetails';

// Matches the drawer's slide-out transition in index.css.
const DRAWER_EXIT_MS = 200;
const TABS = ['costs', 'group', 'trip'] as const;
type TabId = typeof TABS[number];

const TAB_LABEL_KEYS = { costs: 'tabCosts', group: 'tabGroup', trip: 'tabTrip' } as const;
const UNAVAILABLE_KEYS = {
  rates: 'totalUnavailableRates',
  schema: 'totalUnavailableSchema',
  invalid: 'totalUnavailableInvalid',
} as const;

interface SlotDetailsDrawerProps {
  slot: SaveSlot;
  view: SlotDetailsView;
  open: boolean;
  id: string;
  onClose: () => void;
}

function percentText(percent: number) {
  return formatNumber(percent / 100, { style: 'percent' });
}

/**
 * Slides up inside the fixed-height card (absolutely positioned over the card's main part), so
 * opening it never changes the card or the modal size. Each tab panel scrolls on its own.
 */
export default function SlotDetailsDrawer({ slot, view, open, id, onClose }: SlotDetailsDrawerProps) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const hour12 = useSettingsStore((s) => s.clockFormat) === '12h';
  const [tab, setTab] = useState<TabId>('costs');
  // The shell stays mounted so it can slide; its content only exists while open (and for the
  // slide-out), so a closed drawer adds no controls to the dialog's focus trap and no duplicate text.
  const { mounted } = usePresence(open, { exitMs: DRAWER_EXIT_MS });
  const hideRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ costs: null, group: null, trip: null });
  const headingId = `${id}-h`;
  const details = view.details;

  // Focus lands on Hide once the drawer is open (the card hands it back to the Details toggle).
  useEffect(() => {
    if (open) hideRef.current?.focus();
  }, [open]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.indexOf(tab);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let next = -1;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const forward = (event.key === 'ArrowRight') !== rtl;
      next = (index + (forward ? 1 : -1) + TABS.length) % TABS.length;
    }
    const nextTab = TABS[next];
    if (!nextTab) return;
    event.preventDefault();
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  // Escape closes the drawer first: the panel (and any mode) must not see it.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const bodyState = view.state === 'skeleton' ? 'skeleton' : view.state === 'ready' || view.state === 'unavailable' ? 'ready' : 'pending';

  const typeLabel = (share: CostTypeShare) =>
    share.id === 'other' ? t('otherCostType') : t(`costType_${share.id}` as 'costType_food', { defaultValue: share.id });

  const unavailableNote = (reason: SlotUnavailableReason | null) => (
    <div className="dr-note">
      <strong>{t('totalUnavailable')}</strong>
      {reason ? <span>{t(UNAVAILABLE_KEYS[reason])}</span> : null}
    </div>
  );

  const renderCosts = (d: SlotDetails) => (
    <>
      <span className="slot-kicker">{t('totalInCurrency', { currency: d.currency })}</span>
      <strong className="dr-big">{formatSlotMoney(d.total, d.currency)}</strong>
      {d.costTypes.length > 0 ? (
        <>
          <div
            className="dr-bar"
            role="img"
            aria-label={t('costsByTypeLabel', { items: d.costTypes.map((s) => `${typeLabel(s)} ${percentText(s.percent)}`).join(', ') })}
          >
            {d.costTypes.map((share) => (
              <i key={share.id} style={{ '--w': share.amount, '--c': share.color ?? 'var(--text-3)' } as CSSProperties} />
            ))}
          </div>
          <ul className="dr-legend">
            {d.costTypes.map((share) => (
              <li key={share.id} style={{ '--c': share.color ?? 'var(--text-3)' } as CSSProperties}>
                <span className="dr-swatch" aria-hidden="true" />
                <span>{typeLabel(share)}</span>
                <span className="dr-amount">{formatSlotMoney(share.amount, d.currency)}</span>
                <span className="dr-pct">{percentText(share.percent)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <dl className="dr-facts">
        <dt>{t('entriesLabel')}</dt>
        <dd>{t('entryCount', { count: d.entryCount })}</dd>
        <dt>{t('ratesLabel')}</dt>
        <dd>{t('ratesCachedOverridden', { cached: d.ratesCached, overridden: d.ratesOverridden })}</dd>
        <dt>{t('markup')}</dt>
        <dd>{t('markupGlobalValue', { value: d.globalMarkup })}</dd>
      </dl>
    </>
  );

  const renderGroups = (d: SlotDetails) => (
    <>
      <ul className="dr-groups">
        {d.groups.map((group) => (
          <li key={group.id}>
            <span className="dr-chip" style={{ '--g': getColorThemeValue(group.colorIndex, theme) } as CSSProperties}>
              <span aria-hidden="true">{COUPLE_ICONS[group.iconIndex - 1]?.symbol}</span>
              <bdi dir="auto">{group.name}</bdi>
            </span>
            {group.grandTotal !== null ? <span className="dr-amount">{formatSlotMoney(group.grandTotal, d.currency)}</span> : null}
            {group.nonPayingCount > 0 ? <span className="dr-people">{t('childCount', { count: group.nonPayingCount })}</span> : null}
          </li>
        ))}
      </ul>
      <p className="dr-foot">
        {[t('groupCount', { count: d.groups.length }), d.nonPayingCount > 0 ? t('childCount', { count: d.nonPayingCount }) : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </>
  );

  const renderTrip = () => {
    const dates = details ? formatTripDates(details.startDate ?? undefined, details.endDate ?? undefined) : null;
    return (
      <dl className="dr-facts">
        {dates ? (
          <>
            <dt>{t('datesLabel')}</dt>
            <dd>{details?.nights ? `${dates} · ${t('nightCount', { count: details.nights })}` : dates}</dd>
          </>
        ) : null}
        {details ? (
          <>
            <dt>{t('region')}</dt>
            <dd>{t(`region${details.region.replace(/\s/g, '')}` as 'regionEurope', { defaultValue: details.region })}</dd>
          </>
        ) : null}
        <dt>{t('tripId')}</dt>
        <dd className="dr-mono">{slot.tripId}</dd>
        <dt>{t('schemaLabel')}</dt>
        <dd>{t('schemaVersionValue', { version: slot.schemaVersion })}</dd>
        <dt>{t('savedAtLabel')}</dt>
        <dd>{formatSavedAt(slot.savedAt, hour12)}</dd>
        <dt>{t('storageLabel')}</dt>
        {/* Future: the storage location (e.g. cloud) once slots can live somewhere other than this device. */}
        <dd>{t('storageLocalDevice')}</dd>
      </dl>
    );
  };

  const panelContent = (id: TabId) => {
    if (view.state === 'unavailable' && id !== 'trip') return unavailableNote(view.unavailable);
    if (!details) return id === 'trip' ? renderTrip() : null;
    if (id === 'costs') return renderCosts(details);
    if (id === 'group') return renderGroups(details);
    return renderTrip();
  };

  return (
    <section
      id={id}
      className={`slot-drawer${open ? ' is-open' : ''}`}
      aria-labelledby={headingId}
      inert={open ? undefined : true}
      onKeyDown={handleKeyDown}
    >
      {mounted ? (
        <>
      <header className="slot-drawer-head">
        <h4 id={headingId}>{t('tripDetails')}</h4>
        <button ref={hideRef} type="button" className="slot-drawer-hide" onClick={onClose}>
          {t('hideDetails')}
        </button>
      </header>
      <div className="slot-tabs" role="tablist" aria-labelledby={headingId} onKeyDown={handleTabKeyDown}>
        {TABS.map((tabId) => (
          <button
            key={tabId}
            ref={(element) => { tabRefs.current[tabId] = element; }}
            type="button"
            role="tab"
            id={`${id}-t-${tabId}`}
            aria-controls={`${id}-p-${tabId}`}
            aria-selected={tab === tabId}
            tabIndex={tab === tabId ? 0 : -1}
            className="slot-tab"
            onClick={() => setTab(tabId)}
          >
            {t(TAB_LABEL_KEYS[tabId])}
          </button>
        ))}
      </div>
      <div className="slot-drawer-body" data-state={bodyState} data-fade={view.fade ? '' : undefined}>
        <div className="slot-drawer-panels">
          {TABS.map((tabId) => (
            <div
              key={tabId}
              role="tabpanel"
              id={`${id}-p-${tabId}`}
              aria-labelledby={`${id}-t-${tabId}`}
              aria-busy={view.busy || undefined}
              tabIndex={0}
              hidden={tab !== tabId}
              className="slot-drawer-panel"
            >
              {panelContent(tabId)}
            </div>
          ))}
        </div>
        <div className="slot-drawer-skeleton" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>
      </div>
        </>
      ) : null}
    </section>
  );
}
