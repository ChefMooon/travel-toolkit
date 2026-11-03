import type { RefObject } from 'react';
import { ArrowLeftRight, Copy, FileOutput, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnchoredPopover } from '@/components/Popover';

interface SlotMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  scrollContainerRef: RefObject<HTMLElement | null>;
  id: string;
  label: string;
  /** Empty slots only offer "Rename slot". */
  filled: boolean;
  onRename: () => void;
  onExport: () => void;
  onMove: () => void;
  onSaveCopy: () => void;
  onClear: () => void;
}

/** The "..." menu of one card. Rendered in the panel layer so the scrolling list never clips it. */
export default function SlotMenu({
  open,
  onClose,
  anchorRef,
  scrollContainerRef,
  id,
  label,
  filled,
  onRename,
  onExport,
  onMove,
  onSaveCopy,
  onClear,
}: SlotMenuProps) {
  const { t } = useTranslation();
  // Each item closes the menu first; actions that move focus elsewhere then take it from the trigger.
  const item = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <AnchoredPopover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      scrollContainerRef={scrollContainerRef}
      role="menu"
      id={id}
      aria-label={t('slotActions', { label })}
      className="slot-menu"
    >
      <button type="button" role="menuitem" className="slot-menu-item" onClick={item(onRename)}>
        <Pencil size={14} aria-hidden="true" />
        {t('renameSlotMenu')}
      </button>
      {filled ? (
        <>
          <button type="button" role="menuitem" className="slot-menu-item" onClick={item(onExport)}>
            <FileOutput size={14} aria-hidden="true" />
            {t('exportThisTrip')}
          </button>
          <button type="button" role="menuitem" className="slot-menu-item" onClick={item(onMove)}>
            <ArrowLeftRight size={14} aria-hidden="true" />
            {t('moveTrip')}
          </button>
          <button type="button" role="menuitem" className="slot-menu-item" onClick={item(onSaveCopy)}>
            <Copy size={14} aria-hidden="true" />
            {t('saveAsCopyEllipsis')}
          </button>
          <hr className="slot-menu-rule" />
          <button type="button" role="menuitem" className="slot-menu-item slot-menu-item--danger" onClick={item(onClear)}>
            <Trash2 size={14} aria-hidden="true" />
            {t('clearSlotMenu')}
          </button>
        </>
      ) : null}
    </AnchoredPopover>
  );
}
