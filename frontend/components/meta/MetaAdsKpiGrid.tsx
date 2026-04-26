"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  SlidersHorizontal,
  X,
  Expand,
  MinusSquare,
  GripVertical,
} from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { metaKpiRows, type MetaKpiRow } from "@/lib/meta-ads-data";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { DASHBOARD_SECTION_STACK_CLASS } from "@/lib/dashboard-layout";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const cardHover = "transition-[border-color,box-shadow] duration-200 ease-out";

function trendVisual(row: MetaKpiRow): "good" | "bad" | "neutral" {
  if (!row.showTrend || row.goodWhen === "neutral") return "neutral";
  if (row.changePct != null && row.changePct === 0 && row.changeAbs == null) return "neutral";
  if (row.goodWhen === "higher") {
    if (row.changePct != null) return row.changePct > 0 ? "good" : row.changePct < 0 ? "bad" : "neutral";
    if (row.changeAbs != null) return row.changeAbs > 0 ? "good" : row.changeAbs < 0 ? "bad" : "neutral";
  }
  if (row.goodWhen === "lower") {
    if (row.changePct != null) return row.changePct < 0 ? "good" : row.changePct > 0 ? "bad" : "neutral";
    if (row.changeAbs != null) return row.changeAbs < 0 ? "good" : row.changeAbs > 0 ? "bad" : "neutral";
  }
  return "neutral";
}

/** Direção numérica da variação (ícone), independente de ser “bom” ou “ruim” para a métrica. */
function changeDirection(row: MetaKpiRow): "up" | "down" | "flat" {
  if (row.changePct != null) {
    if (row.changePct > 0) return "up";
    if (row.changePct < 0) return "down";
    return "flat";
  }
  if (row.changeAbs != null) {
    if (row.changeAbs > 0) return "up";
    if (row.changeAbs < 0) return "down";
    return "flat";
  }
  return "flat";
}

