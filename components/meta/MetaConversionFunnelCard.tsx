"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Settings, X } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";

type FunnelLayout = {
  selectedIds: string[];
};

function shiftItem(ids: string[], id: string, dir: -1 | 1): string[] {
  const idx = ids.indexOf(id);
  if (idx < 0) return ids;
  const nextIdx = idx + dir;
  if (nextIdx < 0 || nextIdx >= ids.length) return ids;
  const next = [...ids];
  [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
  return next;
}

export default function MetaConversionFunnelCard() {
  const { kpiRows, selectedAccountId } = useMetaAdsData();
  const { t, intlLocale, formatCount, formatDisplayCurrencyAmount } = useDashboardSettings();

  const storageKey = `p12-meta-funnel-layout-v1:${selectedAccountId ?? "global"}`;
  const defaultIds = useMemo(() => kpiRows.slice(0, 4).map((r) => r.id), [kpiRows]);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultIds);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    setSelectedIds(defaultIds);
  }, [defaultIds]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as FunnelLayout;
      if (!Array.isArray(parsed?.selectedIds)) return;
      const allowed = new Set(kpiRows.map((r) => r.id));
      const next = parsed.selectedIds.filter((id) => typeof id === "string" && allowed.has(id));
      if (next.length > 0) setSelectedIds(next);
    } catch {
      // ignora localStorage inválido
    }
  }, [storageKey, kpiRows]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ selectedIds } satisfies FunnelLayout));
    } catch {
      // localStorage pode estar indisponível
    }
  }, [selectedIds, storageKey]);

  const byId = useMemo(() => new Map(kpiRows.map((row) => [row.id, row])), [kpiRows]);
  const selectedRows = useMemo(
    () => selectedIds.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [selectedIds, byId],
  );

  const toggleMetric = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(kpiRows.map((r) => r.id));
  const clearAll = () => setSelectedIds([]);

  const formatMain = (row: (typeof selectedRows)[number]) => {
    if (row.kind === "money") return formatDisplayCurrencyAmount(row.current, { maximumFractionDigits: 2 });
    if (row.kind === "percent") {
      return `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.current)}%`;
    }
    if (row.kind === "ratio") {
      return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.current);
    }
    return formatCount(row.current, { compact: true });
  };

  return (
    <div className="relative rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium tracking-tight text-neutral-200">Funil de Conversao</h3>
          <p className="mt-1 text-xs font-light text-neutral-500">Taxas agregadas da jornada</p>
        </div>
        <button
          type="button"
          onClick={() => setEditorOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:border-neutral-500 hover:text-cyan-300"
          aria-label="Editar funil"
          title="Editar funil"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {editorOpen && (
        <div className="absolute right-4 top-16 z-20 w-[min(92vw,430px)] rounded-2xl border border-neutral-700 bg-[#090b0d] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-neutral-100">Configurar funil</div>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-neutral-100"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Selecionar todas
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
            >
              Limpar
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {kpiRows.map((row) => {
              const idx = selectedIds.indexOf(row.id);
              const enabled = idx >= 0;
              return (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                    enabled ? "border-cyan-900/60 bg-cyan-950/20" : "border-neutral-800 bg-neutral-900/40"
                  }`}
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-neutral-200">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleMetric(row.id)}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    {enabled && (
                      <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                        #{idx + 1}
                      </span>
                    )}
                    <span className="truncate">{t(row.labelKey)}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!enabled || idx === 0}
                      onClick={() => setSelectedIds((prev) => shiftItem(prev, row.id, -1))}
                      className="rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300 disabled:opacity-30"
                      title="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={!enabled || idx < 0 || idx === selectedIds.length - 1}
                      onClick={() => setSelectedIds((prev) => shiftItem(prev, row.id, 1))}
                      className="rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300 disabled:opacity-30"
                      title="Mover para baixo"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative flex w-full flex-col items-center justify-center py-2">
        {selectedRows.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] px-4 py-3 text-sm text-neutral-400">
            Nenhuma metrica selecionada no funil.
          </div>
        ) : (
          selectedRows.map((row, idx) => {
            const minWidth = 42;
            const maxWidth = 100;
            const step = selectedRows.length > 1 ? (maxWidth - minWidth) / (selectedRows.length - 1) : 0;
            const width = Math.max(minWidth, maxWidth - idx * step);
            const next = selectedRows[idx + 1];
            const rate =
              next && row.current > 0 ? (next.current / row.current) * 100 : null;
            const isLast = idx === selectedRows.length - 1;

            return (
              <div key={row.id} className="w-full">
                <div
                  className="relative z-10 mx-auto flex h-10 items-center justify-between rounded-full border px-4"
                  style={{
                    width: `${width}%`,
                    backgroundColor: idx === 0 ? "#0a0a0a" : `rgba(34,211,238,${0.05 + idx * 0.03})`,
                    borderColor: idx === 0 ? "rgba(64,64,64,0.8)" : `rgba(34,211,238,${0.24 + idx * 0.1})`,
                  }}
                >
                  <span className={`truncate text-xs ${idx === 0 ? "text-neutral-400" : "text-neutral-300"}`}>
                    {t(row.labelKey)}
                  </span>
                  <span className={`shrink-0 text-xs font-medium ${idx === 0 ? "text-neutral-200" : "text-cyan-300"}`}>
                    {formatMain(row)}
                  </span>
                </div>

                {!isLast && (
                  <div className="relative z-10 flex h-8 items-center justify-center">
                    <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-[#050505] px-2 py-0.5 text-[10px] text-cyan-500">
                      <ArrowDown className="h-3 w-3" />
                      {rate != null ? `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(rate)}%` : "--"}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

