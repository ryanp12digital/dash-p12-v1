"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

export type TableEditMetric = {
  key: string;
  label: string;
  locked?: boolean;
};

function SortableMetricRow({
  metric,
  checked,
  onToggle,
}: {
  metric: TableEditMetric;
  checked: boolean;
  onToggle: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: metric.key,
    disabled: metric.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2"
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={metric.locked}
        onChange={() => onToggle(metric.key)}
        className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] focus:ring-[#0729cf] disabled:opacity-60"
      />
      <span className="flex-1 truncate text-xs font-medium text-[#0f172a]">
        {metric.label}
        {metric.locked && <span className="ml-1 text-[10px] text-[#94a3b8]">(fixa)</span>}
      </span>
      <button
        type="button"
        disabled={metric.locked}
        {...attributes}
        {...listeners}
        className="rounded border border-[#e2e8f0] p-1 text-[#64748b] disabled:opacity-40"
        aria-label={`Arrastar ${metric.label}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function TableEditModal({
  open,
  title,
  metrics,
  order,
  hiddenKeys,
  onClose,
  onReset,
  onOrderChange,
  onToggleMetric,
  resultTypeOptions,
  selectedResultType,
  onResultTypeChange,
}: {
  open: boolean;
  title: string;
  metrics: TableEditMetric[];
  order: string[];
  hiddenKeys: string[];
  onClose: () => void;
  onReset: () => void;
  onOrderChange: (next: string[]) => void;
  onToggleMetric: (key: string) => void;
  resultTypeOptions?: { value: string; label: string }[];
  selectedResultType?: string;
  onResultTypeChange?: (value: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const orderedMetrics = useMemo(() => {
    const map = new Map(metrics.map((m) => [m.key, m]));
    return [...order.filter((k) => map.has(k)).map((k) => map.get(k)!), ...metrics.filter((m) => !order.includes(m.key))];
  }, [metrics, order]);

  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onOrderChange(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0f172a]/40 p-4">
      <div className="w-full max-w-[900px] rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3 sm:px-6">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
            <p className="text-[11px] text-[#64748b]">Arraste para reordenar e selecione as métricas visíveis.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {resultTypeOptions && selectedResultType && onResultTypeChange && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Tipo de resultado
              </label>
              <select
                value={selectedResultType}
                onChange={(e) => onResultTypeChange(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-[#0729cf]/20"
              >
                {resultTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedMetrics.map((m) => m.key)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2 sm:grid-cols-2">
                {orderedMetrics.map((metric) => (
                  <SortableMetricRow
                    key={metric.key}
                    metric={metric}
                    checked={!hiddenKeys.includes(metric.key)}
                    onToggle={onToggleMetric}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center justify-between border-t border-[#f1f5f9] px-4 py-3 sm:px-6">
          <button type="button" onClick={onReset} className="text-xs font-semibold text-[#0729cf] hover:underline">
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0729cf] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0621a8]"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

