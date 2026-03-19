import { useState, useCallback, useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import CostRow from '../CostRow';
import EditRow from '../EditRow';
import BulkActionBar from '../BulkActionBar';
import Modal from '../Modal';
import { Plus } from 'lucide-react';
import type { SplitType } from '@/store/types';
import { getSaveFailureCopy, useToastStore } from '@/store/toastStore';

export default function CostLedger() {
  const rawCosts = useTripStore((s) => s.costs);
  const costs = useMemo(() => [...rawCosts].sort((a, b) => a.sortOrder - b.sortOrder), [rawCosts]);
  const addCost = useTripStore((s) => s.addCost);
  const editCost = useTripStore((s) => s.editCost);
  const deleteCost = useTripStore((s) => s.deleteCost);
  const reorderCosts = useTripStore((s) => s.reorderCosts);
  const bulkSetCurrency = useTripStore((s) => s.bulkSetCurrency);
  const pushToast = useToastStore((s) => s.pushToast);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkCurrency, setBulkCurrency] = useState('EUR');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const costIds = useMemo(() => costs.map((c) => c.id), [costs]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = costIds.indexOf(String(active.id));
        const newIndex = costIds.indexOf(String(over.id));
        const newOrder = [...costIds];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, String(active.id));
        reorderCosts(newOrder);
      }
    },
    [costIds, reorderCosts]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkApply = useCallback(
    (currency: string) => {
      bulkSetCurrency([...selectedIds], currency);
      setSelectedIds(new Set());
    },
    [selectedIds, bulkSetCurrency]
  );

  const handleAddSave = useCallback(
    (data: {
      name: string;
      currency: string;
      value: number;
      markupOverride: number | null;
      splitType: SplitType;
      assignedCoupleIds: string[];
    }) => {
      try {
        addCost(data);
        setIsAdding(false);
      } catch (error) {
        const toast = getSaveFailureCopy(error, 'new');
        pushToast(toast);
      }
    },
    [addCost, pushToast]
  );

  const handleEditSave = useCallback(
    (data: {
      name: string;
      currency: string;
      value: number;
      markupOverride: number | null;
      splitType: SplitType;
      assignedCoupleIds: string[];
    }) => {
      if (editingId) {
        try {
          editCost(editingId, data);
          setEditingId(null);
        } catch (error) {
          const toast = getSaveFailureCopy(error, 'edit');
          pushToast(toast);
        }
      }
    },
    [editingId, editCost, pushToast]
  );

  const costToDelete = costs.find((c) => c.id === deletingId);

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Cost Ledger</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>
            {costs.length} {costs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.size}
          onApply={handleBulkApply}
          onClear={() => setSelectedIds(new Set())}
          bulkCurrency={bulkCurrency}
          onBulkCurrencyChange={setBulkCurrency}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <table className="ledger">
            <thead>
              <tr>
                <th style={{ width: 26 }}></th>
                <th style={{ width: 26 }}></th>
                <th>Name</th>
                <th style={{ width: 60 }}>Cur.</th>
                <th style={{ width: 92 }}>Amount</th>
                <th style={{ width: 96 }}>Markup</th>
                <th style={{ width: 92 }}>Split</th>
                <th style={{ width: 60 }}>Who</th>
                <th style={{ width: 96 }}>Total</th>
                <th style={{ width: 58 }}></th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={costIds} strategy={verticalListSortingStrategy}>
                {costs.map((cost) =>
                  editingId === cost.id ? (
                    <EditRow
                      key={cost.id}
                      initial={cost}
                      onSave={handleEditSave}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <CostRow
                      key={cost.id}
                      cost={cost}
                      isSelected={selectedIds.has(cost.id)}
                      onToggleSelect={() => toggleSelect(cost.id)}
                      onEdit={() => setEditingId(cost.id)}
                      onDelete={() => setDeletingId(cost.id)}
                    />
                  )
                )}
              </SortableContext>

              {isAdding && (
                <EditRow
                  onSave={handleAddSave}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {!isAdding && (
                <tr className="add-row">
                  <td colSpan={10}>
                    <button className="add-row-btn" onClick={() => setIsAdding(true)}>
                      <Plus size={14} /> Add Cost Entry
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {deletingId && costToDelete && (
        <Modal
          icon="🗑️"
          title="Delete this cost?"
          body={`"${costToDelete.name}" will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteCost(deletingId);
            setDeletingId(null);
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(deletingId);
              return next;
            });
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  );
}
