import { useMemo, useState, useRef, useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import { getEffectiveMarkup, getCostWithMarkup, validateCost } from '@/lib/calculations';
import { createPortal } from 'react-dom';
import { Pencil, Copy, Trash2, GripVertical, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { CostEntry, SplitType } from '@/store/types';
import NumericInput from '@/components/NumericInput/NumericInput';
import { getAvailableCurrencies, getColorThemeValue, COST_ENTRY_TYPES } from '@/store/types';
import { useResolvedTheme } from '@/store/theme';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SplitAssignmentModal from '../SplitAssignmentModal';
import Tooltip from '@/components/Tooltip';
import Select from '@/components/Select/Select';
import CostTypePicker from '@/components/CostTypePicker/CostTypePicker';
import { useDraftStore } from '@/store/draftStore';
import { useTranslation } from 'react-i18next';
import { formatCurrency as formatLocaleCurrency, formatNumber } from '@/i18n/format';

interface CostRowProps {
  cost: CostEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function CostRow({ cost, isSelected, onToggleSelect, onEdit, onDuplicate, onDelete }: CostRowProps) {
  const { t } = useTranslation();
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const region = useTripStore((s) => s.region);
  const theme = useResolvedTheme();
  const couples = useTripStore((s) => s.couples);
  const editCost = useTripStore((s) => s.editCost);
  const addCouple = useTripStore((s) => s.addCouple);

  const [editingField, setEditingField] = useState<'name' | 'amount' | null>(null);
  const [editName, setEditName] = useState(cost.name);
  const [editAmount, setEditAmount] = useState(cost.value.toString());
  const [splitPopoverOpen, setSplitPopoverOpen] = useState(false);
  const [couplePopoverOpen, setCouplePopoverOpen] = useState(false);
  const [previousSplitType, setPreviousSplitType] = useState<SplitType>(cost.splitType);
  const [previousAssignedCouples, setPreviousAssignedCouples] = useState<string[]>(cost.assignedCoupleIds);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [pendingSplitType, setPendingSplitType] = useState<Extract<SplitType, 'subset' | 'individual'> | null>(null);
  const [tempAssignedCouples, setTempAssignedCouples] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const splitPopoverRef = useRef<HTMLDivElement>(null);
  const splitBtnRef = useRef<HTMLButtonElement>(null);
  const splitPortalRef = useRef<HTMLDivElement>(null);
  const [splitPopoverPos, setSplitPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const setDraft = useDraftStore((s) => s.setDraft);
  const hasModifiedInlineDraft = (editingField === 'name' && editName !== cost.name) || (editingField === 'amount' && editAmount !== cost.value.toString());
  useEffect(() => {
    const key = `cost-row-${cost.id}`;
    setDraft(key, hasModifiedInlineDraft);
    return () => setDraft(key, false);
  }, [cost.id, hasModifiedInlineDraft, setDraft]);
  const couplePopoverRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cost.id });

  const typeEntry = COST_ENTRY_TYPES.find((t) => t.id === cost.type) ?? null;
  const splitOptionsId = `cost-${cost.id}-split-options`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: typeEntry ? typeEntry.color + '20' : undefined,
  };

  const effectiveMarkup = getEffectiveMarkup(cost, globalMarkup);
  const totalWithMarkup = getCostWithMarkup(cost, globalMarkup);
  const isCustomMarkup = cost.markupOverride !== null;
  const validation = validateCost(cost);

  const getSoloFallbackAssignment = (preferredIds: string[], fallbackIds: string[]) => {
    const fallbackId = preferredIds[0] ?? fallbackIds[0] ?? couples[0]?.id;
    return fallbackId ? [fallbackId] : [];
  };

  const assignedDots = useMemo(() => {
    if (cost.splitType === 'shared') return null;
    return cost.assignedCoupleIds
      .map((id) => couples.find((c) => c.id === id))
      .filter(Boolean);
  }, [cost.splitType, cost.assignedCoupleIds, couples]);
  const assignedGroupNames = assignedDots?.map((couple) => couple!.name).join(', ') ?? '';

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        splitPopoverRef.current && !splitPopoverRef.current.contains(e.target as Node) &&
        (!splitPortalRef.current || !splitPortalRef.current.contains(e.target as Node))
      ) {
        setSplitPopoverOpen(false);
      }
      if (couplePopoverRef.current && !couplePopoverRef.current.contains(e.target as Node)) {
        // If closing couple popover and no couples selected, revert split type
        if (couplePopoverOpen && cost.splitType !== 'shared' && cost.assignedCoupleIds.length === 0) {
          editCost(cost.id, { splitType: previousSplitType, assignedCoupleIds: previousAssignedCouples });
        }
        setCouplePopoverOpen(false);
      }
    };
    if (splitPopoverOpen || couplePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [splitPopoverOpen, couplePopoverOpen, cost.splitType, cost.assignedCoupleIds, previousSplitType, cost.id, editCost, previousAssignedCouples]);

  // Handle name edit
  const handleNameEdit = () => {
    setEditName(cost.name);
    setEditingField('name');
  };

  const handleNameSave = () => {
    if (editName.trim()) {
      editCost(cost.id, { name: editName.trim() });
    }
    setEditingField(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  // Handle amount edit
  const handleAmountEdit = () => {
    setEditAmount(cost.value.toString());
    setEditingField('amount');
  };

  const handleAmountSave = () => {
    const num = parseFloat(editAmount);
    if (!isNaN(num) && num >= 0) {
      editCost(cost.id, { value: num });
    }
    setEditingField(null);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAmountSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  // Handle markup editing
  const handleMarkupChange = (newValue: number) => {
    const isEffectivelyGlobal = Math.abs(newValue - globalMarkup) < 0.001;
    editCost(cost.id, {
      markupOverride: isEffectivelyGlobal ? null : newValue,
    });
  };

  const handleMarkupArrow = (direction: 'left' | 'right') => {
    const current = isCustomMarkup ? cost.markupOverride! : globalMarkup;
    const newValue = direction === 'right' ? current + 1 : Math.max(0, current - 1);
    handleMarkupChange(newValue);
  };

  // Handle split type change
  const handleSplitChange = (newSplitType: SplitType) => {
    setSplitPopoverOpen(false);
    setPreviousSplitType(cost.splitType);
    setPreviousAssignedCouples(cost.assignedCoupleIds);

    if (newSplitType === 'shared') {
      // Shared doesn't need selection, just apply immediately
      editCost(cost.id, {
        splitType: newSplitType,
        assignedCoupleIds: [],
      });
    } else if (newSplitType === 'subset') {
      // Subset: open modal with couple selection
      setPendingSplitType(newSplitType);
      setTempAssignedCouples(cost.assignedCoupleIds.length > 0 ? cost.assignedCoupleIds : []);
      setSplitModalOpen(true);
    } else if (newSplitType === 'individual') {
      // Individual: open modal with radio selection
      setPendingSplitType(newSplitType);
      setTempAssignedCouples([]);
      setSplitModalOpen(true);
    }
  };

  // Handle couple toggle in modal
  const handleToggleCoupleInModal = (coupleId: string) => {
    if (pendingSplitType === 'individual') {
      setTempAssignedCouples([coupleId]);
      // Auto-confirm and close for individual
      editCost(cost.id, {
        splitType: 'individual',
        assignedCoupleIds: [coupleId],
      });
      setSplitModalOpen(false);
      setPendingSplitType(null);
    } else if (pendingSplitType === 'subset') {
      setTempAssignedCouples(
        tempAssignedCouples.includes(coupleId)
          ? tempAssignedCouples.filter((c) => c !== coupleId)
          : [...tempAssignedCouples, coupleId]
      );
    }
  };

  // Confirm modal selection (for subset)
  const handleConfirmSplitModal = () => {
    if (!pendingSplitType) return;

    if (pendingSplitType === 'subset' && previousSplitType === 'individual' && tempAssignedCouples.length < 2) {
      editCost(cost.id, {
        splitType: 'individual',
        assignedCoupleIds: getSoloFallbackAssignment(tempAssignedCouples, previousAssignedCouples),
      });
      setSplitModalOpen(false);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
      return;
    }

    if (tempAssignedCouples.length > 0) {
      editCost(cost.id, {
        splitType: pendingSplitType,
        assignedCoupleIds: tempAssignedCouples,
      });
      setSplitModalOpen(false);
      setPendingSplitType(null);
      setTempAssignedCouples([]);
    }
  };

  // Cancel modal (revert)
  const handleCancelSplitModal = () => {
    if (pendingSplitType === 'subset' && previousSplitType === 'individual') {
      editCost(cost.id, {
        splitType: 'individual',
        assignedCoupleIds: getSoloFallbackAssignment([], previousAssignedCouples),
      });
    }

    setSplitModalOpen(false);
    setPendingSplitType(null);
    setTempAssignedCouples([]);
  };

  const handleCreateGroupInModal = () => {
    const newCoupleId = addCouple();
    if (!newCoupleId || !pendingSplitType) return;

    if (pendingSplitType === 'individual') {
      editCost(cost.id, {
        splitType: 'individual',
        assignedCoupleIds: [newCoupleId],
      });
      setSplitModalOpen(false);
      setPendingSplitType(null);
      return;
    }

    setTempAssignedCouples((prev) => (prev.includes(newCoupleId) ? prev : [...prev, newCoupleId]));
  };

  // Handle who-dots click to open split modal
  const handleWhoDotsClick = () => {
    if (cost.splitType === 'subset') {
      setPendingSplitType('subset');
      setTempAssignedCouples(cost.assignedCoupleIds.length > 0 ? cost.assignedCoupleIds : []);
      setSplitModalOpen(true);
    } else if (cost.splitType === 'individual') {
      setPendingSplitType('individual');
      setTempAssignedCouples(cost.assignedCoupleIds.length > 0 ? cost.assignedCoupleIds : []);
      setSplitModalOpen(true);
    }
  };

  // Focus input when switching to edit mode
  useEffect(() => {
    if (editingField === 'name' && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    } else if (editingField === 'amount' && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [editingField]);

  return (
    <>
    <tr ref={setNodeRef} style={style} className={isSelected ? 'sel' : ''}>
      <td>
        <span
          className={`drag-h${isDragging ? ' dragging' : ''}`}
          {...attributes}
          {...listeners}
          aria-label={t('reorderCost', { name: cost.name })}
        >
          <GripVertical size={15} />
        </span>
      </td>
      <td>
        <input
          className="chk"
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={t('selectCost', { name: cost.name })}
        />
      </td>
      <td>
        <div className="ledger-inline-field">
        {editingField === 'name' && (
          <input
            ref={nameInputRef}
            className="inline-edit-input"
            type="text"
            value={editName}
            aria-label={t('costNameFor', { name: cost.name })}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        )}
        <div style={{ visibility: editingField === 'name' ? 'hidden' : undefined }} aria-hidden={editingField === 'name' || undefined}>
          <Tooltip content={cost.name}>
            <button
              type="button"
              className="cost-name cell-edit-trigger"
              aria-label={t('editCostName', { name: cost.name })}
              onClick={handleNameEdit}
              tabIndex={editingField === 'name' ? -1 : undefined}
            >
              <bdi dir="auto">{cost.name}</bdi>
            </button>
          </Tooltip>
        </div>
        </div>
      </td>
      <td>
        <Select
          className="cur-select"
          aria-label={t('currencyForCost', { name: cost.name })}
          value={cost.currency}
          options={getAvailableCurrencies(region)}
          onChange={(value) => editCost(cost.id, { currency: value })}
        />
      </td>
      <td>
        <div
          className="ledger-inline-field"
          onBlur={(event) => {
            if (editingField === 'amount' && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
              handleAmountSave();
            }
          }}
        >
        {editingField === 'amount' && (
          <NumericInput
            ref={amountInputRef}
            className="inline-edit-input mono"
            step="0.01"
            min="0"
            value={editAmount}
            aria-label={t('amountForCost', { name: cost.name })}
            onChange={(e) => setEditAmount(e.target.value)}
            onKeyDown={handleAmountKeyDown}
          />
        )}
        <div style={{ visibility: editingField === 'amount' ? 'hidden' : undefined }} aria-hidden={editingField === 'amount' || undefined}>
          <button
            type="button"
            className="amt cell-edit-trigger"
            aria-label={t('editCostAmount', { name: cost.name })}
            onClick={handleAmountEdit}
            tabIndex={editingField === 'amount' ? -1 : undefined}
          >
            {formatNumber(cost.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        </div>
        </div>
      </td>
      <td>
        <div className="markup-inline">
          <Tooltip content={t('decreaseMarkup')}>
            <button
              className="arrow-btn left"
              onClick={() => handleMarkupArrow('left')}
              aria-label={t('decreaseMarkup')}
            >
              <ChevronLeft size={12} />
            </button>
          </Tooltip>
          <Tooltip content={t('markupValue', { kind: isCustomMarkup ? t('customMarkup') : t('globalMarkupLabel'), value: formatNumber(effectiveMarkup, { maximumFractionDigits: 2 }) })}>
            <input
              className="markup-input mono"
              type="number"
              step="1"
              min="0"
              value={effectiveMarkup}
              aria-label={t('markupValue', { kind: isCustomMarkup ? t('customMarkup') : t('globalMarkupLabel'), value: formatNumber(effectiveMarkup, { maximumFractionDigits: 2 }) })}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleMarkupChange(val);
              }}
              style={{
                backgroundColor:
                  effectiveMarkup < globalMarkup
                    ? 'var(--markup-below)'
                    : effectiveMarkup > globalMarkup
                    ? 'var(--markup-above)'
                    : 'var(--markup-equal)',
              }}
            />
          </Tooltip>
          <Tooltip content={t('increaseMarkup')}>
            <button
              className="arrow-btn right"
              onClick={() => handleMarkupArrow('right')}
              aria-label={t('increaseMarkup')}
            >
              <ChevronRight size={12} />
            </button>
          </Tooltip>
          <Tooltip content={t('resetGlobalMarkup')}>
            <button
              className="reset-markup-btn"
              type="button"
              onClick={() => handleMarkupChange(globalMarkup)}
              aria-label={t('resetMarkupFor', { name: cost.name })}
            >
              r
            </button>
          </Tooltip>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!validation.isValid && (
            <Tooltip content={validation.errorMessage === 'Solo cost must have 1 person assigned' ? t('soloCostNeedsGroup') : validation.errorMessage === 'Subset cost must have ≥1 person assigned' ? t('subsetCostNeedsGroup') : t('invalidCost')}>
              <span
                role="img"
                aria-label={t('invalidCost')}
                tabIndex={0}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <AlertCircle size={16} color="#f97316" style={{ cursor: 'help', display: 'block' }} />
              </span>
            </Tooltip>
          )}
          <div className="split-popover-container" ref={splitPopoverRef}>
            <Tooltip content={t('changeSplitType')}>
              <button
                ref={splitBtnRef}
                className={`split split-${cost.splitType}`}
                type="button"
                aria-expanded={splitPopoverOpen}
                aria-controls={splitOptionsId}
                aria-label={t('splitTypeForCost', { name: cost.name, splitType: t(cost.splitType) })}
                onClick={() => {
                  if (!splitPopoverOpen && splitBtnRef.current) {
                    const rect = splitBtnRef.current.getBoundingClientRect();
                    setSplitPopoverPos({ top: rect.bottom + 4, left: rect.left });
                  }
                  setSplitPopoverOpen(!splitPopoverOpen);
                }}
              >
                {cost.splitType === 'shared' && `◆ ${t('shared')}`}
                {cost.splitType === 'subset' && `◑ ${t('subset')}`}
                {cost.splitType === 'individual' && `◉ ${t('solo')}`}
              </button>
            </Tooltip>
          </div>
          {typeof document !== 'undefined' && createPortal(
            <div
              ref={splitPortalRef}
              id={splitOptionsId}
              className="popover split-popover"
              role="group"
              aria-label={t('splitTypeForCost', { name: cost.name, splitType: t(cost.splitType) })}
              hidden={!splitPopoverOpen || !splitPopoverPos}
              style={{
                position: 'fixed',
                top: splitPopoverPos?.top ?? 0,
                left: splitPopoverPos?.left ?? 0,
                display: splitPopoverOpen && splitPopoverPos ? 'flex' : 'none',
              }}
            >
              <button
                type="button"
                className={`popover-item ${cost.splitType === 'shared' ? 'selected' : ''}`}
                aria-pressed={cost.splitType === 'shared'}
                onClick={() => handleSplitChange('shared')}
              >
                ◆ {t('shared')}
              </button>
              <button
                type="button"
                className={`popover-item ${cost.splitType === 'subset' ? 'selected' : ''}`}
                aria-pressed={cost.splitType === 'subset'}
                onClick={() => handleSplitChange('subset')}
              >
                ◑ {t('subset')}
              </button>
              <button
                type="button"
                className={`popover-item ${cost.splitType === 'individual' ? 'selected' : ''}`}
                aria-pressed={cost.splitType === 'individual'}
                onClick={() => handleSplitChange('individual')}
              >
                ◉ {t('solo')}
              </button>
            </div>,
            document.body
          )}
        </div>
      </td>
      <td>
        <div className="couple-popover-container" ref={couplePopoverRef}>
          {cost.splitType === 'shared' ? (
            <span className="who-label">{t('allGroups')}</span>
          ) : (
            <Tooltip content={assignedGroupNames
              ? t('currentlyAssignedTo', { groups: assignedGroupNames })
              : t('chooseGroupsSharingCost')}>
              <button
                type="button"
                className="who-select"
                onClick={handleWhoDotsClick}
                aria-label={t('changeGroups', { name: cost.name })}
                aria-haspopup="dialog"
              >
                <span className="who-dots" aria-hidden="true">
                  {assignedDots?.map((couple) => (
                    <span
                      key={couple!.id}
                      className="who-dot"
                      style={{ backgroundColor: getColorThemeValue(couple!.colorIndex, theme) }}
                    />
                  ))}
                </span>
              </button>
            </Tooltip>
          )}
        </div>
      </td>
      <td>
        <CostTypePicker
          value={cost.type ?? null}
          onChange={(type) => editCost(cost.id, { type })}
          optionsId={`cost-${cost.id}-type-options`}
          label={t('changeCostType', { name: cost.name })}
          groupLabel={t('costTypeFor', { name: cost.name })}
        />
      </td>
      <td>
        <span className="total-num">{formatLocaleCurrency(totalWithMarkup, cost.currency)}</span>
      </td>
      <td>
        <div className="row-acts">
          <Tooltip content={t('editCost')}>
            <button type="button" className="ibtn" onClick={onEdit} aria-label={t('editNamedCost', { name: cost.name })}>
              <Pencil size={13} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content={t('duplicateCost')}>
            <button type="button" className="ibtn" onClick={onDuplicate} aria-label={t('duplicateNamedCost', { name: cost.name })}>
              <Copy size={13} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content={t('deleteCost')}>
            <button type="button" className="ibtn del" onClick={onDelete} aria-label={t('deleteNamedCost', { name: cost.name })}>
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>

      <SplitAssignmentModal
        open={splitModalOpen}
        mode={pendingSplitType}
        couples={couples}
        selectedCoupleIds={tempAssignedCouples}
        modalName={`solo-couple-${cost.id}`}
        onToggleCouple={handleToggleCoupleInModal}
        onConfirmSubset={handleConfirmSplitModal}
        onClose={handleCancelSplitModal}
        onCreateGroup={handleCreateGroupInModal}
      />
    </>
  );
}
