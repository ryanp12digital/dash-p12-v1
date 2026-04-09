"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
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

const GMB_CHART_CARD_CLASS =
  "rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm";

const TOOLTIP_DARK = {
  borderRadius: 12,
  border: "1px solid rgba(82,82,82,0.8)",
  background: "#0a0a0a",
  color: "#e5e5e5",
} as const;

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
      ? "bg-emerald-950/35 text-emerald-300 ring-1 ring-emerald-800/50"
      : kpi.tone === "down"
        ? "bg-red-950/35 text-red-300 ring-1 ring-red-900/45"
        : "bg-neutral-800/50 text-neutral-400 ring-1 ring-neutral-700/80";

  return (
    <div
      className={`rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-4 backdrop-blur-md ${cardHover}`}
      style={{
        animation: `gmbKpiUp 0.45s ease both`,
        animationDelay: `${i * 35}ms`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex items-start gap-2">
        <h3 className="text-xs font-medium uppercase leading-snug tracking-widest text-neutral-500">{t(kpi.labelKey)}</h3>
      </div>

      <p className="mt-3 text-2xl font-light tracking-tight text-neutral-100">{main}</p>

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
          <p className="mt-3 text-xs text-neutral-500">
            <span className="font-medium text-neutral-600">{t("overview.prevPeriodValue")}: </span>
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
    <div className={GMB_CHART_CARD_CLASS}>
      <h3 className="mb-4 text-center text-base font-medium tracking-tight text-neutral-200">{t("gmb.chartDailyViews")}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={gmbDailySeries} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 9, fill: "#a3a3a3" }}
            interval={4}
            angle={-32}
            textAnchor="end"
            height={48}
            axisLine={{ stroke: "rgba(82,82,82,0.6)" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_DARK}
            labelStyle={{ color: "#a3a3a3" }}
            formatter={(v, name) => [formatCountIntl(Number(v ?? 0), intlLocale), String(name ?? "")]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => <span className="text-neutral-400">{value}</span>}
          />
          <Line type="monotone" dataKey="total" name={t("gmb.series.total")} stroke={GMB_LINE_COLORS.total} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="pesquisas" name={t("gmb.series.search")} stroke={GMB_LINE_COLORS.search} strokeWidth={2} dot={false} activeDot={{ r: 3.5 }} />
          <Line type="monotone" dataKey="mapas" name={t("gmb.series.maps")} stroke={GMB_LINE_COLORS.maps} strokeWidth={2} dot={false} activeDot={{ r: 3.5 }} />
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
    <div className={GMB_CHART_CARD_CLASS}>
      <h3 className="mb-4 text-center text-base font-medium tracking-tight text-neutral-200">{t("gmb.chartDailyActions")}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={gmbDailySeries} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 9, fill: "#a3a3a3" }}
            interval={4}
            angle={-32}
            textAnchor="end"
            height={48}
            axisLine={{ stroke: "rgba(82,82,82,0.6)" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} domain={[0, "auto"]} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_DARK}
            labelStyle={{ color: "#a3a3a3" }}
            formatter={(v, name) => [formatCountIntl(Number(v ?? 0), intlLocale), String(name ?? "")]}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} formatter={(value) => <span className="text-neutral-400">{value}</span>} />
          <Line type="monotone" dataKey="acoesTotal" name={t("gmb.series.actionsTotal")} stroke={GMB_LINE_COLORS.total} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="conversas" name={t("gmb.series.chat")} stroke={GMB_LINE_COLORS.chat} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="rotas" name={t("gmb.series.routes")} stroke={GMB_LINE_COLORS.routes} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="ligacoes" name={t("gmb.series.calls")} stroke={GMB_LINE_COLORS.calls} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="website" name={t("gmb.series.website")} stroke={GMB_LINE_COLORS.website} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="agendamentos" name={t("gmb.series.bookings")} stroke={GMB_LINE_COLORS.bookings} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="pedidos" name={t("gmb.series.orders")} stroke={GMB_LINE_COLORS.orders} strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
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
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/50">
            <IconGoogleBusiness className="h-6 w-6 text-sky-400" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-neutral-100">{t("overview.sectionGmb")}</h2>
            <p className="mt-0.5 text-xs font-light text-neutral-500">{t("overview.sectionGmbHint")}</p>
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
