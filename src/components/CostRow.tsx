import { useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import { getEffectiveMarkup, getCostWithMarkup, formatCurrency } from '@/lib/calculations';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import type { CostEntry } from '@/store/types';
import { CURRENCIES } from '@/store/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CostRowProps {
  cost: CostEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CostRow({ cost, isSelected, onToggleSelect, onEdit, onDelete }: CostRowProps) {
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const couples = useTripStore((s) => s.couples);
  const editCost = useTripStore((s) => s.editCost);

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

  const assignedDots = useMemo(() => {
    if (cost.splitType === 'shared') return null;
    return cost.assignedCoupleIds
      .map((id) => couples.find((c) => c.id === id))
      .filter(Boolean);
  }, [cost.splitType, cost.assignedCoupleIds, couples]);

  return (
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
      <td><span className="cost-name">{cost.name}</span></td>
      <td>
        <select
          className="cur-select"
          value={cost.currency}
          onChange={(e) => editCost(cost.id, { currency: e.target.value })}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td><span className="amt">{cost.value.toFixed(2)}</span></td>
      <td>
        <span className={`mk-tag ${isCustomMarkup ? 'mk-custom' : 'mk-global'}`}>
          {effectiveMarkup}% {isCustomMarkup ? '✦' : '(g)'}
        </span>
      </td>
      <td>
        {cost.splitType === 'shared' && <span className="split split-shared">◆ Shared</span>}
        {cost.splitType === 'subset' && <span className="split split-subset">◑ Subset</span>}
        {cost.splitType === 'individual' && <span className="split split-solo">◉ Solo</span>}
      </td>
      <td>
        {cost.splitType === 'shared' ? (
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>All</span>
        ) : (
          <div className="who-dots">
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
  );
}
