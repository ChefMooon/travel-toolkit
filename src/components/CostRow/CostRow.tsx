import { useMemo, useState, useRef, useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import { getEffectiveMarkup, getCostWithMarkup, formatCurrency, validateCost } from '@/lib/calculations';
import { createPortal } from 'react-dom';
import { Pencil, Copy, Trash2, GripVertical, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { CostEntry, SplitType } from '@/store/types';
import { getAvailableCurrencies, getColorThemeValue, COST_ENTRY_TYPES } from '@/store/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SplitAssignmentModal from '../SplitAssignmentModal';
import Tooltip from '@/components/Tooltip';

interface CostRowProps {
  cost: CostEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function CostRow({ cost, isSelected, onToggleSelect, onEdit, onDuplicate, onDelete }: CostRowProps) {
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const region = useTripStore((s) => s.region);
  const theme = useTripStore((s) => s.theme);
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
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [typePopoverPos, setTypePopoverPos] = useState<{ top: number; left: number } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const splitPopoverRef = useRef<HTMLDivElement>(null);
  const splitBtnRef = useRef<HTMLButtonElement>(null);
  const splitPortalRef = useRef<HTMLDivElement>(null);
  const [splitPopoverPos, setSplitPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const couplePopoverRef = useRef<HTMLDivElement>(null);
  const typeBtnRef = useRef<HTMLButtonElement>(null);
  const typePortalRef = useRef<HTMLDivElement>(null);

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
  const typeOptionsId = `cost-${cost.id}-type-options`;

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
      if (
        typeBtnRef.current && !typeBtnRef.current.contains(e.target as Node) &&
        (!typePortalRef.current || !typePortalRef.current.contains(e.target as Node))
      ) {
        setTypePopoverOpen(false);
      }
    };
    if (splitPopoverOpen || couplePopoverOpen || typePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [splitPopoverOpen, couplePopoverOpen, typePopoverOpen, cost.splitType, cost.assignedCoupleIds, previousSplitType, cost.id, editCost, previousAssignedCouples]);

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

  // Handle type change
  const handleTypeChange = (typeId: string | null) => {
    editCost(cost.id, { type: typeId });
    setTypePopoverOpen(false);
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
          aria-label={`Reorder ${cost.name}`}
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
          aria-label={`Select ${cost.name}`}
        />
      </td>
      <td>
        {editingField === 'name' ? (
          <input
            ref={nameInputRef}
            className="inline-edit-input"
            type="text"
            value={editName}
            aria-label={`Cost name for ${cost.name}`}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <Tooltip content={cost.name}>
            <button
              type="button"
              className="cost-name cell-edit-trigger"
              aria-label={`Edit name for ${cost.name}`}
              onClick={handleNameEdit}
            >
              {cost.name}
            </button>
          </Tooltip>
        )}
      </td>
      <td>
        <select
          className="cur-select"
          aria-label={`Currency for ${cost.name}`}
          value={cost.currency}
          onChange={(e) => editCost(cost.id, { currency: e.target.value })}
        >
          {getAvailableCurrencies(region).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td>
        {editingField === 'amount' ? (
          <input
            ref={amountInputRef}
            className="inline-edit-input mono"
            type="number"
            step="0.01"
            min="0"
            value={editAmount}
            aria-label={`Amount for ${cost.name}`}
            onChange={(e) => setEditAmount(e.target.value)}
            onBlur={handleAmountSave}
            onKeyDown={handleAmountKeyDown}
          />
        ) : (
          <button
            type="button"
            className="amt cell-edit-trigger"
            aria-label={`Edit amount for ${cost.name}`}
            onClick={handleAmountEdit}
          >
            {cost.value.toFixed(2)}
          </button>
        )}
      </td>
      <td>
        <div className="markup-inline">
          <Tooltip content="Decrease markup">
            <button
              className="arrow-btn left"
              onClick={() => handleMarkupArrow('left')}
              aria-label="Decrease markup"
            >
              <ChevronLeft size={12} />
            </button>
          </Tooltip>
          <Tooltip content={`${isCustomMarkup ? 'Custom' : 'Global'} markup: ${effectiveMarkup}%`}>
            <input
              className="markup-input mono"
              type="number"
              step="1"
              min="0"
              value={effectiveMarkup}
              aria-label={`${isCustomMarkup ? 'Custom' : 'Global'} markup: ${effectiveMarkup}%`}
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
          <Tooltip content="Increase markup">
            <button
              className="arrow-btn right"
              onClick={() => handleMarkupArrow('right')}
              aria-label="Increase markup"
            >
              <ChevronRight size={12} />
            </button>
          </Tooltip>
          <Tooltip content="Reset to global markup">
            <button
              className="reset-markup-btn"
              type="button"
              onClick={() => handleMarkupChange(globalMarkup)}
              aria-label={`Reset markup for ${cost.name} to global markup`}
            >
              r
            </button>
          </Tooltip>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!validation.isValid && (
            <Tooltip content={validation.errorMessage ?? 'Invalid cost'}>
              <span
                role="img"
                aria-label="Invalid cost"
                tabIndex={0}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <AlertCircle size={16} color="#f97316" style={{ cursor: 'help', display: 'block' }} />
              </span>
            </Tooltip>
          )}
          <div className="split-popover-container" ref={splitPopoverRef}>
            <Tooltip content="Change split type">
              <button
                ref={splitBtnRef}
                className={`split split-${cost.splitType}`}
                type="button"
                aria-expanded={splitPopoverOpen}
                aria-controls={splitOptionsId}
                aria-label={`Change split type for ${cost.name}; current split: ${cost.splitType}`}
                onClick={() => {
                  if (!splitPopoverOpen && splitBtnRef.current) {
                    const rect = splitBtnRef.current.getBoundingClientRect();
                    setSplitPopoverPos({ top: rect.bottom + 4, left: rect.left });
                  }
                  setSplitPopoverOpen(!splitPopoverOpen);
                }}
              >
                {cost.splitType === 'shared' && '◆ Shared'}
                {cost.splitType === 'subset' && '◑ Subset'}
                {cost.splitType === 'individual' && '◉ Solo'}
              </button>
            </Tooltip>
          </div>
          {typeof document !== 'undefined' && createPortal(
            <div
              ref={splitPortalRef}
              id={splitOptionsId}
              className="popover split-popover"
              role="group"
              aria-label={`Split type for ${cost.name}`}
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
                ◆ Shared
              </button>
              <button
                type="button"
                className={`popover-item ${cost.splitType === 'subset' ? 'selected' : ''}`}
                aria-pressed={cost.splitType === 'subset'}
                onClick={() => handleSplitChange('subset')}
              >
                ◑ Subset
              </button>
              <button
                type="button"
                className={`popover-item ${cost.splitType === 'individual' ? 'selected' : ''}`}
                aria-pressed={cost.splitType === 'individual'}
                onClick={() => handleSplitChange('individual')}
              >
                ◉ Solo
              </button>
            </div>,
            document.body
          )}
        </div>
      </td>
      <td>
        <div className="couple-popover-container" ref={couplePopoverRef}>
          {cost.splitType === 'shared' ? (
            <span className="who-label">All</span>
          ) : (
            <Tooltip content={assignedGroupNames
              ? `Currently assigned to: ${assignedGroupNames}`
              : 'Choose which groups share this cost'}>
              <button
                type="button"
                className="who-select"
                onClick={handleWhoDotsClick}
                aria-label={`Change assigned groups for ${cost.name}`}
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
        <div className="type-popover-container">
          <Tooltip content="Change type">
            <button
              ref={typeBtnRef}
              className="type-trigger-btn"
              type="button"
              aria-label={`Change type for ${cost.name}${typeEntry ? `; current type: ${typeEntry.type_name}` : '; no type selected'}`}
              aria-expanded={typePopoverOpen}
              aria-controls={typeOptionsId}
              onClick={() => {
                if (!typePopoverOpen && typeBtnRef.current) {
                  const rect = typeBtnRef.current.getBoundingClientRect();
                  setTypePopoverPos({ top: rect.bottom + 4, left: Math.max(8, rect.left - 60) });
                }
                setTypePopoverOpen(!typePopoverOpen);
              }}
            >
              {typeEntry ? typeEntry.symbol : '·'}
            </button>
          </Tooltip>
        </div>
        {typeof document !== 'undefined' && createPortal(
          <div
            ref={typePortalRef}
            id={typeOptionsId}
            className="popover split-popover"
            role="group"
            aria-label={`Cost type for ${cost.name}`}
            hidden={!typePopoverOpen || !typePopoverPos}
            style={{
              position: 'fixed',
              top: typePopoverPos?.top ?? 0,
              left: typePopoverPos?.left ?? 0,
              minWidth: 150,
              display: typePopoverOpen && typePopoverPos ? 'flex' : 'none',
            }}
          >
            <button
              type="button"
              className={`popover-item${!cost.type ? ' selected' : ''}`}
              aria-pressed={!cost.type}
              onClick={() => handleTypeChange(null)}
            >
              ✕ None
            </button>
            {COST_ENTRY_TYPES.map((t) => {
              const isSel = cost.type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="popover-item"
                  aria-pressed={isSel}
                  style={{
                    backgroundColor: isSel ? t.color + '33' : t.color + '20',
                    color: isSel ? t.color : undefined,
                    fontWeight: isSel ? 800 : undefined,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.color + '40'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSel ? t.color + '33' : t.color + '20'; }}
                  onClick={() => handleTypeChange(t.id)}
                >
                  {t.symbol} {t.type_name}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </td>
      <td>
        <span className="total-num">{formatCurrency(totalWithMarkup, cost.currency)}</span>
      </td>
      <td>
        <div className="row-acts">
          <Tooltip content="Edit this cost">
            <button type="button" className="ibtn" onClick={onEdit} aria-label={`Edit ${cost.name}`}>
              <Pencil size={13} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Duplicate this cost">
            <button type="button" className="ibtn" onClick={onDuplicate} aria-label={`Duplicate ${cost.name}`}>
              <Copy size={13} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Delete this cost">
            <button type="button" className="ibtn del" onClick={onDelete} aria-label={`Delete ${cost.name}`}>
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
