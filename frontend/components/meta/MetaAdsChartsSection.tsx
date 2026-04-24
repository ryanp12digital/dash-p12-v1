"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { ArrowDown, Settings, X } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import MetaConversionFunnelCard from "@/components/meta/MetaConversionFunnelCard";
import { metaImpressionsReachByHour } from "@/lib/meta-ads-data";
import { DASHBOARD_TABLE_SCROLL_AREA_CLASS } from "@/lib/dashboard-layout";

const GENDER_IMPRESSION = "#22d3ee";
const GENDER_REACH = "#64748b";

function ChartCard({ titleKey, subtitle, children }: { titleKey: string; subtitle?: string; children: ReactNode }) {
  const { t } = useDashboardSettings();
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-5 backdrop-blur-sm">
      <div className="mb-4 text-center">
        <h3 className="text-base font-medium tracking-tight text-neutral-200">{t(titleKey)}</h3>
        {subtitle ? <p className="mt-1 text-xs font-light text-neutral-500">{subtitle}</p> : null}
      </div>
      <div className="min-h-[240px] flex-1">{children}</div>
    </div>
  );
}

type CompareMetricKey = "impressoes" | "alcance" | "cliques" | "ctr" | "investimento" | "cpm";

const COMPARE_COLORS: Record<CompareMetricKey, string> = {
  impressoes: "#22d3ee",
  alcance: "#64748b",
  cliques: "#38bdf8",
  ctr: "#67e8f9",
  investimento: "#a3e635",
  cpm: "#f59e0b",
};

