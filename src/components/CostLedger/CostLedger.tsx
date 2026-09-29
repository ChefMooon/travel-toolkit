import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { getAvailableCurrencies, getDefaultCurrency, type SplitType, MAX_COST_ENTRIES } from '@/store/types';
import { getSaveFailureCopy, useToastStore } from '@/store/toastStore';

export default function CostLedger() {
  const rawCosts = useTripStore((s) => s.costs);
  const costs = useMemo(() => [...rawCosts].sort((a, b) => a.sortOrder - b.sortOrder), [rawCosts]);
  const addCost = useTripStore((s) => s.addCost);
  const duplicateCost = useTripStore((s) => s.duplicateCost);
  const editCost = useTripStore((s) => s.editCost);
  const deleteCost = useTripStore((s) => s.deleteCost);
  const deleteCosts = useTripStore((s) => s.deleteCosts);
  const reorderCosts = useTripStore((s) => s.reorderCosts);
  const bulkSetCurrency = useTripStore((s) => s.bulkSetCurrency);
  const region = useTripStore((s) => s.region);
  const pushToast = useToastStore((s) => s.pushToast);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkCurrency, setBulkCurrency] = useState('EUR');
  const [defaultEntryCurrency, setDefaultEntryCurrency] = useState(() => getDefaultCurrency(region));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const costIds = useMemo(() => costs.map((c) => c.id), [costs]);
  const availableBulkCurrencies = useMemo(() => getAvailableCurrencies(region), [region]);

  useEffect(() => {
    const defaultCurrency = getDefaultCurrency(region);
    if (!defaultCurrency) return;

    if (!availableBulkCurrencies.includes(bulkCurrency)) {
      setBulkCurrency(defaultCurrency);
    }
    if (!availableBulkCurrencies.includes(defaultEntryCurrency)) {
      setDefaultEntryCurrency(defaultCurrency);
    }
  }, [availableBulkCurrencies, bulkCurrency, defaultEntryCurrency, region]);

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

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleOpenBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeletingId(null);
    setIsBulkDeleteOpen(true);
  }, [selectedIds]);

  const handleConfirmBulkDelete = useCallback(() => {
    const idsToDelete = [...selectedIds];
    if (idsToDelete.length === 0) {
      setIsBulkDeleteOpen(false);
      return;
    }

    deleteCosts(idsToDelete);
    setIsBulkDeleteOpen(false);
    setSelectedIds(new Set());

    if (editingId && idsToDelete.includes(editingId)) {
      setEditingId(null);
    }

    if (deletingId && idsToDelete.includes(deletingId)) {
      setDeletingId(null);
    }
  }, [deleteCosts, deletingId, editingId, selectedIds]);

  const handleAddSave = useCallback(
    (data: {
      name: string;
      currency: string;
      value: number;
      markupOverride: number | null;
      splitType: SplitType;
      assignedCoupleIds: string[];
      type: string | null;
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

  const handleDuplicate = useCallback(
    (id: string) => {
      try {
        duplicateCost(id);
      } catch (error) {
        const toast = getSaveFailureCopy(error, 'new');
        pushToast(toast);
      }
    },
    [duplicateCost, pushToast]
  );

  const handleEditSave = useCallback(
    (data: {
      name: string;
      currency: string;
      value: number;
      markupOverride: number | null;
      splitType: SplitType;
      assignedCoupleIds: string[];
      type: string | null;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 id="cost-ledger-heading" className="card-title">Cost Ledger</h2>
            <span aria-hidden="true" style={{ color: 'var(--text-3)', fontWeight: 700 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>
              {costs.length} {costs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label
              htmlFor="default-entry-currency-select"
              style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}
            >
              Default currency
            </label>
            <select
              id="default-entry-currency-select"
              data-testid="default-entry-currency-select"
              className="tool-input"
              style={{ width: 'auto', fontSize: 12, padding: '2px 8px', lineHeight: 1.1, minHeight: 28 }}
              value={defaultEntryCurrency}
              onChange={(e) => setDefaultEntryCurrency(e.target.value)}
            >
              {availableBulkCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.size}
          onApply={handleBulkApply}
          onDeleteSelected={handleOpenBulkDelete}
          onClear={handleClearSelection}
          bulkCurrency={bulkCurrency}
          onBulkCurrencyChange={setBulkCurrency}
          currencies={availableBulkCurrencies}
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
                  <th scope="col" style={{ width: 26 }}><span className="sr-only">Reorder cost</span></th>
                  <th scope="col" style={{ width: 26 }}><span className="sr-only">Select cost</span></th>
                  <th scope="col">Name</th>
                  <th scope="col" style={{ width: 60 }}>Cur.</th>
                  <th scope="col" style={{ width: 92 }}>Amount</th>
                  <th scope="col" style={{ width: 96 }}>Markup</th>
                  <th scope="col" style={{ width: 92 }}>Split</th>
                  <th scope="col" style={{ width: 60 }}>Who</th>
                  <th scope="col" style={{ width: 48 }}>Type</th>
                  <th scope="col" style={{ width: 96 }}>Total</th>
                  <th scope="col" style={{ width: 90 }}><span className="sr-only">Actions</span></th>
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
                      onDuplicate={() => handleDuplicate(cost.id)}
                      onDelete={() => {
                        setIsBulkDeleteOpen(false);
                        setDeletingId(cost.id);
                      }}
                    />
                  )
                )}
              </SortableContext>

              {isAdding && (
                <EditRow
                  defaultCurrency={defaultEntryCurrency}
                  onSave={handleAddSave}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {!isAdding && (
                <tr className="add-row">
                  <td colSpan={11}>
                    <button className="add-row-btn" onClick={() => setIsAdding(true)} disabled={costs.length >= MAX_COST_ENTRIES}>
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

            if (editingId === deletingId) {
              setEditingId(null);
            }
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {isBulkDeleteOpen && selectedIds.size > 0 && (
        <Modal
          icon="🗑️"
          title={selectedIds.size === 1 ? 'Delete selected cost?' : 'Delete selected costs?'}
          body={
            selectedIds.size === 1
              ? 'The selected cost entry will be permanently removed. This action cannot be undone.'
              : `${selectedIds.size} selected cost entries will be permanently removed. This action cannot be undone.`
          }
          confirmLabel="Delete Selected"
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setIsBulkDeleteOpen(false)}
        />
      )}
    </>
  );
}
