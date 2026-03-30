"use client";

import type { ReactNode } from "react";
import { CircleHelp, ArrowDown } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import {
  META_IMPRESSION_COLOR,
  META_REACH_COLOR,
  metaReachByDevice,
  metaImpressionsReachByHour,
  metaImpressionsReachByAge,
  metaImpressionsReachByGender,
  metaTopRegions,
} from "@/lib/meta-ads-data";

function ChartCard({ titleKey, helpKey, children }: { titleKey: string; helpKey: string; children: ReactNode }) {
  const { t } = useDashboardSettings();
  return (
    <div
      className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
    >
      <div className="mb-3 flex items-center justify-center gap-1.5">
        <h3 className="text-center text-sm font-semibold text-[#0f172a]">{t(titleKey)}</h3>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
          title={t(helpKey)}
          aria-label={t(helpKey)}
        >
          <CircleHelp className="h-3 w-3" />
        </button>
      </div>
      <div className="min-h-[220px] flex-1">{children}</div>
    </div>
  );
}

export default function MetaAdsChartsSection() {
  const { t, formatDisplayCurrencyAmount, formatCount, intlLocale } = useDashboardSettings();

  const devicePie = metaReachByDevice.map((d) => ({
    name: t(d.nameKey),
    value: d.pct,
    color: d.color,
  }));

  const genderRows = metaImpressionsReachByGender.map((r) => ({
    name: t(r.generoKey),
    impressoes: r.impressoes,
    alcance: r.alcance,
  }));

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titleKey="meta.chartReachByDevice" helpKey="meta.help.reachByDevice">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip
                formatter={(v, _n, item) => {
                  const name =
                    item && typeof item === "object" && "payload" in item
                      ? String((item.payload as { name?: string }).name ?? "")
                      : "";
                  return [`${Number(v ?? 0).toFixed(2)}%`, name];
                }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Legend formatter={(value) => <span className="text-[#475569]">{value}</span>} />
              <Pie data={devicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={1}>
                {devicePie.map((e, i) => (
                  <Cell key={i} fill={e.color} stroke="white" strokeWidth={1} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titleKey="meta.chartReachImpressionsHour" helpKey="meta.help.reachImpressionsHour">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metaImpressionsReachByHour} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#64748b" }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                formatter={(v, name) => [
                  formatCount(Number(v ?? 0), { compact: false }),
                  name === "impressoes" ? t("chart.impressions") : t("meta.seriesReach"),
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-[#475569]">
                    {value === "impressoes" ? t("chart.impressions") : t("meta.seriesReach")}
                  </span>
                )}
              />
              <Bar dataKey="impressoes" fill={META_IMPRESSION_COLOR} radius={[2, 2, 0, 0]} name="impressoes" />
              <Bar dataKey="alcance" fill={META_REACH_COLOR} radius={[2, 2, 0, 0]} name="alcance" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titleKey="meta.chartReachImpressionsAge" helpKey="meta.help.reachImpressionsAge">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metaImpressionsReachByAge} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="faixa" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                formatter={(v, name) => [
                  formatCount(Number(v ?? 0), { compact: false }),
                  name === "impressoes" ? t("chart.impressions") : t("meta.seriesReach"),
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-[#475569]">
                    {value === "impressoes" ? t("chart.impressions") : t("meta.seriesReach")}
                  </span>
                )}
              />
              <Bar dataKey="impressoes" fill={META_IMPRESSION_COLOR} radius={[2, 2, 0, 0]} name="impressoes" />
              <Bar dataKey="alcance" fill={META_REACH_COLOR} radius={[2, 2, 0, 0]} name="alcance" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titleKey="meta.chartReachImpressionsGender" helpKey="meta.help.reachImpressionsGender">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={genderRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                formatter={(v, name) => [
                  formatCount(Number(v ?? 0), { compact: false }),
                  name === "impressoes" ? t("chart.impressions") : t("meta.seriesReach"),
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-[#475569]">
                    {value === "impressoes" ? t("chart.impressions") : t("meta.seriesReach")}
                  </span>
                )}
              />
              <Bar dataKey="impressoes" fill={META_IMPRESSION_COLOR} radius={[2, 2, 0, 0]} name="impressoes" />
              <Bar dataKey="alcance" fill={META_REACH_COLOR} radius={[2, 2, 0, 0]} name="alcance" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
      >
        <div className="flex items-center justify-center gap-1.5 border-b border-[#f1f5f9] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">{t("meta.tableRegionsTitle")}</h3>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"
            title={t("meta.tableRegionsHelp")}
            aria-label={t("meta.tableRegionsHelp")}
          >
            <CircleHelp className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                <th className="px-4 py-3 sm:px-6">{t("meta.colRegion")}</th>
                <th className="px-4 py-3 sm:px-6">
                  <span className="inline-flex items-center gap-1">
                    {t("meta.colReach")}
                    <ArrowDown className="h-3.5 w-3.5 text-[#0729cf]" aria-hidden />
                  </span>
                </th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colImpressions")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colFrequency")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colSpent")}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t("meta.colCpm")}</th>
              </tr>
            </thead>
            <tbody>
              {metaTopRegions.map((row) => (
                <tr key={row.regionKey} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc]/90">
                  <td className="px-4 py-3 text-sm font-medium text-[#0f172a] sm:px-6">{t(row.regionKey)}</td>
                  <td className="px-4 py-3 text-sm text-[#0f172a] sm:px-6">{formatCount(row.alcance)}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#0f172a] sm:px-6">{formatCount(row.impressoes)}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#0f172a] sm:px-6">
                    {new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.frequencia)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-[#0f172a] sm:px-6">
                    {formatDisplayCurrencyAmount(row.valorInvestido, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#0f172a] sm:px-6">
                    {formatDisplayCurrencyAmount(row.cpm, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