function MetaKpiCard({ row, i, wide }: { row: MetaKpiRow; i: number; wide: boolean }) {
  const { t, intlLocale, formatDisplayCurrencyAmount, formatCount } = useDashboardSettings();
  const tv = trendVisual(row);
  const dir = changeDirection(row);

  const pillClass =
    tv === "good"
      ? "bg-emerald-950/50 text-emerald-200 ring-1 ring-emerald-800/55 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
      : tv === "bad"
        ? "bg-red-950/45 text-red-200 ring-1 ring-red-900/50 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
        : "bg-neutral-800/55 text-neutral-400 ring-1 ring-neutral-700/70";

  let main = "";
  if (row.kind === "money") {
    main = formatDisplayCurrencyAmount(row.current, { maximumFractionDigits: 2 });
  } else if (row.kind === "count" || row.kind === "plain") {
    main = formatCount(row.current, { compact: false });
  } else if (row.kind === "percent") {
    main = `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.current)}%`;
  } else if (row.kind === "ratio") {
    main = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.current);
  }

  const prevFormatted =
    row.prev != null
      ? row.kind === "money"
        ? formatDisplayCurrencyAmount(row.prev, { maximumFractionDigits: 2 })
        : row.kind === "percent"
          ? `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.prev)}%`
          : row.kind === "ratio"
            ? new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.prev)
            : formatCount(row.prev, { compact: false })
      : "";

  const changePctStr =
    row.changePct != null
      ? `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2, signDisplay: "always" }).format(row.changePct)}%`
      : null;
  const changeAbsStr =
    row.changeAbs != null
      ? new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0, signDisplay: "always" }).format(row.changeAbs)
      : null;

  const wideClass = wide ? "lg:col-span-2" : "";
  const hasTrend = row.showTrend && (changePctStr != null || changeAbsStr != null);
  const showPrev = row.prev != null && row.showTrend;

  return (
    <div
      className={`group relative flex min-h-[164px] flex-col justify-between overflow-hidden dashboard-card p-5 ${cardHover} ${wideClass}`}
      style={{
        animation: `metaKpiUp 0.4s ease both`,
        animationDelay: `${i * 28}ms`,
      }}
    >
      <div className="mb-4 flex items-start justify-center gap-1.5">
        <h3 className="min-w-0 flex-1 truncate text-center text-xs font-medium leading-snug tracking-widest text-(--text-muted) uppercase">
          {t(row.labelKey)}
        </h3>
      </div>

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-4xl leading-none font-light tracking-tight text-(--text-primary)">{main}</p>
        <span
          className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass}`}
          style={{ visibility: hasTrend ? "visible" : "hidden" }}
          aria-hidden={!hasTrend}
          title={
            hasTrend
              ? tv === "good"
                ? t("meta.trendGoodHint")
                : tv === "bad"
                  ? t("meta.trendBadHint")
                  : undefined
              : undefined
          }
        >
          {dir === "up" && <TrendingUp className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />}
          {dir === "down" && <TrendingDown className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />}
          {dir === "flat" && <Minus className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
          {changePctStr ?? changeAbsStr}
        </span>
      </div>

      <p className="mt-3 text-xs text-(--text-secondary)" style={{ visibility: showPrev ? "visible" : "hidden" }}>
        <span className="font-medium text-(--text-muted)">{t("meta.prevPeriodLine")} </span>
        {prevFormatted}
      </p>
    </div>
  );
}

function SortableMetaKpiCard({
  row,
  i,
  wide,
}: {
  row: MetaKpiRow;
  i: number;
  wide: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="group relative"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="absolute top-2 right-2 z-10 cursor-grab touch-none rounded-md p-0.5 text-[#cbd5e1] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Arrastar card"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <MetaKpiCard row={row} i={i} wide={wide} />
    </div>
  );
}

export default function MetaAdsKpiGrid() {
  const { kpiRows, selectedAccountId } = useMetaAdsData();
  const { t } = useDashboardSettings();

  const allIds = useMemo(() => metaKpiRows.map((r) => r.id), []);
  const storageKey = `p12-meta-kpi-layout-v1:${selectedAccountId ?? "global"}`;

  const [selectedIds, setSelectedIds] = useState<string[]>(allIds);
  const [wideById, setWideById] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const r of metaKpiRows) {
      map[r.id] = Boolean(r.wide);
    }
    return map;
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [moveAnim, setMoveAnim] = useState<{ id: string; dir: "up" | "down" } | null>(null);
  const moveAnimTimeoutRef = useRef<number | null>(null);

  const triggerMoveAnim = (id: string, dir: "up" | "down") => {
    setMoveAnim({ id, dir });
    if (moveAnimTimeoutRef.current) window.clearTimeout(moveAnimTimeoutRef.current);
    moveAnimTimeoutRef.current = window.setTimeout(() => setMoveAnim(null), 280);
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { selectedIds?: unknown; wideById?: unknown };
      if (!Array.isArray(parsed?.selectedIds)) return;
      const next = (parsed.selectedIds as unknown[])
        .filter((id): id is string => typeof id === "string" && allIds.includes(id));
      // Permite que o usuário deixe vazio (mostra mensagem).
      setSelectedIds(next);

      if (parsed.wideById && typeof parsed.wideById === "object" && !Array.isArray(parsed.wideById)) {
        const obj = parsed.wideById as Record<string, unknown>;
        setWideById((prev) => {
          const nextMap: Record<string, boolean> = { ...prev };
          for (const [k, v] of Object.entries(obj)) {
            if (typeof v === "boolean" && allIds.includes(k)) nextMap[k] = v;
          }
          return nextMap;
        });
      }
    } catch {
      // Se falhar, fica o padrão.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (moveAnimTimeoutRef.current) window.clearTimeout(moveAnimTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ selectedIds, wideById }));
    } catch {
      // Sem persistência se localStorage estiver bloqueado.
    }
  }, [storageKey, selectedIds, wideById]);

  const enabledSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const kpiById = useMemo(() => new Map(kpiRows.map((r) => [r.id, r])), [kpiRows]);
  const selectedRows = useMemo(() => {
    return selectedIds
      .map((id) => kpiById.get(id))
      .filter((x): x is MetaKpiRow => Boolean(x));
  }, [selectedIds, kpiById]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const moveId = (id: string, dir: -1 | 1) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[nextIdx];
      next[nextIdx] = tmp;
      return next;
    });
  };

  const selectAll = () => setSelectedIds(allIds);
  const clearAll = () => setSelectedIds([]);

  const toggleWide = (id: string) => {
    setWideById((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderById = (dragId: string, dropId: string) => {
    setSelectedIds((prev) => {
      const a = prev.indexOf(dragId);
      const b = prev.indexOf(dropId);
      if (a < 0 || b < 0 || a === b) return prev;
      const next = [...prev];
      next.splice(a, 1);
      next.splice(b, 0, dragId);
      return next;
    });
  };

  const activeRow = activeId ? selectedRows.find((r) => r.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderById(String(active.id), String(over.id));
  };

  return (
    <div className={DASHBOARD_SECTION_STACK_CLASS}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-semibold text-(--text-primary)">{t("meta.kpiLayoutTitle")}</div>
        <button
          type="button"
          onClick={() => setEditorOpen((o) => !o)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--text-primary) transition-colors hover:border-(--border-accent)"
        >
          <SlidersHorizontal className="h-4 w-4 text-(--accent)" aria-hidden />
          {t("meta.kpiLayoutEdit")}
        </button>
      </div>

      {editorOpen && (
        <div className="dashboard-card rounded-2xl border p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-(--text-primary)">{t("meta.kpiLayoutEditorTitle")}</div>
              <div className="mt-1 text-xs text-(--text-muted)">{t("meta.kpiLayoutEditorHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) p-2 text-(--text-muted) hover:text-(--text-primary)"
              aria-label={t("meta.kpiLayoutClose")}
              title={t("meta.kpiLayoutClose")}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary)"
            >
              {t("meta.kpiLayoutSelectAll")}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-2 text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary)"
            >
              {t("meta.kpiLayoutClearAll")}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            <div className="space-y-2">
              {metaKpiRows.map((row) => {
                const enabled = enabledSet.has(row.id);
                const idx = selectedIds.indexOf(row.id);
                const order = idx >= 0 ? idx + 1 : null;

                return (
                  <div
                    key={row.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                      enabled
                        ? "border-(--border-accent) bg-(--accent-soft)"
                        : "border-(--border) bg-(--surface-elevated)/50"
                    }`}
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-(--text-primary)">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleId(row.id)}
                        className="h-4 w-4 rounded border-(--border) text-(--accent) accent-(--accent) focus:ring-(--accent)"
                      />
                      {order != null && (
                        <span className="shrink-0 rounded-full bg-(--accent-soft) px-2 py-0.5 text-[11px] font-semibold text-(--accent)">
                          #{order}
                        </span>
                      )}
                      <span className="truncate font-medium">{t(row.labelKey)}</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!enabled || idx <= 0}
                        onClick={() => {
                          triggerMoveAnim(row.id, "up");
                          moveId(row.id, -1);
                        }}
                        style={
                          moveAnim?.id === row.id && moveAnim?.dir === "up"
                            ? { animation: "metaKpiMoveUp 280ms ease-out", willChange: "transform" }
                            : undefined
                        }
                        className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-semibold text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t("meta.kpiLayoutMoveUp")}
                        title={t("meta.kpiLayoutMoveUp")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={!enabled || idx < 0 || idx >= selectedIds.length - 1}
                        onClick={() => {
                          triggerMoveAnim(row.id, "down");
                          moveId(row.id, 1);
                        }}
                        style={
                          moveAnim?.id === row.id && moveAnim?.dir === "down"
                            ? { animation: "metaKpiMoveDown 280ms ease-out", willChange: "transform" }
                            : undefined
                        }
                        className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-semibold text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t("meta.kpiLayoutMoveDown")}
                        title={t("meta.kpiLayoutMoveDown")}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => toggleWide(row.id)}
                        className="cursor-pointer rounded-lg border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-semibold text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={wideById[row.id] ? "Diminuir largura" : "Aumentar largura"}
                        title={wideById[row.id] ? "Diminuir largura" : "Aumentar largura"}
                      >
                        {wideById[row.id] ? <MinusSquare className="h-4 w-4" aria-hidden /> : <Expand className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedRows.length === 0 ? (
        <div className="dashboard-card rounded-2xl border p-6 text-sm text-(--text-muted)">
          {t("meta.kpiLayoutNoneSelected")}
        </div>
      ) : (
        <>
          {!mounted ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {selectedRows.map((row, i) => {
                const wide = wideById[row.id] ?? Boolean(row.wide);
                return <MetaKpiCard key={row.id} row={row} i={i} wide={wide} />;
              })}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={selectedRows.map((row) => row.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedRows.map((row, i) => {
                    const wide = wideById[row.id] ?? Boolean(row.wide);
                    return <SortableMetaKpiCard key={row.id} row={row} i={i} wide={wide} />;
                  })}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeRow ? (
                  <div className="rotate-1 scale-[1.02]">
                    <MetaKpiCard row={activeRow} i={0} wide={wideById[activeRow.id] ?? Boolean(activeRow.wide)} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      <style>{`
        @keyframes metaKpiUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes metaKpiMoveUp {
          0% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-4px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }

        @keyframes metaKpiMoveDown {
          0% { transform: translateY(0) scale(1); }
          40% { transform: translateY(4px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
