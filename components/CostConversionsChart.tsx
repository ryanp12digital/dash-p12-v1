"use client";

import { useId, useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { weeklyChartData } from "@/lib/data";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

export type WeeklyMetricId = "cost" | "conversions" | "impressions" | "clicks" | "ctr";

type MetricFamily = "money" | "volume" | "rate";

const WEEKLY_METRIC_DEFS: {
  id: WeeklyMetricId;
  labelKey: string;
  family: MetricFamily;
  color: string;
}[] = [
  { id: "cost", labelKey: "chart.cost", family: "money", color: "#0729cf" },
  { id: "conversions", labelKey: "chart.conversions", family: "volume", color: "#38bdf8" },
  { id: "impressions", labelKey: "chart.impressions", family: "volume", color: "#8b5cf6" },
  { id: "clicks", labelKey: "chart.clicks", family: "volume", color: "#f59e0b" },
  { id: "ctr", labelKey: "chart.ctr", family: "rate", color: "#10b981" },
];

function familyOf(id: WeeklyMetricId): MetricFamily {
  return WEEKLY_METRIC_DEFS.find((m) => m.id === id)!.family;
}

function defOf(id: WeeklyMetricId) {
  return WEEKLY_METRIC_DEFS.find((m) => m.id === id)!;
}

function useDualAxis(a: WeeklyMetricId, b: WeeklyMetricId): boolean {
  return familyOf(a) !== familyOf(b);
}

/** Com eixo duplo: dinheiro à esquerda; taxa (CTR) à direita; volumes à esquerda exceto quando comparados com dinheiro (à direita). */
function yAxisSide(metric: WeeklyMetricId, pair: [WeeklyMetricId, WeeklyMetricId]): "left" | "right" {
  const [x, y] = pair;
  if (!useDualAxis(x, y)) return "left";
  const f = familyOf(metric);
  if (f === "money") return "left";
  if (f === "rate") return "right";
  const other = metric === x ? y : x;
  return familyOf(other) === "money" ? "right" : "left";
}

function formatPercentValue(v: number, intlLocale: string): string {
  return `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(v)}%`;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatDisplayCurrencyAmount,
  formatCount,
  intlLocale,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number; dataKey: string }[];
  label?: string;
  formatDisplayCurrencyAmount: (n: number, o?: { maximumFractionDigits?: number }) => string;
  formatCount: (n: number, o?: { compact?: boolean }) => string;
  intlLocale: string;
}) {
  if (!active || !payload?.length) return null;

  const formatVal = (dataKey: string, value: number) => {
    if (dataKey === "cost") return formatDisplayCurrencyAmount(value, { maximumFractionDigits: 0 });
    if (dataKey === "ctr") return formatPercentValue(value, intlLocale);
    return formatCount(value, { compact: false });
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(226,232,240,0.9)",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(7,41,207,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        padding: "10px 14px",
        fontSize: 12,
        minWidth: 120,
      }}
    >
      <p className="mb-2 text-xs font-bold text-[#0f172a]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-[#0f172a]">{formatVal(String(p.dataKey), p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
};

const DEFAULT_SELECTED: WeeklyMetricId[] = ["cost", "conversions"];

export default function CostConversionsChart() {
  const glowId = useId().replace(/:/g, "");
  const { t, intlLocale, convertMoneyUsdToDisplay, formatDisplayCurrencyAmount, formatCount } =
    useDashboardSettings();

  const [selected, setSelected] = useState<WeeklyMetricId[]>(DEFAULT_SELECTED);

  const toggleMetric = useCallback((id: WeeklyMetricId) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      if (prev.length < 2) return [...prev, id];
      return [prev[0], id];
    });
  }, []);

  const data = useMemo(
    () =>
      weeklyChartData.map((d) => {
        const ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
        return {
          day: t(d.dayKey),
          cost: convertMoneyUsdToDisplay(d.costUsd),
          conversions: d.conversions,
          impressions: d.impressions,
          clicks: d.clicks,
          ctr: Math.round(ctr * 100) / 100,
        };
      }),
    [t, convertMoneyUsdToDisplay],
  );

  const pair = useMemo((): [WeeklyMetricId, WeeklyMetricId] | [WeeklyMetricId] => {
    if (selected.length >= 2) return [selected[0], selected[1]];
    return [selected[0]];
  }, [selected]);

  const dual = pair.length === 2 && useDualAxis(pair[0], pair[1]);

  return (
    <div
      className="rounded-2xl p-6"
      style={cardStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 12px 36px rgba(7,41,207,0.10), 0 2px 8px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">{t("chart.costConversionsTitle")}</h2>
          <p className="mt-0.5 text-xs text-[#64748b]">{t("chart.metricsHint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {selected.map((id) => {
            const d = defOf(id);
            return (
              <span key={id} className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b]">
                <span
                  className="h-0.5 w-6 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
                    boxShadow: `0 0 6px ${d.color}60`,
                  }}
                />
                {t(d.labelKey).toUpperCase()}
              </span>
            );
          })}
        </div>
      </div>

      <fieldset className="mb-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
        <legend className="px-1 text-[10px] font-bold tracking-wide text-[#64748b] uppercase">
          {t("chart.metricsPicker")}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {WEEKLY_METRIC_DEFS.map((m) => {
            const on = selected.includes(m.id);
            return (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${
                  on ? "text-[#0f172a]" : "text-[#94a3b8]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleMetric(m.id)}
                  className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] focus:ring-[#0729cf]"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} aria-hidden />
                  {t(m.labelKey)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: dual ? 8 : 10, left: 0, bottom: 0 }}>
          <defs>
            <filter id={`lineGlowCC-${glowId}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" hide domain={["auto", "auto"]} />
          {dual && <YAxis yAxisId="right" orientation="right" hide domain={["auto", "auto"]} />}
          <Tooltip
            content={
              <ChartTooltip
                formatDisplayCurrencyAmount={formatDisplayCurrencyAmount}
                formatCount={formatCount}
                intlLocale={intlLocale}
              />
            }
          />
          {selected.map((mid) => {
            const d = defOf(mid);
            const axis = pair.length === 2 ? yAxisSide(mid, pair as [WeeklyMetricId, WeeklyMetricId]) : "left";
            const yId = axis === "left" ? "left" : "right";
            return (
              <Line
                key={mid}
                yAxisId={dual ? yId : "left"}
                type="monotone"
                dataKey={mid}
                name={t(d.labelKey)}
                stroke={d.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: d.color, strokeWidth: 2, stroke: "#fff" }}
                filter={mid === selected[0] ? `url(#lineGlowCC-${glowId})` : undefined}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
