import type { Ref } from 'react';
import { MoreHorizontal, MonitorSmartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MAX_SLOT_LABEL_LENGTH } from '@/store/types';
import InlineEditableText, { type InlineEditableTextHandle } from './InlineEditableText';

interface SlotStubProps {
  slotIndex: number;
  label: string;
  /** Trip ID of the saved trip, or null for an empty slot. */
  tripId: string | null;
  onRenameSlot: (label: string) => void;
  seatRef: Ref<InlineEditableTextHandle>;
  editHintId: string;
  menuButtonRef: Ref<HTMLButtonElement>;
  menuId: string;
  menuOpen: boolean;
  /** Hidden (but keeps its space) while picking or moving, when the menu has nothing to offer. */
  menuHidden: boolean;
  onMenuToggle: () => void;
}

/** "Flight TT-0N" is the slot position; the seat is the slot's own label; the ticket is the trip ID. */
export function flightNumber(slotIndex: number): string {
  return `TT-${String(slotIndex + 1).padStart(2, '0')}`;
}

export default function SlotStub({
  slotIndex,
  label,
  tripId,
  onRenameSlot,
  seatRef,
  editHintId,
  menuButtonRef,
  menuId,
  menuOpen,
  menuHidden,
  onMenuToggle,
}: SlotStubProps) {
  const { t } = useTranslation();

  return (
    <div className="slot-stub">
      <div className="slot-stub-top">
        <div className="slot-stub-field">
          <span className="slot-kicker">{t('flightLabel')}</span>
          <span className="slot-stub-flight"><bdi dir="ltr">{flightNumber(slotIndex)}</bdi></span>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className={menuHidden ? 'slot-menu-btn is-concealed' : 'slot-menu-btn'}
          aria-label={t('moreActionsForSlot', { label })}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          tabIndex={menuHidden ? -1 : undefined}
          onClick={menuHidden ? undefined : onMenuToggle}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="slot-stub-field">
        <span className="slot-kicker">{t('seatLabel')}</span>
        <InlineEditableText
          ref={seatRef}
          className="inline-edit--seat"
          value={label}
          onCommit={onRenameSlot}
          maxLength={MAX_SLOT_LABEL_LENGTH}
          aria-label={t('slotNameInput')}
          aria-describedby={editHintId}
        />
      </div>
      <div className="slot-stub-field">
        <span className="slot-kicker">{t('ticketLabel')}</span>
        <span className="slot-stub-ticket"><bdi dir="ltr">{tripId ?? '—'}</bdi></span>
      </div>
      {/* Storage chip. Future: slot location 'local' | 'cloud', with the cloud sync status
          (synced / pending / conflict) shown in this spot of the stub. */}
      <span className="slot-stub-chip">
        <MonitorSmartphone size={11} aria-hidden="true" />
        {t('storageLocal')}
      </span>
      <div className="slot-stub-barcode" aria-hidden="true" />
    </div>
  );
}
