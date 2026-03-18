import { useMemo, useState, useRef, useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import { getEffectiveMarkup, getCostWithMarkup, formatCurrency, validateCost } from '@/lib/calculations';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, GripVertical, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { CostEntry, SplitType } from '@/store/types';
import { getAvailableCurrencies } from '@/store/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SplitAssignmentModal from './SplitAssignmentModal';

interface CostRowProps {
  cost: CostEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CostRow({ cost, isSelected, onToggleSelect, onEdit, onDelete }: CostRowProps) {
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const region = useTripStore((s) => s.region);
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
  const [pendingSplitType, setPendingSplitType] = useState<SplitType | null>(null);
  const [tempAssignedCouples, setTempAssignedCouples] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const splitPopoverRef = useRef<HTMLDivElement>(null);
  const splitBtnRef = useRef<HTMLButtonElement>(null);
  const splitPortalRef = useRef<HTMLDivElement>(null);
  const [splitPopoverPos, setSplitPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const couplePopoverRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cost.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const effectiveMarkup = getEffectiveMarkup(cost, globalMarkup);
  const totalWithMarkup = getCostWithMarkup(cost, globalMarkup);
  const isCustomMarkup = cost.markupOverride !== null;
  const validation = validateCost(cost);
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);

  const assignedDots = useMemo(() => {
    if (cost.splitType === 'shared') return null;
    return cost.assignedCoupleIds
      .map((id) => couples.find((c) => c.id === id))
      .filter(Boolean);
  }, [cost.splitType, cost.assignedCoupleIds, couples]);

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
    if (pendingSplitType && tempAssignedCouples.length > 0) {
      editCost(cost.id, {
        splitType: pendingSplitType,
        assignedCoupleIds: tempAssignedCouples,
      });
      setSplitModalOpen(false);
      setPendingSplitType(null);
    }
  };

  // Cancel modal (revert)
  const handleCancelSplitModal = () => {
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
        <span className={`drag-h${isDragging ? ' dragging' : ''}`} {...attributes} {...listeners}>
          <GripVertical size={15} />
        </span>
      </td>
      <td>
        <div
          className={`chk${isSelected ? ' on' : ''}`}
          onClick={onToggleSelect}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          onKeyDown={(e) => e.key === ' ' && onToggleSelect()}
        >
          {isSelected && '✓'}
        </div>
      </td>
      <td onClick={() => editingField !== 'name' && handleNameEdit()}>
        {editingField === 'name' ? (
          <input
            ref={nameInputRef}
            className="inline-edit-input"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <span className="cost-name" title={cost.name}>{cost.name}</span>
        )}
      </td>
      <td>
        <select
          className="cur-select"
          value={cost.currency}
          onChange={(e) => editCost(cost.id, { currency: e.target.value })}
        >
          {getAvailableCurrencies(region).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td onClick={() => editingField !== 'amount' && handleAmountEdit()}>
        {editingField === 'amount' ? (
          <input
            ref={amountInputRef}
            className="inline-edit-input mono"
            type="number"
            step="0.01"
            min="0"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            onBlur={handleAmountSave}
            onKeyDown={handleAmountKeyDown}
          />
        ) : (
          <span className="amt">{cost.value.toFixed(2)}</span>
        )}
      </td>
      <td>
        <div className="markup-inline">
          <button
            className="arrow-btn left"
            onClick={() => handleMarkupArrow('left')}
            title="Decrease markup"
          >
            <ChevronLeft size={12} />
          </button>
          <input
            className="markup-input mono"
            type="number"
            step="1"
            min="0"
            value={effectiveMarkup}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleMarkupChange(val);
            }}
            title={`${isCustomMarkup ? 'Custom' : 'Global'} markup: ${effectiveMarkup}%`}
            style={{
              backgroundColor: 
                effectiveMarkup < globalMarkup
                  ? 'var(--markup-below)'
                  : effectiveMarkup > globalMarkup
                  ? 'var(--markup-above)'
                  : 'var(--markup-equal)',
            }}
          />
          <button
            className="arrow-btn right"
            onClick={() => handleMarkupArrow('right')}
            title="Increase markup"
          >
            <ChevronRight size={12} />
          </button>
          <button
            className="reset-markup-btn"
            onClick={() => handleMarkupChange(globalMarkup)}
            title="Reset to global markup"
          >
            r
          </button>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!validation.isValid && (
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              onMouseEnter={() => setShowErrorTooltip(true)}
              onMouseLeave={() => setShowErrorTooltip(false)}
            >
              <AlertCircle size={16} color="#f97316" style={{ cursor: 'help', display: 'block' }} />
              {showErrorTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    marginBottom: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#1f2937',
                    color: '#f97316',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    border: '1px solid #f97316',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {validation.errorMessage}
                </div>
              )}
            </div>
          )}
          <div className="split-popover-container" ref={splitPopoverRef}>
            <button
              ref={splitBtnRef}
              className={`split split-${cost.splitType}`}
              onClick={() => {
                if (!splitPopoverOpen && splitBtnRef.current) {
                  const rect = splitBtnRef.current.getBoundingClientRect();
                  setSplitPopoverPos({ top: rect.bottom + 4, left: rect.left });
                }
                setSplitPopoverOpen(!splitPopoverOpen);
              }}
              title="Change split type"
            >
              {cost.splitType === 'shared' && '◆ Shared'}
              {cost.splitType === 'subset' && '◑ Subset'}
              {cost.splitType === 'individual' && '◉ Solo'}
            </button>
          </div>
          {splitPopoverOpen && splitPopoverPos && createPortal(
            <div
              ref={splitPortalRef}
              className="popover split-popover"
              style={{ position: 'fixed', top: splitPopoverPos.top, left: splitPopoverPos.left }}
            >
              <button
                className={`popover-item ${cost.splitType === 'shared' ? 'selected' : ''}`}
                onClick={() => handleSplitChange('shared')}
              >
                ◆ Shared
              </button>
              <button
                className={`popover-item ${cost.splitType === 'subset' ? 'selected' : ''}`}
                onClick={() => handleSplitChange('subset')}
              >
                ◑ Subset
              </button>
              <button
                className={`popover-item ${cost.splitType === 'individual' ? 'selected' : ''}`}
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
            <div
              className="who-dots"
              onClick={handleWhoDotsClick}
              style={{ cursor: (cost.splitType === 'subset' || cost.splitType === 'individual') ? 'pointer' : 'auto' }}
            >
              {assignedDots?.map((c) => (
                <span
                  key={c!.id}
                  className="who-dot"
                  style={{ background: `var(--c${c!.colorIndex})` }}
                  title={c!.name}
                />
              ))}
            </div>
          )}
        </div>
      </td>
      <td>
        <span className="total-num">{formatCurrency(totalWithMarkup, cost.currency)}</span>
      </td>
      <td>
        <div className="row-acts">
          <button className="ibtn" onClick={onEdit} aria-label="Edit cost">
            <Pencil size={13} />
          </button>
          <button className="ibtn del" onClick={onDelete} aria-label="Delete cost">
            <Trash2 size={13} />
          </button>
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
