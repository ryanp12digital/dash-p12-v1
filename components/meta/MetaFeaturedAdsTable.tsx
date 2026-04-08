"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  CircleHelp, Pencil, X,
  SlidersHorizontal, ChevronDown, Search, Check, ZoomIn, GitCompare, Calendar,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { metaFeaturedAds } from "@/lib/meta-ads-data";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { DASHBOARD_WIDE_SURFACE_MAX_CLASS } from "@/lib/dashboard-layout";
import { ResizableTable, type ResizableTableColumn } from "@/components/ui/resizable-table";
import TableEditModal, { type TableEditMetric } from "@/components/ui/table-edit-modal";

const tableCardClass =
  "overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white/95 shadow-[0_4px_20px_rgba(7,41,207,0.06),0_1px_4px_rgba(0,0,0,0.04)]";

function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, onOutside, enabled]);
}

/* ─── Types ──────────────────────────────────────────────────────── */
type LightboxAd = {
  id: string;
  name: string;
  url: string;
  campaign: string;
  accountId: string;
};

type PeriodMetrics = {
  spent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  resultValue: number;
  resultLabelKey: string;
  costPerResult: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
} | null;

type CompareData = { period1: PeriodMetrics; period2: PeriodMetrics };

/* ─── Ad Lightbox Modal (via Portal) ─────────────────────────────── */
function AdLightbox({ ad, onClose }: { ad: LightboxAd; onClose: () => void }) {
  const { formatDisplayCurrencyAmount, formatCount, intlLocale, t } = useDashboardSettings();

  // Portal mount state
  const [mounted, setMounted] = useState(false);

  // Compare state
  const [compareMode, setCompareMode] = useState(false);
  const [since1, setSince1] = useState("");
  const [until1, setUntil1] = useState("");
  const [since2, setSince2] = useState("");
  const [until2, setUntil2] = useState("");
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Mount portal + lock body scroll
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  // Fetch comparison
  useEffect(() => {
    if (!compareMode || !since1 || !until1 || !since2 || !until2) return;
    if (!ad.id || ad.id.startsWith("mock")) {
      setCompareError("Comparação disponível apenas com dados reais da conta Meta.");
      return;
    }
    let cancelled = false;
    (async () => {
      setCompareLoading(true);
      setCompareError(null);
      setCompareData(null);
      try {
        const params = new URLSearchParams({ adId: ad.id, since1, until1, since2, until2 });
        const res = await fetch(`/api/meta/ad-compare?${params}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? res.statusText);
        setCompareData({
          period1: json.period1?.metrics ?? null,
          period2: json.period2?.metrics ?? null,
        });
      } catch (e) {
        if (!cancelled) setCompareError(e instanceof Error ? e.message : "Erro ao comparar períodos");
      } finally {
        if (!cancelled) setCompareLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [compareMode, since1, until1, since2, until2, ad.id]);

  const fmtCurr = (n: number) => formatDisplayCurrencyAmount(n, { maximumFractionDigits: 2 });
  const fmtPct = (n: number) =>
    `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n)}%`;
  const fmtNum = (n: number) =>
    new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n);

  function DeltaBadge({ a, b }: { a?: number; b?: number }) {
    if (!a && !b) return <span className="text-[#94a3b8]">—</span>;
    if (b === undefined || b === 0) return <span className="text-[#94a3b8]">—</span>;
    const pct = ((( a ?? 0) - b) / b) * 100;
    if (Math.abs(pct) < 0.05) return <span className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-[#94a3b8]"><Minus className="h-3 w-3" />0%</span>;
    const positive = pct > 0;
    return (
      <span className={`flex items-center justify-center gap-0.5 text-[11px] font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {positive ? "+" : ""}{fmtNum(Math.abs(pct))}%
      </span>
    );
  }

  const compareRows: {
    label: string;
    fmt: (m: NonNullable<PeriodMetrics>) => string;
    num: (m: NonNullable<PeriodMetrics>) => number;
  }[] = [
    { label: "Resultado",      fmt: (m) => m.resultValue > 0 ? fmtNum(m.resultValue) : "0",   num: (m) => m.resultValue },
    { label: "Custo/resultado",fmt: (m) => m.costPerResult > 0 ? fmtCurr(m.costPerResult) : "—", num: (m) => m.costPerResult },
    { label: "Investido",      fmt: (m) => fmtCurr(m.spent),        num: (m) => m.spent },
    { label: "Alcance",        fmt: (m) => formatCount(m.reach),     num: (m) => m.reach },
    { label: "Impressões",     fmt: (m) => formatCount(m.impressions), num: (m) => m.impressions },
    { label: "CTR",            fmt: (m) => fmtPct(m.ctr),           num: (m) => m.ctr },
    { label: "CPC",            fmt: (m) => fmtCurr(m.cpc),          num: (m) => m.cpc },
    { label: "CPM",            fmt: (m) => fmtCurr(m.cpm),          num: (m) => m.cpm },
    { label: "Frequência",     fmt: (m) => fmtNum(m.frequency),      num: (m) => m.frequency },
  ];

  if (!mounted) return null;

  const modal = (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 flex cursor-pointer items-center justify-center p-4 sm:p-6"
      style={{ zIndex: 99999, backgroundColor: "rgba(15,23,42,0.75)" }}
      onClick={onClose}
    >
      {/* ── Dialog ── */}
      <div
        role="dialog"
        aria-modal
        aria-label={ad.name}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.30),0_8px_24px_rgba(7,41,207,0.12)] transition-all duration-200 ${
          compareMode ? DASHBOARD_WIDE_SURFACE_MAX_CLASS : "max-w-lg"
        }`}
        style={{ maxHeight: "92vh" }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f1f5f9] bg-white px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0f172a]" title={ad.name}>{ad.name}</p>
            <p className="truncate text-xs text-[#94a3b8]" title={ad.campaign}>{ad.campaign}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCompareMode((v) => !v);
                setCompareData(null);
                setCompareError(null);
              }}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                compareMode
                  ? "border-[#0729cf] bg-[#0729cf] text-white shadow-sm"
                  : "border-[#e2e8f0] bg-white text-[#374151] hover:bg-[#f8fafc]"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Comparar períodos
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={`flex min-h-0 flex-1 overflow-hidden ${compareMode ? "flex-row" : "flex-col"}`}>

          {/* ── Creative image ── */}
          <div
            className={`order-1 flex items-center justify-center bg-[#0a0f1e] ${
              compareMode ? "w-[min(600px,55vw)] h-full shrink-0 overflow-hidden" : "w-full"
            }`}
            style={compareMode ? { minHeight: 0 } : { maxHeight: "70vh" }}
          >
            <img
              src={ad.url}
              alt={ad.name}
              draggable={false}
              className="block"
              loading="eager"
              decoding="async"
              style={{
                width: compareMode ? "100%" : "auto",
                height: compareMode ? "100%" : "auto",
                maxWidth: "100%",
                maxHeight: compareMode ? "100%" : "70vh",
                objectFit: compareMode ? "cover" : "contain",
                objectPosition: "center",
                display: "block",
              }}
            />
          </div>

          {/* ── Compare panel ── */}
          {compareMode && (
            <div className="order-2 flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[#f1f5f9]">

              {/* Period pickers */}
              <div className="shrink-0 border-b border-[#f1f5f9] bg-[#f8fafc] px-5 py-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  <Calendar className="h-3.5 w-3.5" />
                  Selecione os dois períodos para comparar
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Period A */}
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-md bg-[#0729cf] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Período A
                    </span>
                    <input
                      type="date"
                      value={since1}
                      onChange={(e) => setSince1(e.target.value)}
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#0729cf] focus:ring-1 focus:ring-[#0729cf]/20"
                    />
                    <input
                      type="date"
                      value={until1}
                      min={since1 || undefined}
                      onChange={(e) => setUntil1(e.target.value)}
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#0729cf] focus:ring-1 focus:ring-[#0729cf]/20"
                    />
                  </div>
                  {/* Period B */}
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-md bg-[#7c3aed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Período B
                    </span>
                    <input
                      type="date"
                      value={since2}
                      onChange={(e) => setSince2(e.target.value)}
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20"
                    />
                    <input
                      type="date"
                      value={until2}
                      min={since2 || undefined}
                      onChange={(e) => setUntil2(e.target.value)}
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Metrics result — scrollable */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {/* Loading */}
                {compareLoading && (
                  <div className="flex items-center gap-2.5 py-8 text-sm text-[#64748b]">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0729cf]/20 border-t-[#0729cf]" />
                    Carregando comparação…
                  </div>
                )}

                {/* Error */}
                {!compareLoading && compareError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {compareError}
                  </div>
                )}

                {/* Empty state */}
                {!compareLoading && !compareError && !compareData && (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <Calendar className="h-8 w-8 text-[#cbd5e1]" />
                    <p className="text-sm font-medium text-[#94a3b8]">Preencha os dois períodos acima</p>
                    <p className="text-xs text-[#cbd5e1]">A comparação aparecerá aqui automaticamente</p>
                  </div>
                )}

                {/* Metrics table */}
                {!compareLoading && !compareError && compareData && (
                  <div>
                    {/* Col headers */}
                    <div className="mb-1 grid grid-cols-[1fr_100px_100px_64px] items-center gap-2 border-b border-[#f1f5f9] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Métrica</span>
                      <span className="text-center text-[10px] font-bold uppercase tracking-wider text-[#0729cf]">A</span>
                      <span className="text-center text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">B</span>
                      <span className="text-center text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Δ A/B</span>
                    </div>

                    <div className="divide-y divide-[#f8fafc]">
                      {compareRows.map((row) => {
                        const m1 = compareData.period1;
                        const m2 = compareData.period2;
                        return (
                          <div
                            key={row.label}
                            className="grid grid-cols-[1fr_100px_100px_64px] items-center gap-2 py-2.5"
                          >
                            <span className="text-xs font-medium text-[#475569]">{row.label}</span>
                            <span className="text-center text-xs font-semibold tabular-nums text-[#0f172a]">
                              {m1 ? row.fmt(m1) : "—"}
                            </span>
                            <span className="text-center text-xs font-semibold tabular-nums text-[#0f172a]">
                              {m2 ? row.fmt(m2) : "—"}
                            </span>
                            <div className="flex items-center justify-center">
                              <DeltaBadge
                                a={m1 ? row.num(m1) : undefined}
                                b={m2 ? row.num(m2) : undefined}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-[10px] text-[#94a3b8]">
                      Δ A/B = variação percentual do período A em relação ao B
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#f1f5f9] bg-[#f8fafc] px-5 py-2.5 text-center">
          <p className="text-[11px] text-[#94a3b8]">Pressione <kbd className="rounded border border-[#e2e8f0] bg-white px-1 py-0.5 text-[10px] font-mono">Esc</kbd> ou clique fora para fechar</p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ─── Custom checkbox ─────────────────────────────────────────────── */
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`cursor-pointer flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150 ${
        checked
          ? "border-[#0729cf] bg-[#0729cf] shadow-sm shadow-[#0729cf]/30"
          : "border-[#cbd5e1] bg-white hover:border-[#0729cf]/50"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
    </button>
  );
}

/* ─── Filter dropdown ─────────────────────────────────────────────── */
function FilterDropdown({
  title, items, selectedItems, itemCounts, searchValue,
  onSearchChange, onToggle, onClear, onClose, allSelected, onToggleAll,
}: {
  title: string;
  items: string[];
  selectedItems: string[];
  itemCounts: Record<string, number>;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onToggle: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
  allSelected: boolean;
  onToggleAll: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const filteredItems = useMemo(
    () => items.filter((i) => i.toLowerCase().includes(searchValue.toLowerCase())),
    [items, searchValue],
  );

  return (
    <div className="absolute left-0 top-full z-50 mt-1.5 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10),0_4px_12px_rgba(7,41,207,0.07)]">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{title}</span>
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox checked={allSelected} onChange={onToggleAll} />
          <span className="text-xs font-semibold text-[#0729cf]">Selecionar todos</span>
        </label>
      </div>
      <div className="border-b border-[#f1f5f9] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 transition-colors focus-within:border-[#0729cf]/40 focus-within:bg-white focus-within:shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Buscar ${title.toLowerCase()}…`}
            className="w-full bg-transparent text-xs text-[#0f172a] placeholder-[#94a3b8] outline-none"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="cursor-pointer shrink-0 rounded text-[#94a3b8] hover:text-[#64748b]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto px-2 py-1.5">
        {filteredItems.length === 0 ? (
          <div className="py-5 text-center text-xs text-[#94a3b8]">Nenhum resultado encontrado</div>
        ) : (
          filteredItems.map((item) => {
            const checked = selectedItems.includes(item);
            return (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${checked ? "bg-[#0729cf]/5" : "hover:bg-[#f8fafc]"}`}
              >
                <Checkbox checked={checked} onChange={() => onToggle(item)} />
                <span className={`flex-1 truncate text-xs font-medium ${checked ? "text-[#0729cf]" : "text-[#0f172a]"}`} title={item}>
                  {item}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#64748b]">
                  {itemCounts[item] ?? 0}
                </span>
              </label>
            );
          })
        )}
      </div>
      <div className="flex gap-2 border-t border-[#f1f5f9] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            onClear();
            onSearchChange("");
          }}
          className="cursor-pointer flex-1 rounded-lg border border-[#e2e8f0] py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer flex-1 rounded-lg bg-[#0729cf] py-2 text-xs font-semibold text-white hover:bg-[#0621a8]"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

/* ─── Filter button ───────────────────────────────────────────────── */
function FilterButton({ label, count, open, onClick }: { label: string; count: number; open: boolean; onClick: () => void }) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? "border-[#0729cf] bg-[#0729cf] text-white shadow-sm shadow-[#0729cf]/20"
          : "border-[#e2e8f0] bg-white text-[#374151] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
      }`}
    >
      <span>{label}</span>
      {active ? (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">{count}</span>
      ) : (
        <span className="text-[10px] font-medium opacity-45">Todos</span>
      )}
      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""} ${active ? "opacity-70" : "opacity-40"}`} />
    </button>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
export default function MetaFeaturedAdsTable() {
  const { t, formatDisplayCurrencyAmount, formatCount, intlLocale } = useDashboardSettings();
  const { dateFrom, dateTo } = useOverviewScope();
  const { selectedAccountId, hasTokenConfigured } = useMetaAdsData();
  const [editOpen, setEditOpen] = useState(false);

  const [featuredAds, setFeaturedAds] = useState(metaFeaturedAds);
  const [loadingAds, setLoadingAds] = useState(false);
  const [lightboxAd, setLightboxAd] = useState<LightboxAd | null>(null);
  const [adsError, setAdsError] = useState<string | null>(null);
  const hasLoadedRealAdsRef = useRef(false);

  useEffect(() => {
    if (!selectedAccountId || hasTokenConfigured === false) return;
    let cancelled = false;
    const attemptLimits = ["50", "20"];
    (async () => {
      setLoadingAds(true);
      setAdsError(null);
      let lastError: string | null = null;
      for (const limit of attemptLimits) {
        try {
          const params = new URLSearchParams({
            accountId: selectedAccountId,
            since: dateFrom,
            until: dateTo,
            limit,
          });
          const res = await fetch(`/api/meta/featured-ads?${params.toString()}`);
          const data = (await res.json()) as { ads?: typeof metaFeaturedAds; error?: string };
          if (cancelled) return;
          if (!res.ok) throw new Error(data.error ?? res.statusText);
          if (data.ads && data.ads.length) {
            setFeaturedAds(data.ads as any);
            hasLoadedRealAdsRef.current = true;
            lastError = null;
            break;
          }
          throw new Error("Resposta sem anúncios em destaque");
        } catch (e) {
          lastError = e instanceof Error ? e.message : "Erro ao carregar anúncios em destaque";
        }
      }
      if (cancelled) return;
      setAdsError(lastError);
      if (!hasLoadedRealAdsRef.current) setFeaturedAds(metaFeaturedAds);
      setLoadingAds(false);
    })();
    return () => { cancelled = true; };
  }, [selectedAccountId, hasTokenConfigured, dateFrom, dateTo]);

  /* ── Filters ── */
  const campaigns = useMemo(() => [...new Set(featuredAds.map((r) => r.campaignName))].sort((a, b) => a.localeCompare(b)), [featuredAds]);
  const adsets = useMemo(() => [...new Set(featuredAds.map((r) => r.adsetName))].sort((a, b) => a.localeCompare(b)), [featuredAds]);
  const campaignAdCount = useMemo(() => { const m: Record<string, number> = {}; for (const a of featuredAds) m[a.campaignName] = (m[a.campaignName] ?? 0) + 1; return m; }, [featuredAds]);
  const adsetAdCount = useMemo(() => { const m: Record<string, number> = {}; for (const a of featuredAds) m[a.adsetName] = (m[a.adsetName] ?? 0) + 1; return m; }, [featuredAds]);

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [adsetOpen, setAdsetOpen] = useState(false);
  const campaignRef = useRef<HTMLDivElement | null>(null);
  const adsetRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(campaignRef, useCallback(() => setCampaignOpen(false), []), campaignOpen);
  useClickOutside(adsetRef, useCallback(() => setAdsetOpen(false), []), adsetOpen);

  const [campaignSearch, setCampaignSearch] = useState("");
  const [adsetSearch, setAdsetSearch] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);

  const toggleCampaign = (v: string) => setSelectedCampaigns((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleAdset = (v: string) => setSelectedAdsets((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const clearCampaigns = () => setSelectedCampaigns([]);
  const clearAdsets = () => setSelectedAdsets([]);
  const allCampaignsSelected = campaigns.length > 0 && selectedCampaigns.length === campaigns.length;
  const allAdsetsSelected = adsets.length > 0 && selectedAdsets.length === adsets.length;
  const hasAnyFilter = selectedCampaigns.length > 0 || selectedAdsets.length > 0;
  const clearAll = () => { clearCampaigns(); clearAdsets(); };

  const filteredAds = useMemo(
    () => featuredAds.filter((r) => {
      const ok1 = selectedCampaigns.length === 0 || selectedCampaigns.includes(r.campaignName);
      const ok2 = selectedAdsets.length === 0 || selectedAdsets.includes(r.adsetName);
      return ok1 && ok2;
    }),
    [featuredAds, selectedCampaigns, selectedAdsets],
  );

  const fmtPct = useCallback(
    (n: number) => `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n)}%`,
    [intlLocale],
  );

  /* ── Columns ── */
  const columns = useMemo<ResizableTableColumn<(typeof metaFeaturedAds)[number]>[]>(
    () => [
      {
        key: "ad",
        header: t("meta.colAd"),
        width: 260, minWidth: 200, maxWidth: 560,
        className: "text-[#64748b]",
        sortable: true,
        sortType: "string",
        sortValue: (row) => row.name,
        render: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            {row.thumbnailUrl ? (
              <button
                type="button"
                onClick={() => setLightboxAd({
                  id: (row as any).id ?? "mock",
                  name: row.name,
                  url: row.thumbnailUrl!,
                  campaign: row.campaignName,
                  accountId: selectedAccountId ?? "",
                })}
                className="group relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition-all hover:border-[#0729cf]/40 hover:shadow-md"
                aria-label={`Ver criativo: ${row.name}`}
              >
                <img src={row.thumbnailUrl} alt={row.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/0 transition-colors group-hover:bg-[#0f172a]/30">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-linear-to-br from-[#0729cf]/10 to-[#60a5fa]/10 text-base font-bold text-[#0729cf]" aria-hidden>
                {row.thumbLetter}
              </div>
            )}
            <span className="truncate text-xs font-semibold text-[#0f172a]" style={{ maxWidth: "110px" }} title={row.name}>
              {row.name}
            </span>
          </div>
        ),
      },
      {
        key: "results",
        header: t("meta.colResults"),
        width: 120, minWidth: 100,
        sortable: true,
        sortType: "number",
        sortValue: (row) => Number(row.resultValue) || 0,
        render: (row) => {
          const hasResult = Number(row.resultValue) > 0;
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-bold text-[#0f172a]">{hasResult ? row.resultValue : "0"}</span>
              {hasResult && row.resultLabelKey && (
                <span className="truncate text-[11px] leading-tight text-[#64748b]">{t(row.resultLabelKey)}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "costPerResult",
        header: t("meta.colCostPerResult"),
        width: 160, minWidth: 120,
        sortable: true,
        sortType: "number",
        sortValue: (row) => {
          const hasResult = Number(row.resultValue) > 0;
          return hasResult ? row.costPerResultBrl : Number.POSITIVE_INFINITY;
        },
        render: (row) => {
          const hasResult = Number(row.resultValue) > 0;
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-bold text-[#0f172a]">
                {hasResult ? formatDisplayCurrencyAmount(row.costPerResultBrl, { maximumFractionDigits: 2 }) : "—"}
              </span>
              {hasResult && row.resultLabelKey && (
                <span className="truncate text-[11px] leading-tight text-[#64748b]">{t(row.resultLabelKey)}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "spent", header: t("meta.colSpent"), width: 140, minWidth: 110, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.spent,
        render: (row) => <span className="text-right text-sm font-medium text-[#0f172a]">{formatDisplayCurrencyAmount(row.spent, { maximumFractionDigits: 2 })}</span>,
      },
      {
        key: "reach", header: t("meta.colReach"), width: 120, minWidth: 100, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.reach,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.reach)}</span>,
      },
      {
        key: "impressions", header: t("meta.colImpressions"), width: 140, minWidth: 110, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.impressions,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.impressions)}</span>,
      },
      {
        key: "linkClicks", header: t("meta.colLinkClicks"), width: 140, minWidth: 110, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.linkClicks,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.linkClicks)}</span>,
      },
      {
        key: "ctr", header: t("meta.colCtrAll"), width: 90, minWidth: 80, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.ctr,
        render: (row) => <span className="text-sm text-[#0f172a]">{fmtPct(row.ctr)}</span>,
      },
      {
        key: "cpc", header: t("meta.colCpc"), width: 120, minWidth: 100, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.cpc,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatDisplayCurrencyAmount(row.cpc, { maximumFractionDigits: 2 })}</span>,
      },
      {
        key: "cpm", header: t("meta.colCpm"), width: 120, minWidth: 100, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.cpm,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatDisplayCurrencyAmount(row.cpm, { maximumFractionDigits: 2 })}</span>,
      },
      {
        key: "frequency", header: t("meta.colFrequency"), width: 120, minWidth: 100, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.frequency,
        render: (row) => <span className="text-sm text-[#0f172a]">{new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.frequency)}</span>,
      },
      {
        key: "pageEngagement", header: t("meta.colPageEngagement"), width: 160, minWidth: 130, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.pageEngagement,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.pageEngagement)}</span>,
      },
      {
        key: "video25", header: t("meta.colVideo25"), width: 140, minWidth: 110, align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.videoPlays25,
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.videoPlays25)}</span>,
      },
    ],
    [t, intlLocale, fmtPct, formatDisplayCurrencyAmount, formatCount, selectedAccountId],
  );

  const lockedFirstKey = "ad";
  const layoutStorageKey = "p12-table-layout:meta-featured-ads";
  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  useEffect(() => {
    setColumnOrder((prev) => {
      const merged = [...prev.filter((k) => defaultOrder.includes(k)), ...defaultOrder.filter((k) => !prev.includes(k))];
      const next = [lockedFirstKey, ...merged.filter((k) => k !== lockedFirstKey)];
      if (prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
      return next;
    });
  }, [defaultOrder]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(layoutStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { order?: string[]; hidden?: string[] };
      if (Array.isArray(parsed.order)) {
        const ordered = [lockedFirstKey, ...parsed.order.filter((k) => k !== lockedFirstKey)];
        setColumnOrder((prev) => {
          if (prev.length === ordered.length && prev.every((v, i) => v === ordered[i])) return prev;
          return ordered;
        });
      }
      if (Array.isArray(parsed.hidden)) setHiddenKeys(parsed.hidden.filter((k) => k !== lockedFirstKey));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        layoutStorageKey,
        JSON.stringify({ order: columnOrder, hidden: hiddenKeys.filter((k) => k !== lockedFirstKey) }),
      );
    } catch {
      // ignore
    }
  }, [layoutStorageKey, columnOrder, hiddenKeys]);

  const columnsByKey = useMemo(() => {
    const map = new Map<string, ResizableTableColumn<(typeof metaFeaturedAds)[number]>>();
    for (const c of columns) map.set(c.key, c);
    return map;
  }, [columns]);

  const orderedColumnKeys = useMemo(() => {
    const merged = [...columnOrder.filter((k) => columnsByKey.has(k)), ...defaultOrder.filter((k) => !columnOrder.includes(k))];
    return [lockedFirstKey, ...merged.filter((k) => k !== lockedFirstKey)];
  }, [columnOrder, columnsByKey, defaultOrder]);

  const visibleColumns = useMemo(
    () =>
      orderedColumnKeys
        .filter((k) => k === lockedFirstKey || !hiddenKeys.includes(k))
        .map((k) => columnsByKey.get(k))
        .filter(Boolean) as ResizableTableColumn<(typeof metaFeaturedAds)[number]>[],
    [orderedColumnKeys, hiddenKeys, columnsByKey],
  );

  const toggleColumn = (key: string) => {
    if (key === lockedFirstKey) return;
    setHiddenKeys((prev) => {
      const isHidden = prev.includes(key);
      if (!isHidden) {
        if (visibleColumns.length <= 2) return prev;
        return [...prev, key];
      }
      return prev.filter((k) => k !== key);
    });
  };

  const resetColumns = () => {
    setColumnOrder(defaultOrder);
    setHiddenKeys([]);
  };

  const handleOrderChange = (next: string[]) => {
    setColumnOrder([lockedFirstKey, ...next.filter((k) => k !== lockedFirstKey)]);
  };

  /* ─────────────────────────────── JSX ─────────────────────────────── */
  return (
    <>
      {lightboxAd && <AdLightbox ad={lightboxAd} onClose={() => setLightboxAd(null)} />}

      <div className={tableCardClass}>
        {/* Card header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-[#0f172a]">{t("meta.tableAdsTitle")}</h2>
            <button type="button" className="rounded-md p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9]" title={t("meta.tableAdsHelp")} aria-label={t("meta.tableAdsHelp")}>
              <CircleHelp className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("meta.editTable")}
          </button>
        </div>
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] bg-[#f8fafc]/60 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </div>
          <div className="mx-1 h-4 w-px shrink-0 bg-[#e2e8f0]" />

          <div className="relative" ref={campaignRef}>
            <FilterButton label={t("meta.filtersFeaturedCampaigns")} count={selectedCampaigns.length} open={campaignOpen} onClick={() => { setCampaignOpen((o) => !o); if (adsetOpen) setAdsetOpen(false); }} />
            {campaignOpen && (
              <FilterDropdown title={t("meta.filtersFeaturedCampaigns")} items={campaigns} selectedItems={selectedCampaigns} itemCounts={campaignAdCount} searchValue={campaignSearch} onSearchChange={setCampaignSearch} onToggle={toggleCampaign} onClear={clearCampaigns} onClose={() => setCampaignOpen(false)} allSelected={allCampaignsSelected} onToggleAll={() => allCampaignsSelected ? clearCampaigns() : setSelectedCampaigns([...campaigns])} />
            )}
          </div>

          <div className="relative" ref={adsetRef}>
            <FilterButton label={t("meta.filtersFeaturedAdsets")} count={selectedAdsets.length} open={adsetOpen} onClick={() => { setAdsetOpen((o) => !o); if (campaignOpen) setCampaignOpen(false); }} />
            {adsetOpen && (
              <FilterDropdown title={t("meta.filtersFeaturedAdsets")} items={adsets} selectedItems={selectedAdsets} itemCounts={adsetAdCount} searchValue={adsetSearch} onSearchChange={setAdsetSearch} onToggle={toggleAdset} onClear={clearAdsets} onClose={() => setAdsetOpen(false)} allSelected={allAdsetsSelected} onToggleAll={() => allAdsetsSelected ? clearAdsets() : setSelectedAdsets([...adsets])} />
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {hasAnyFilter && (
              <button type="button" onClick={clearAll} className="cursor-pointer text-xs font-semibold text-[#0729cf] hover:underline">
                Limpar filtros
              </button>
            )}
            <span className="text-xs text-[#94a3b8]">
              Exibindo <span className="font-semibold tabular-nums text-[#475569]">{filteredAds.length}</span> de <span className="font-semibold tabular-nums text-[#475569]">{featuredAds.length}</span> anúncios
            </span>
          </div>
        </div>

        {loadingAds && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#64748b] sm:px-6">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0729cf]/20 border-t-[#0729cf]" />
            Carregando anúncios em destaque…
          </div>
        )}
        {adsError && <div className="px-4 py-2 text-xs text-red-600 sm:px-6">{adsError}</div>}

        {hasAnyFilter && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] bg-white/50 px-4 py-2.5 sm:px-6">
            {selectedCampaigns.map((c) => (
              <button key={c} type="button" onClick={() => toggleCampaign(c)} className="cursor-pointer group inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-[#0729cf]/20 bg-[#0729cf]/5 py-1 pl-2.5 pr-2 text-[11px] font-semibold text-[#0729cf] hover:bg-[#0729cf]/10">
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wide opacity-50">Camp</span>
                <span className="truncate">{c}</span>
                <X className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-90" />
              </button>
            ))}
            {selectedAdsets.map((a) => (
              <button key={a} type="button" onClick={() => toggleAdset(a)} className="cursor-pointer group inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-[#7c3aed]/20 bg-[#7c3aed]/5 py-1 pl-2.5 pr-2 text-[11px] font-semibold text-[#7c3aed] hover:bg-[#7c3aed]/10">
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wide opacity-50">Conj</span>
                <span className="truncate">{a}</span>
                <X className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-90" />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="cursor-pointer ml-auto text-[11px] font-semibold text-[#94a3b8] hover:text-[#64748b]">Limpar todos</button>
          </div>
        )}

        <ResizableTable
          tableId="meta-featured-ads"
          columns={visibleColumns}
          rows={filteredAds}
          rowKey={(row) => `${row.name}-${row.adsetName}-${row.resultValue}-${row.spent}-${row.impressions}`}
          emptyState={t("meta.filtersEmptyFeaturedAds")}
          cardClassName="bg-transparent border-0 shadow-none rounded-none overflow-visible"
        />
      </div>
      <TableEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar tabela: Anúncios"
        metrics={orderedColumnKeys
          .map((key) => columnsByKey.get(key))
          .filter(Boolean)
          .map((col) => ({
            key: col!.key,
            label: typeof col!.header === "string" ? col!.header : col!.key,
            locked: col!.key === lockedFirstKey,
          })) as TableEditMetric[]}
        order={orderedColumnKeys}
        hiddenKeys={hiddenKeys}
        onReset={resetColumns}
        onOrderChange={handleOrderChange}
        onToggleMetric={toggleColumn}
      />
    </>
  );
}
