"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  TrendingDown,
  TrendingUp,
  Minus,
  SlidersHorizontal,
  X,
  Expand,
  MinusSquare,
} from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { metaKpiRows, type MetaKpiRow } from "@/lib/meta-ads-data";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";

const cardHover =
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md";

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

function MetaKpiCard({ row, i, wide }: { row: MetaKpiRow; i: number; wide: boolean }) {
  const { t, intlLocale, formatDisplayCurrencyAmount, formatCount } = useDashboardSettings();
  const tv = trendVisual(row);

  const pillClass =
    tv === "good"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
      : tv === "bad"
        ? "bg-red-50 text-red-700 ring-1 ring-red-200/80"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80";

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
      className={`flex h-[132px] flex-col justify-between overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm ${cardHover} ${wideClass}`}
      style={{
        animation: `metaKpiUp 0.4s ease both`,
        animationDelay: `${i * 28}ms`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)",
      }}
    >
      <div className="flex items-start justify-center gap-1.5">
        <h3 className="min-w-0 flex-1 truncate text-center text-sm font-semibold leading-snug text-[#0f172a]">
          {t(row.labelKey)}
        </h3>
        <button
          type="button"
          className="shrink-0 rounded-md p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
          title={t(row.helpKey)}
          aria-label={t(row.helpKey)}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-[#0f172a]">{main}</p>
        <span
          className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass}`}
          style={{ visibility: hasTrend ? "visible" : "hidden" }}
          aria-hidden={!hasTrend}
        >
          {tv === "good" && <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
          {tv === "bad" && <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
          {tv === "neutral" && <Minus className="h-3.5 w-3.5 opacity-70" aria-hidden />}
          {changePctStr ?? changeAbsStr}
        </span>
      </div>

      <p className="mt-2 text-xs text-[#64748b]" style={{ visibility: showPrev ? "visible" : "hidden" }}>
        <span className="font-medium text-[#94a3b8]">{t("meta.prevPeriodLine")} </span>
        {prevFormatted}
      </p>
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

  const draggingIdRef = useRef<string | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-semibold text-[#0f172a]">{t("meta.kpiLayoutTitle")}</div>
        <button
          type="button"
          onClick={() => setEditorOpen((o) => !o)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#0729cf]" aria-hidden />
          {t("meta.kpiLayoutEdit")}
        </button>
      </div>

      {editorOpen && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">{t("meta.kpiLayoutEditorTitle")}</div>
              <div className="mt-1 text-xs text-[#64748b]">{t("meta.kpiLayoutEditorHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white p-2 text-[#64748b] hover:bg-[#f8fafc]"
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
              className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            >
              {t("meta.kpiLayoutSelectAll")}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]"
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
                      enabled ? "border-[#0729cf]/25 bg-[#0729cf]/5" : "border-[#f1f5f9] bg-[#f8fafc]/50"
                    }`}
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[#0f172a]">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleId(row.id)}
                        className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] accent-[#0729cf] focus:ring-[#0729cf]"
                      />
                      {order != null && (
                        <span className="shrink-0 rounded-full bg-[#0729cf]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0729cf]">
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
                        className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold text-[#64748b] disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold text-[#64748b] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t("meta.kpiLayoutMoveDown")}
                        title={t("meta.kpiLayoutMoveDown")}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => toggleWide(row.id)}
                        className="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold text-[#64748b] disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
          {t("meta.kpiLayoutNoneSelected")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {selectedRows.map((row, i) => {
            const wide = wideById[row.id] ?? Boolean(row.wide);
            return (
              <div
                key={row.id}
                draggable={editorOpen}
                onDragStart={(e) => {
                  if (!editorOpen) return;
                  draggingIdRef.current = row.id;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", row.id);
                }}
                onDragOver={(e) => {
                  if (!editorOpen) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  if (!editorOpen) return;
                  e.preventDefault();
                  const dragId = e.dataTransfer.getData("text/plain") || draggingIdRef.current;
                  if (!dragId) return;
                  reorderById(dragId, row.id);
                  draggingIdRef.current = null;
                }}
                className={editorOpen ? "cursor-grab active:cursor-grabbing" : undefined}
              >
                <MetaKpiCard row={row} i={i} wide={wide} />
              </div>
            );
          })}
        </div>
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
