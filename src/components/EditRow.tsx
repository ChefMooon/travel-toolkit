import { useState, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { useToastStore } from '@/store/toastStore';
import { getAvailableCurrencies } from '@/store/types';
import type { SplitType } from '@/store/types';

interface EditRowProps {
  initial?: {
    id: string;
    name: string;
    currency: string;
    value: number;
    markupOverride: number | null;
    splitType: SplitType;
    assignedCoupleIds: string[];
  };
  onSave: (data: {
    name: string;
    currency: string;
    value: number;
    markupOverride: number | null;
    splitType: SplitType;
    assignedCoupleIds: string[];
  }) => void;
  onCancel: () => void;
}

export default function EditRow({ initial, onSave, onCancel }: EditRowProps) {
  const couples = useTripStore((s) => s.couples);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const region = useTripStore((s) => s.region);
  const pushToast = useToastStore((s) => s.pushToast);

  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [value, setValue] = useState(initial?.value?.toString() ?? '');
  const [useGlobalMarkup, setUseGlobalMarkup] = useState(initial?.markupOverride === null || initial?.markupOverride === undefined);
  const [markupOverride, setMarkupOverride] = useState(
    initial?.markupOverride !== null && initial?.markupOverride !== undefined
      ? String(initial.markupOverride)
      : String(globalMarkup)
  );
  const [splitType, setSplitType] = useState<SplitType>(initial?.splitType ?? 'shared');
  const [assignedCoupleIds, setAssignedCoupleIds] = useState<string[]>(
    initial?.assignedCoupleIds ?? []
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
    });
  }, [name, currency, value, useGlobalMarkup, markupOverride, splitType, assignedCoupleIds, onSave, pushToast]);

  const toggleCouple = (id: string) => {
    if (splitType === 'individual') {
      setAssignedCoupleIds([id]);
    } else {
      setAssignedCoupleIds((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      );
    }
  };

  return (
    <tr className="edit-row">
      <td colSpan={10}>
        <div className="edit-grid">
          <div className="ef">
            <label className="ef-lbl">Name</label>
            <input
              className="ef-inp"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hotel Night 1"
              autoFocus
            />
          </div>
          <div className="ef">
            <label className="ef-lbl">Currency</label>
            <select
              className="ef-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {getAvailableCurrencies(region).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="ef">
            <label className="ef-lbl">Amount</label>
            <input
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
            <label className="ef-lbl">Split</label>
            <div className="seg">
              <button
                className={`seg-btn${splitType === 'shared' ? ' on' : ''}`}
                onClick={() => setSplitType('shared')}
                type="button"
              >
                All
              </button>
              <button
                className={`seg-btn${splitType === 'subset' ? ' on' : ''}`}
                onClick={() => setSplitType('subset')}
                type="button"
              >
                Subset
              </button>
              <button
                className={`seg-btn${splitType === 'individual' ? ' on' : ''}`}
                onClick={() => setSplitType('individual')}
                type="button"
              >
                Solo
              </button>
            </div>
          </div>
          <div className="edit-acts">
            <button className="btn-save" onClick={handleSave} type="button">Save</button>
            <button className="btn-cancel" onClick={onCancel} type="button">✕</button>
          </div>
        </div>

        <div className="markup-row">
          <label>
            <input
              type="checkbox"
              checked={useGlobalMarkup}
              onChange={(e) => setUseGlobalMarkup(e.target.checked)}
            />
            Use global markup ({globalMarkup}%)
          </label>
          {!useGlobalMarkup && (
            <>
              <input
                className="ef-inp mono"
                type="number"
                step="0.1"
                min="0"
                value={markupOverride}
                onChange={(e) => setMarkupOverride(e.target.value)}
                style={{ width: 70, padding: '3px 7px', fontSize: 12 }}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => {
                  setMarkupOverride(String(globalMarkup));
                  setUseGlobalMarkup(true);
                }}
                style={{
                  padding: '3px 7px',
                  fontSize: 12,
                  marginLeft: '5px',
                  cursor: 'pointer',
                  background: 'var(--btn-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                }}
              >
                Reset
              </button>
            </>
          )}
        </div>

        {(splitType === 'subset' || splitType === 'individual') && couples.length > 0 && (
          <div className="subset-picks" style={{ marginTop: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'var(--text-3)',
            }}>
              {splitType === 'individual' ? 'Assign to:' : 'Include:'}
            </span>
            {couples.map((c) => (
              <label key={c.id}>
                <input
                  type={splitType === 'individual' ? 'radio' : 'checkbox'}
                  name="couple-assign"
                  checked={assignedCoupleIds.includes(c.id)}
                  onChange={() => toggleCouple(c.id)}
                />
                <span style={{ color: `var(--c${c.colorIndex})`, fontWeight: 700 }}>
                  ● {c.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
