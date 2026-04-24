"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { multiMetricData } from "@/lib/data";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

const METRIC_KEYS = [
  { key: "cost", labelKey: "chart.cost", color: "#0729cf" },
  { key: "conversions", labelKey: "chart.conversions", color: "#22d3ee" },
  { key: "cpa", labelKey: "kpi.cpa", color: "#f43f5e" },
  { key: "roas", labelKey: "kpi.roas", color: "#a3e635" },
] as const;

function MultiTooltip({
  active,
  payload,
  label,
  formatDisplayCurrencyAmount,
  formatCount,
  formatRatio,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number; dataKey: string }[];
  label?: string;
  formatDisplayCurrencyAmount: (n: number, o?: { maximumFractionDigits?: number }) => string;
  formatCount: (n: number, o?: { compact?: boolean }) => string;
  formatRatio: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
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
        minWidth: 140,
      }}
    >
      <p className="mb-2 text-xs font-bold text-[#0f172a]">{label}</p>
      {payload.map((p) => {
        let text: string;
        if (p.dataKey === "cost") text = formatDisplayCurrencyAmount(p.value, { maximumFractionDigits: 0 });
        else if (p.dataKey === "cpa") text = formatDisplayCurrencyAmount(p.value, { maximumFractionDigits: 2 });
        else if (p.dataKey === "roas") text = formatRatio(p.value);
        else text = formatCount(p.value);
        return (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#64748b]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-bold text-[#0f172a]">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
};

export default function MultiMetricChart() {
  const { t, convertMoneyUsdToDisplay, formatDisplayCurrencyAmount, formatCount, formatRatio } =
    useDashboardSettings();

  const data = useMemo(
    () =>
      multiMetricData.map((m) => ({
        month: t(m.monthKey),
        cost: convertMoneyUsdToDisplay(m.costUsd),
        cpa: convertMoneyUsdToDisplay(m.cpaUsd),
        conversions: m.conversions,
        roas: m.roas,
      })),
    [t, convertMoneyUsdToDisplay],
  );

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">{t("multi.title")}</h2>
          <p className="mt-0.5 text-xs text-[#94a3b8]">{t("multi.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {METRIC_KEYS.map((m) => (
            <span key={m.key} className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b]">
              <span
                className="h-0.5 w-6 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                  boxShadow: `0 0 6px ${m.color}60`,
                }}
              />
              {t(m.labelKey).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            content={
              <MultiTooltip
                formatDisplayCurrencyAmount={formatDisplayCurrencyAmount}
                formatCount={formatCount}
                formatRatio={formatRatio}
              />
            }
          />
          {METRIC_KEYS.map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={t(m.labelKey)}
              stroke={m.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: m.color, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
