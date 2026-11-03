import type { ReactNode } from 'react';

interface SlotListProps {
  mode: 'browse' | 'pick' | 'move';
  children: ReactNode;
}

/**
 * The wallet: one fixed-height ticket per slot. Columns come from the available width
 * (auto-fill), and the number of cards from the slots array, not MAX_SAVE_SLOTS, so a different
 * capacity (e.g. account-based slots) needs no layout change here.
 */
export default function SlotList({ mode, children }: SlotListProps) {
  return (
    <ul className="slot-list" data-mode={mode} data-tool="trip">
      {children}
    </ul>
  );
}
