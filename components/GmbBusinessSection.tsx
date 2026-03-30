"use client";

import { CircleHelp, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { IconGoogleBusiness } from "@/components/platform-icons";
import {
  GMB_LINE_COLORS,
  gmbKpiData,
  gmbDailySeries,
  type GmbKpiRow,
} from "@/lib/overview-gmb-social-data";

const cardHover =
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md";

function formatChangePct(pct: number, intlLocale: string): string {
  if (pct === 0) return "0%";
  return `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2, signDisplay: "always" }).format(pct)}%`;
}

function GmbKpiCard({ kpi, i }: { kpi: GmbKpiRow; i: number }) {
  const { t, intlLocale, formatCount } = useDashboardSettings();
  const { compareWithPrevious } = useOverviewScope();

  const main = formatCount(kpi.current, { compact: false });
  const prevFormatted = formatCount(kpi.prev, { compact: false });
  const pct = formatChangePct(kpi.changePct, intlLocale);

  const pillClass =
    kpi.tone === "up"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
      : kpi.tone === "down"
        ? "bg-red-50 text-red-700 ring-1 ring-red-200/80"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80";

  return (
    <div
      className={`rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm ${cardHover}`}
      style={{
        animation: `gmbKpiUp 0.45s ease both`,
        animationDelay: `${i * 35}ms`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-[#0f172a]">{t(kpi.labelKey)}</h3>
        <button
          type="button"
          className="shrink-0 rounded-md p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
          title={t(kpi.helpKey)}
          aria-label={t(kpi.helpKey)}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-[#0f172a]">{main}</p>

      {compareWithPrevious && (
        <>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pillClass}`}>
              {kpi.tone === "up" && <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "down" && <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "neutral" && <Minus className="h-3.5 w-3.5 opacity-70" aria-hidden />}
              {pct}
            </span>
          </div>
          <p className="mt-3 text-xs text-[#64748b]">
            <span className="font-medium text-[#94a3b8]">{t("overview.prevPeriodValue")}: </span>
            {prevFormatted}
          </p>
        </>
      )}
    </div>
  );
}

function DailyViewsChart() {
  const { t, intlLocale } = useDashboardSettings();
  return (
    <div
      className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
    >
      <h3 className="mb-3 text-center text-sm font-semibold text-[#0f172a]">{t("gmb.chartDailyViews")}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={gmbDailySeries} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={4} angle={-32} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            formatter={(v, name) => [formatCountIntl(Number(v ?? 0), intlLocale), String(name ?? "")]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => <span className="text-[#475569]">{value}</span>}
          />
          <Line type="monotone" dataKey="total" name={t("gmb.series.total")} stroke={GMB_LINE_COLORS.total} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="pesquisas" name={t("gmb.series.search")} stroke={GMB_LINE_COLORS.search} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="mapas" name={t("gmb.series.maps")} stroke={GMB_LINE_COLORS.maps} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCountIntl(v: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(v);
}

function DailyActionsChart() {
  const { t, intlLocale } = useDashboardSettings();
  return (
    <div
      className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
    >
      <h3 className="mb-3 text-center text-sm font-semibold text-[#0f172a]">{t("gmb.chartDailyActions")}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={gmbDailySeries} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={4} angle={-32} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            formatter={(v, name) => [formatCountIntl(Number(v ?? 0), intlLocale), String(name ?? "")]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span className="text-[#475569]">{value}</span>} />
          <Line type="monotone" dataKey="acoesTotal" name={t("gmb.series.actionsTotal")} stroke={GMB_LINE_COLORS.total} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="conversas" name={t("gmb.series.chat")} stroke={GMB_LINE_COLORS.chat} strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="rotas" name={t("gmb.series.routes")} stroke={GMB_LINE_COLORS.routes} strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="ligacoes" name={t("gmb.series.calls")} stroke={GMB_LINE_COLORS.calls} strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="website" name={t("gmb.series.website")} stroke={GMB_LINE_COLORS.website} strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="agendamentos" name={t("gmb.series.bookings")} stroke={GMB_LINE_COLORS.bookings} strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="pedidos" name={t("gmb.series.orders")} stroke={GMB_LINE_COLORS.orders} strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function GmbBusinessSection() {
  const { t } = useDashboardSettings();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
            <IconGoogleBusiness className="h-6 w-6 text-[#4285F4]" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">{t("overview.sectionGmb")}</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">{t("overview.sectionGmbHint")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {gmbKpiData.map((kpi, i) => (
          <GmbKpiCard key={kpi.labelKey} kpi={kpi} i={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyViewsChart />
        <DailyActionsChart />
      </div>

      <style>{`
        @keyframes gmbKpiUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