function MetaComparisonLineCard() {
  const { t, formatCount, formatDisplayCurrencyAmount } = useDashboardSettings();
  const { selectedAccountId } = useMetaAdsData();
  const storageKey = `p12-meta-compare-metrics-v1:${selectedAccountId ?? "global"}`;
  const [openConfig, setOpenConfig] = useState(false);
  const [selected, setSelected] = useState<CompareMetricKey[]>(["impressoes", "alcance"]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { selected?: CompareMetricKey[] };
      if (!Array.isArray(parsed?.selected)) return;
      const cleaned = parsed.selected.filter((k): k is CompareMetricKey => k in COMPARE_COLORS).slice(0, 3);
      if (cleaned.length > 0) setSelected(cleaned);
    } catch {
      // ignora localStorage inválido
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ selected }));
    } catch {
      // localStorage pode estar indisponível
    }
  }, [selected, storageKey]);

  const compareData = useMemo(
    () =>
      metaImpressionsReachByHour.map((row) => {
        const clicks = Math.max(1, Math.round(row.impressoes * 0.016));
        const ctr = Number(((clicks / Math.max(1, row.impressoes)) * 100).toFixed(2));
        const investimento = Math.round(row.impressoes * 0.38);
        const cpm = Number(((investimento * 1000) / Math.max(1, row.impressoes)).toFixed(2));
        return {
          hour: row.hour,
          impressoes: row.impressoes,
          alcance: row.alcance,
          cliques: clicks,
          ctr,
          investimento,
          cpm,
        };
      }),
    [],
  );

  const metricOptions: Array<{ key: CompareMetricKey; label: string }> = [
    { key: "impressoes", label: t("chart.impressions") },
    { key: "alcance", label: t("meta.seriesReach") },
    { key: "cliques", label: t("chart.clicks") },
    { key: "ctr", label: t("chart.ctr") },
    { key: "investimento", label: t("meta.kpi.spent") },
    { key: "cpm", label: t("meta.kpi.cpm") },
  ];

  const toggleMetric = (key: CompareMetricKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((m) => m !== key);
        return next.length === 0 ? prev : next;
      }
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  return (
    <div className="relative rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium tracking-tight text-neutral-200">Comparacao de metricas</h3>
          <p className="mt-1 text-xs font-light text-neutral-500">Evolucao diaria das campanhas ativas</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenConfig((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:border-neutral-500 hover:text-cyan-300"
          aria-label="Configurar metricas"
          title="Configurar metricas"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        {selected.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[key], boxShadow: `0 0 10px ${COMPARE_COLORS[key]}aa` }} />
            <span className="text-neutral-400">{metricOptions.find((m) => m.key === key)?.label ?? key}</span>
          </div>
        ))}
      </div>

      {openConfig && (
        <div className="absolute right-4 top-16 z-20 w-[min(92vw,360px)] rounded-2xl border border-neutral-700 bg-[#090b0d] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-100">Selecionar metricas (max 3)</div>
            <button
              type="button"
              onClick={() => setOpenConfig(false)}
              className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {metricOptions.map((opt) => {
              const checked = selected.includes(opt.key);
              const disabled = !checked && selected.length >= 3;
              return (
                <label
                  key={opt.key}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    checked ? "border-cyan-900/60 bg-cyan-950/20 text-neutral-100" : "border-neutral-800 text-neutral-300"
                  } ${disabled ? "opacity-50" : ""}`}
                >
                  <span>{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleMetric(opt.key)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={compareData} margin={{ top: 6, right: 6, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.55)" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#737373" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "#737373" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgba(82,82,82,0.8)", background: "#0a0a0a" }}
              labelStyle={{ color: "#d4d4d4" }}
              formatter={(v, name) => {
                const key = String(name) as CompareMetricKey;
                if (key === "ctr") return [`${Number(v).toFixed(2)}%`, metricOptions.find((m) => m.key === key)?.label ?? key];
                if (key === "investimento" || key === "cpm") {
                  return [formatDisplayCurrencyAmount(Number(v), { maximumFractionDigits: 2 }), metricOptions.find((m) => m.key === key)?.label ?? key];
                }
                return [formatCount(Number(v), { compact: false }), metricOptions.find((m) => m.key === key)?.label ?? key];
              }}
            />
            {selected.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COMPARE_COLORS[key]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type GenderChartPoint = { name: string; impressoes: number; alcance: number };

type RegionTableRow = {
  regionLabel: string;
  alcance: number;
  impressoes: number;
  frequencia: number;
  valorInvestido: number;
  cpm: number;
};

export default function MetaAdsChartsSection() {
  const { t, formatDisplayCurrencyAmount, formatCount, intlLocale } = useDashboardSettings();
  const { dateFrom, dateTo } = useOverviewScope();
  const { selectedAccountId, hasTokenConfigured } = useMetaAdsData();

  const [genderChartRows, setGenderChartRows] = useState<GenderChartPoint[]>([]);
  const [regionRows, setRegionRows] = useState<RegionTableRow[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audiencePartialErrors, setAudiencePartialErrors] = useState<{ gender?: string; region?: string } | null>(null);

  useEffect(() => {
    if (hasTokenConfigured !== true || !selectedAccountId) {
      setGenderChartRows([]);
      setRegionRows([]);
      setAudiencePartialErrors(null);
      setAudienceLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setAudienceLoading(true);
      setAudiencePartialErrors(null);
      try {
        const params = new URLSearchParams({
          accountId: selectedAccountId,
          since: dateFrom,
          until: dateTo,
        });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/audience-insights?${params.toString()}`);
        const data = (await res.json()) as {
          gender?: { generoKey: string; impressoes: number; alcance: number }[];
          regions?: RegionTableRow[];
          errors?: { gender?: string; region?: string };
          error?: string;
        };

        if (!res.ok) {
          if (res.status === 501) {
            if (!cancelled) {
              setGenderChartRows([]);
              setRegionRows([]);
            }
            return;
          }
          throw new Error(data.error ?? res.statusText);
        }

        if (!cancelled) {
          const g = (data.gender ?? []).map((r) => ({
            name: t(r.generoKey),
            impressoes: r.impressoes,
            alcance: r.alcance,
          }));
          setGenderChartRows(g);
          setRegionRows(data.regions ?? []);
          setAudiencePartialErrors(data.errors ?? null);
        }
      } catch {
        if (!cancelled) {
          setGenderChartRows([]);
          setRegionRows([]);
          setAudiencePartialErrors({
            gender: t("meta.audienceError"),
            region: t("meta.audienceError"),
          });
        }
      } finally {
        if (!cancelled) setAudienceLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasTokenConfigured, selectedAccountId, dateFrom, dateTo, t]);

  const genderRows = useMemo((): GenderChartPoint[] => {
    if (genderChartRows.length > 0) return genderChartRows;
    return [
      { name: t("meta.gender.female"), impressoes: 0, alcance: 0 },
      { name: t("meta.gender.male"), impressoes: 0, alcance: 0 },
      { name: t("meta.gender.unknown"), impressoes: 0, alcance: 0 },
    ];
  }, [genderChartRows, t]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MetaComparisonLineCard />
        </div>
        <MetaConversionFunnelCard />
      </div>

      <ChartCard titleKey="meta.chartReachImpressionsGender" subtitle={t("meta.chartGenderSubtitle")}>
        {hasTokenConfigured === false && (
          <p className="mb-3 text-center text-xs text-amber-200/90">{t("meta.audienceRequiresToken")}</p>
        )}
        {audiencePartialErrors?.gender && (
          <p className="mb-3 text-center text-xs text-amber-200/90">{audiencePartialErrors.gender}</p>
        )}
        <div className={audienceLoading ? "pointer-events-none opacity-50" : ""}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={genderRows} margin={{ top: 12, right: 12, left: 4, bottom: 8 }} barGap={6} barCategoryGap="24%">
            <defs>
              <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GENDER_IMPRESSION} stopOpacity={0.95} />
                <stop offset="100%" stopColor={GENDER_IMPRESSION} stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GENDER_REACH} stopOpacity={0.85} />
                <stop offset="100%" stopColor={GENDER_REACH} stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={{ stroke: "rgba(82,82,82,0.6)" }} />
            <YAxis tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(34,211,238,0.06)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(82,82,82,0.8)",
                background: "#0a0a0a",
                color: "#e5e5e5",
              }}
              formatter={(v, name) => [
                formatCount(Number(v ?? 0), { compact: false }),
                name === "impressoes" ? t("chart.impressions") : t("meta.seriesReach"),
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value) => (
                <span className="text-neutral-400">
                  {value === "impressoes" ? t("chart.impressions") : t("meta.seriesReach")}
                </span>
              )}
            />
            <Bar dataKey="impressoes" fill="url(#gImp)" radius={[8, 8, 0, 0]} name="impressoes" maxBarSize={48} />
            <Bar dataKey="alcance" fill="url(#gReach)" radius={[8, 8, 0, 0]} name="alcance" maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
        <div className="border-b border-neutral-800/50 px-5 py-4">
          <h3 className="text-base font-medium tracking-tight text-neutral-200">{t("meta.tableRegionsTitle")}</h3>
          <p className="mt-1 text-xs font-light text-neutral-500">{t("meta.tableRegionsSubtitle")}</p>
          {hasTokenConfigured === false && (
            <p className="mt-2 text-xs text-amber-200/90">{t("meta.audienceRequiresToken")}</p>
          )}
          {audiencePartialErrors?.region && (
            <p className="mt-2 text-xs text-amber-200/90">{audiencePartialErrors.region}</p>
          )}
        </div>
        <div
          className={`${DASHBOARD_TABLE_SCROLL_AREA_CLASS} ${audienceLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-neutral-800/50 bg-neutral-950/95 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 backdrop-blur-sm">
                <th className="px-4 py-3 sm:px-6">{t("meta.colRegion")}</th>
                <th className="px-4 py-3 sm:px-6">
                  <span className="inline-flex items-center gap-1">
                    {t("meta.colReach")}
                    <ArrowDown className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
                  </span>
                </th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colImpressions")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colFrequency")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colSpent")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colCpm")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {regionRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500 sm:px-6">
                    {t("meta.audienceEmptyRegions")}
                  </td>
                </tr>
              ) : (
              regionRows.map((row, idx) => (
                <tr key={`${row.regionLabel}-${idx}`} className="transition-colors hover:bg-neutral-800/30">
                  <td className="px-4 py-3.5 text-sm font-medium text-neutral-100 sm:px-6">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
                      {row.regionLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm tabular-nums text-neutral-200 sm:px-6">{formatCount(row.alcance)}</td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-neutral-200 sm:px-6">{formatCount(row.impressoes)}</td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-neutral-300 sm:px-6">
                    {new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.frequencia)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-cyan-200 sm:px-6">
                    {formatDisplayCurrencyAmount(row.valorInvestido, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-neutral-300 sm:px-6">
                    {formatDisplayCurrencyAmount(row.cpm, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
