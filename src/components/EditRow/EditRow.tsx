import { useState, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { useToastStore } from '@/store/toastStore';
import { getAvailableCurrencies, getDefaultCurrency, getColorThemeValue, MAX_COST_NAME_LENGTH } from '@/store/types';
import Select from '@/components/Select/Select';
import CostTypePicker from '@/components/CostTypePicker/CostTypePicker';
import type { SplitType } from '@/store/types';
import { useResolvedTheme } from '@/store/theme';
import SplitAssignmentModal from '../SplitAssignmentModal';
import Tooltip from '@/components/Tooltip';

interface EditRowProps {
  initial?: {
    id: string;
    name: string;
    currency: string;
    value: number;
    markupOverride: number | null;
    splitType: SplitType;
    assignedCoupleIds: string[];
    type?: string | null;
  };
  defaultCurrency?: string;
  onSave: (data: {
    name: string;
    currency: string;
    value: number;
    markupOverride: number | null;
    splitType: SplitType;
    assignedCoupleIds: string[];
    type: string | null;
  }) => void;
  onCancel: () => void;
}

export default function EditRow({ initial, defaultCurrency, onSave, onCancel }: EditRowProps) {
  const couples = useTripStore((s) => s.couples);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const region = useTripStore((s) => s.region);
  const theme = useResolvedTheme();
  const addCouple = useTripStore((s) => s.addCouple);
  const pushToast = useToastStore((s) => s.pushToast);

  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState(
    () => initial?.currency ?? defaultCurrency ?? getDefaultCurrency(region)
  );
  const [value, setValue] = useState(initial?.value?.toString() ?? '');
  const [useGlobalMarkup, setUseGlobalMarkup] = useState(initial?.markupOverride === null || initial?.markupOverride === undefined);
  const [markupOverride, setMarkupOverride] = useState(
    initial?.markupOverride !== null && initial?.markupOverride !== undefined
      ? String(initial.markupOverride)
      : String(globalMarkup)
  );
  const [type, setType] = useState<string | null>(initial?.type ?? null);
  const [splitType, setSplitType] = useState<SplitType>(initial?.splitType ?? 'shared');
  const [assignedCoupleIds, setAssignedCoupleIds] = useState<string[]>(
    initial?.assignedCoupleIds ?? []
  );
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [pendingSplitType, setPendingSplitType] = useState<Extract<SplitType, 'subset' | 'individual'> | null>(null);
  const [tempAssignedCouples, setTempAssignedCouples] = useState<string[]>([]);
  const [modalOriginSplitType, setModalOriginSplitType] = useState<SplitType | null>(null);
  const [modalOriginAssignedCouples, setModalOriginAssignedCouples] = useState<string[]>([]);
  const fieldPrefix = initial?.id ? `edit-cost-${initial.id}` : 'new-cost-entry';
  const assignedGroupNames = couples
    .filter((couple) => assignedCoupleIds.includes(couple.id))
    .map((couple) => couple.name)
    .join(', ');

  const getSoloFallbackAssignment = useCallback(
    (preferredIds: string[], fallbackIds: string[]) => {
      const fallbackId = preferredIds[0] ?? fallbackIds[0] ?? couples[0]?.id;
      return fallbackId ? [fallbackId] : [];
    },
    [couples]
  );

  const handleSave = useCallback(() => {
    const parsedValue = parseFloat(value);

    if (!name.trim()) {
      pushToast({
        type: 'warning',
        title: 'Save blocked',
        message: 'Add a name before saving this cost entry.',
      });
      return;
    }

    if (isNaN(parsedValue) || parsedValue < 0) {
      pushToast({
        type: 'warning',
        title: 'Save blocked',
        message: 'Enter a valid amount that is 0 or higher.',
      });
      return;
    }

    const parsedMarkup = useGlobalMarkup ? null : parseFloat(markupOverride);
    const finalMarkup = useGlobalMarkup ? null : (isNaN(parsedMarkup!) ? null : parsedMarkup);

    let finalAssigned = assignedCoupleIds;
    if (splitType === 'shared') {
      finalAssigned = [];
    } else if (splitType === 'individual' && assignedCoupleIds.length > 1) {
      finalAssigned = [assignedCoupleIds[0]!];
    }

    // Validate that individual and subset have at least 1 assignment
    if ((splitType === 'individual' || splitType === 'subset') && finalAssigned.length === 0) {
      pushToast({
        type: 'warning',
        title: 'Save blocked',
        message: `${splitType === 'individual' ? 'Solo' : 'Subset'} costs must include at least one group assignment.`,
      });
      return;
    }

    onSave({
      name: name.trim(),
      currency,
      value: parsedValue,
      markupOverride: finalMarkup,
      splitType,
      assignedCoupleIds: finalAssigned,
      type: type || null,
    });
  }, [name, currency, value, useGlobalMarkup, markupOverride, splitType, assignedCoupleIds, type, onSave, pushToast]);

  const openSplitModalFor = (nextSplitType: SplitType) => {
    if (nextSplitType === 'shared') {
      setSplitType('shared');
      setAssignedCoupleIds([]);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      setModalOriginSplitType(null);
      setModalOriginAssignedCouples([]);
      setSplitModalOpen(false);
      return;
    }

    if (nextSplitType === 'subset') {
      setModalOriginSplitType(splitType);
      setModalOriginAssignedCouples([...assignedCoupleIds]);
      setSplitType('subset');
      setPendingSplitType('subset');
      setTempAssignedCouples([...assignedCoupleIds]);
      setSplitModalOpen(true);
      return;
    }

    setSplitType('individual');
    setPendingSplitType('individual');
    setTempAssignedCouples(assignedCoupleIds.length > 0 ? [assignedCoupleIds[0]!] : []);
    setSplitModalOpen(true);
  };

  const handleToggleCoupleInModal = (coupleId: string) => {
    if (pendingSplitType === 'individual') {
      setAssignedCoupleIds([coupleId]);
      setSplitType('individual');
      setSplitModalOpen(false);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      return;
    }

    if (pendingSplitType === 'subset') {
      setTempAssignedCouples((prev) =>
        prev.includes(coupleId)
          ? prev.filter((c) => c !== coupleId)
          : [...prev, coupleId]
      );
    }
  };

  const handleConfirmSubsetModal = () => {
    if (pendingSplitType !== 'subset') return;

    // Solo -> subset only sticks when 2+ groups are selected.
    if (modalOriginSplitType === 'individual' && tempAssignedCouples.length < 2) {
      setSplitType('individual');
      setAssignedCoupleIds(
        getSoloFallbackAssignment(tempAssignedCouples, modalOriginAssignedCouples)
      );
      setSplitModalOpen(false);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      setModalOriginSplitType(null);
      setModalOriginAssignedCouples([]);
      return;
    }

    if (tempAssignedCouples.length === 0) return;

    setSplitType('subset');
    setAssignedCoupleIds(tempAssignedCouples);
    setSplitModalOpen(false);
    setPendingSplitType(null);
    setTempAssignedCouples([]);
    setModalOriginSplitType(null);
    setModalOriginAssignedCouples([]);
  };

  const handleCloseSplitModal = () => {
    setSplitModalOpen(false);

    if (pendingSplitType === 'subset' && modalOriginSplitType === 'individual') {
      setSplitType('individual');
      setAssignedCoupleIds(getSoloFallbackAssignment([], modalOriginAssignedCouples));
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      setModalOriginSplitType(null);
      setModalOriginAssignedCouples([]);
      return;
    }
    
    // Auto-reset to 'shared' if no groups selected in subset/solo mode
    if ((splitType === 'subset' || splitType === 'individual') && assignedCoupleIds.length === 0) {
      setSplitType('shared');
      setAssignedCoupleIds([]);
    }
    
    setPendingSplitType(null);
    setTempAssignedCouples([]);
    setModalOriginSplitType(null);
    setModalOriginAssignedCouples([]);
  };

  const handleCreateGroupInModal = () => {
    const newCoupleId = addCouple();
    if (!newCoupleId || !pendingSplitType) return;

    if (pendingSplitType === 'individual') {
      setSplitType('individual');
      setAssignedCoupleIds([newCoupleId]);
      setSplitModalOpen(false);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      return;
    }

    setSplitType('subset');
    setTempAssignedCouples((prev) => (prev.includes(newCoupleId) ? prev : [...prev, newCoupleId]));
  };

  return (
    <tr className="edit-row">
      <td colSpan={11}>
        <div className="edit-grid">
          <div className="ef">
            <label className="ef-lbl" htmlFor={`${fieldPrefix}-name`}>Name</label>
            <input
              id={`${fieldPrefix}-name`}
              className="ef-inp"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hotel Night 1"
              maxLength={MAX_COST_NAME_LENGTH}
              autoFocus
            />
          </div>
          <div className="ef">
            <label className="ef-lbl" htmlFor={`${fieldPrefix}-currency`}>Currency</label>
            <Select
              id={`${fieldPrefix}-currency`}
              className="ef-select"
              value={currency}
              options={getAvailableCurrencies(region)}
              onChange={setCurrency}
            />
          </div>
          <div className="ef">
            <label className="ef-lbl" htmlFor={`${fieldPrefix}-amount`} style={{ textAlign: 'right' }}>Amount</label>
            <input
              id={`${fieldPrefix}-amount`}
              className="ef-inp mono"
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="ef">
            <span className="ef-lbl" id={`${fieldPrefix}-split-label`}>Split</span>
            <div role="group" aria-labelledby={`${fieldPrefix}-split-label`} className="seg">
              <button
                className={`seg-btn${splitType === 'shared' ? ' on' : ''}`}
                onClick={() => openSplitModalFor('shared')}
                type="button"
                aria-pressed={splitType === 'shared'}
              >
                All
              </button>
              <button
                className={`seg-btn${splitType === 'subset' ? ' on' : ''}`}
                onClick={() => openSplitModalFor('subset')}
                type="button"
                aria-pressed={splitType === 'subset'}
              >
                Subset
              </button>
              <button
                className={`seg-btn${splitType === 'individual' ? ' on' : ''}`}
                onClick={() => openSplitModalFor('individual')}
                type="button"
                aria-pressed={splitType === 'individual'}
              >
                Solo
              </button>
            </div>
          </div>
          <div className="ef">
            <label className="ef-lbl" htmlFor={`${fieldPrefix}-type`}>Type</label>
            <CostTypePicker
              id={`${fieldPrefix}-type`}
              value={type}
              onChange={setType}
              optionsId={`${fieldPrefix}-type-options`}
              groupLabel="Cost type"
              form
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="markup-row" style={{ marginTop: 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={useGlobalMarkup}
                  onChange={(e) => setUseGlobalMarkup(e.target.checked)}
                />
                Use global markup ({globalMarkup}%)
              </label>
              <div className={`markup-controls${useGlobalMarkup ? ' is-hidden' : ''}`} aria-hidden={useGlobalMarkup}>
                <label htmlFor={`${fieldPrefix}-markup`} className="sr-only">
                  Custom markup percentage
                </label>
                <input
                  id={`${fieldPrefix}-markup`}
                  className="ef-inp mono markup-override-inp"
                  type="number"
                  step="0.1"
                  min="0"
                  value={markupOverride}
                  onChange={(e) => setMarkupOverride(e.target.value)}
                  placeholder="0"
                  disabled={useGlobalMarkup}
                />
                <button
                  type="button"
                  className="markup-reset-btn"
                  onClick={() => {
                    setMarkupOverride(String(globalMarkup));
                    setUseGlobalMarkup(true);
                  }}
                  disabled={useGlobalMarkup}
                >
                  Reset
                </button>
              </div>
            </div>

            {(splitType === 'subset' || splitType === 'individual') && (
              <div className="subset-picks" style={{ marginTop: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--text-3)',
                }}>
                  {splitType === 'individual' ? 'Assigned group:' : 'Included groups:'}
                </span>
                <Tooltip content={assignedGroupNames
                  ? `Currently assigned to: ${assignedGroupNames}`
                  : 'Choose groups for this cost'}>
                  <button
                    type="button"
                    className={`split-select-inline-btn${assignedCoupleIds.length > 0 ? ' with-dots' : ''}`}
                    onClick={() => openSplitModalFor(splitType)}
                    aria-label={splitType === 'individual' ? 'Change assigned group' : 'Change included groups'}
                  >
                    {assignedCoupleIds.length > 0 ? (
                      <div className="who-dots" style={{ margin: 0 }}>
                        {couples
                          .filter((c) => assignedCoupleIds.includes(c.id))
                          .map((c) => (
                            <span
                              key={c.id}
                              className="who-dot"
                              style={{ backgroundColor: getColorThemeValue(c.colorIndex, theme) }}
                            />
                          ))}
                      </div>
                    ) : (
                      'Select groups'
                    )}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>

          <div className="edit-acts" style={{ paddingTop: 0 }}>
            <button className="btn-save" onClick={handleSave} type="button">Save</button>
            <Tooltip content="Discard changes and close this editor">
              <button
                className="btn-cancel"
                onClick={onCancel}
                type="button"
                aria-label="Cancel editing cost"
              >
                ✕
              </button>
            </Tooltip>
          </div>
        </div>

        <SplitAssignmentModal
          open={splitModalOpen}
          mode={pendingSplitType}
          couples={couples}
          selectedCoupleIds={tempAssignedCouples}
          modalName={initial?.id ? `solo-couple-edit-${initial.id}` : 'solo-couple-new'}
          onToggleCouple={handleToggleCoupleInModal}
          onConfirmSubset={handleConfirmSubsetModal}
          onClose={handleCloseSplitModal}
          onCreateGroup={handleCreateGroupInModal}
        />
      </td>
    </tr>
  );
}
