import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Modal';

interface DuplicateTripDialogProps {
  /** Label of the slot that already holds the live trip. */
  homeLabel: string;
  /** Label of the slot the user chose. */
  targetLabel: string;
  onOverwriteHome: () => void;
  onSaveCopy: () => void;
  onCancel: () => void;
}

/** The live trip is already stored in another slot: update that one, or keep both with a copy. */
export default function DuplicateTripDialog({
  homeLabel,
  targetLabel,
  onOverwriteHome,
  onSaveCopy,
  onCancel,
}: DuplicateTripDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal
      icon={Copy}
      title={t('duplicateTripDialogTitle', { slot: homeLabel })}
      body={t('duplicateTripDialogBody', { slot: homeLabel, target: targetLabel })}
      confirmLabel={t('overwriteSlotAction', { slot: homeLabel })}
      onConfirm={onOverwriteHome}
      secondaryActionLabel={t('saveAsCopy')}
      onSecondaryAction={onSaveCopy}
      onCancel={onCancel}
    />
  );
}
