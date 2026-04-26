"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Search,
  MapPin,
  Phone,
  Navigation,
  Globe,
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconGoogleBusiness } from "@/components/platform-icons";
import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import DashboardPeriodLegend from "@/components/DashboardPeriodLegend";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS, DASHBOARD_TABLE_SCROLL_AREA_CLASS } from "@/lib/dashboard-layout";
import PageWidgetLayout from "@/components/dashboard/PageWidgetLayout";
import MicroSparkline from "@/components/dashboard/MicroSparkline";

const tooltipStyle = {
  backgroundColor: "rgba(7,9,16,0.97)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

const weeklyViews = [
  { week: "25 Mar", search: 1240, maps: 480 },
  { week: "01 Abr", search: 1380, maps: 530 },
  { week: "08 Abr", search: 1520, maps: 610 },
  { week: "15 Abr", search: 1290, maps: 495 },
  { week: "22 Abr", search: 1650, maps: 640 },
  { week: "29 Abr", search: 1410, maps: 568 },
  { week: "06 Mai", search: 1760, maps: 720 },
];

const actionsData = [
  { week: "25 Mar", calls: 38, directions: 22, website: 148 },
  { week: "01 Abr", calls: 44, directions: 27, website: 162 },
  { week: "08 Abr", calls: 51, directions: 31, website: 189 },
  { week: "15 Abr", calls: 42, directions: 24, website: 155 },
  { week: "22 Abr", calls: 58, directions: 35, website: 201 },
  { week: "29 Abr", calls: 47, directions: 28, website: 171 },
  { week: "06 Mai", calls: 64, directions: 39, website: 218 },
];

const ratingTrend = [4.6, 4.65, 4.7, 4.72, 4.75, 4.78, 4.8];
const reviewsTrend = [90, 95, 100, 108, 115, 120, 127];
const newReviewsTrend = [2, 3, 4, 3, 5, 8, 12];
const g = 0.9;

const kpis: {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  positive: boolean;
  trend: number[];
  trendPrevious: number[];
}[] = [
  { label: "Buscas (Search)", value: "8.450",  change: +12.4, icon: Search,       positive: true,  trend: weeklyViews.map((w) => w.search / 6),            trendPrevious: weeklyViews.map((w) => (w.search * g) / 6) },
  { label: "Buscas (Maps)",   value: "3.120",  change: +8.6,  icon: MapPin,       positive: true,  trend: weeklyViews.map((w) => w.maps / 2),              trendPrevious: weeklyViews.map((w) => (w.maps * g) / 2) },
  { label: "Ligações",        value: "284",    change: +18.3, icon: Phone,        positive: true,  trend: actionsData.map((w) => w.calls * 2),            trendPrevious: actionsData.map((w) => w.calls * g * 2) },
  { label: "Rotas",           value: "156",    change: +5.2,  icon: Navigation,   positive: true,  trend: actionsData.map((w) => w.directions * 3),       trendPrevious: actionsData.map((w) => w.directions * g * 3) },
  { label: "Site Cliques",    value: "1.089",  change: +9.7,  icon: Globe,        positive: true,  trend: actionsData.map((w) => w.website / 2),           trendPrevious: actionsData.map((w) => (w.website * g) / 2) },
  { label: "Avaliação Média", value: "4,8 ★",  change: +0.1,  icon: Star,         positive: true,  trend: ratingTrend,                            trendPrevious: ratingTrend.map((v) => v * 0.995) },
  { label: "Total Avaliações", value: "127",  change: +10.4, icon: MessageSquare, positive: true,  trend: reviewsTrend,                        trendPrevious: reviewsTrend.map((v) => v * g) },
  { label: "Novas Avaliações", value: "12",   change: +33.3, icon: TrendingUp,   positive: true,  trend: newReviewsTrend,                        trendPrevious: newReviewsTrend.map((v) => v * g) },
];

const reviews = [
  { author: "Ana Beatriz M.", rating: 5, text: "Equipe incrível, resultado acima do esperado! Recomendo muito.", date: "20 Abr" },
  { author: "Carlos Eduardo S.", rating: 5, text: "Profissionalismo e entrega no prazo. Excelente parceria.", date: "18 Abr" },
  { author: "Marina F.", rating: 4, text: "Muito bom atendimento, cumpriram com o prometido.", date: "15 Abr" },
  { author: "Ricardo A.", rating: 5, text: "Os resultados melhoraram significativamente após a parceria.", date: "12 Abr" },
  { author: "Fernanda L.", rating: 4, text: "Bom trabalho, ainda há espaço para crescer mas no geral positivo.", date: "08 Abr" },
];

const searchTerms = [
  { term: "agência de marketing digital", impressions: 1840, actions: 124 },
  { term: "p12 digital",                  impressions: 1220, actions: 89  },
  { term: "gestão de tráfego pago",       impressions: 980,  actions: 67  },
  { term: "google ads sp",               impressions: 740,  actions: 48  },
  { term: "meta ads agência",            impressions: 620,  actions: 41  },
];

export default function GoogleMeuNegocioPage() {
  const { t } = useDashboardSettings();
  const [viewsMetric, setViewsMetric] = useState<"search" | "maps">("search");

  const kpiBlock = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="dashboard-card flex min-h-[120px] flex-col gap-1 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
              {kpi.label}
            </p>
            <kpi.icon className="h-3.5 w-3.5 text-(--text-muted)" aria-hidden />
          </div>
          <p className="font-data text-2xl font-light text-(--text-primary)">{kpi.value}</p>
          <MicroSparkline
            values={kpi.trend}
            previousValues={kpi.trendPrevious}
            color="var(--accent)"
          />
          <span
            className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              kpi.positive
                ? "bg-emerald-950/50 text-emerald-300 ring-1 ring-emerald-900/40"
                : "bg-rose-950/50 text-rose-300 ring-1 ring-rose-900/40"
            }`}
          >
            {kpi.change > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {kpi.change > 0 ? "+" : ""}
            {kpi.change}%
          </span>
        </div>
      ))}
    </div>
  );

  const chartsBlock = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="dashboard-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-(--text-primary)">Visualizações por Canal</p>
          <div className="flex gap-1">
            {(["search", "maps"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewsMetric(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewsMetric === m
                    ? "bg-(--accent-soft) text-(--accent)"
                    : "text-(--text-muted) hover:text-(--text-secondary)"
                }`}
              >
                {{ search: "Search", maps: "Maps" }[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weeklyViews} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="gmb-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(45,65,120,0.15)" strokeDasharray="4 4" />
            <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(58,122,232,0.15)" }} />
            <Area
              type="monotone"
              dataKey={viewsMetric}
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#gmb-grad)"
              dot={{ r: 3, strokeWidth: 0, fill: "var(--accent)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-card p-5">
        <p className="mb-4 text-sm font-semibold text-(--text-primary)">Ações dos Usuários</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={actionsData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={10}>
            <CartesianGrid stroke="rgba(45,65,120,0.15)" strokeDasharray="4 4" />
            <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(58,122,232,0.06)" }} />
            <Bar dataKey="calls"      fill="var(--accent)" radius={[3, 3, 0, 0]} name="Ligações" />
            <Bar dataKey="directions" fill="#2eb8c8" radius={[3, 3, 0, 0]} name="Rotas" />
            <Bar dataKey="website"   fill="#34D399" radius={[3, 3, 0, 0]} name="Site" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4 text-xs text-(--text-muted)">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />Ligações</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2eb8c8]" />Rotas</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#34D399]" />Site</span>
        </div>
      </div>
    </div>
  );

  const termsBlock = (
    <div className="dashboard-card overflow-hidden p-0">
      <div className="border-b border-(--border) px-5 py-4">
        <p className="text-sm font-semibold text-(--text-primary)">Termos de Busca</p>
      </div>
      <div className={DASHBOARD_TABLE_SCROLL_AREA_CLASS}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-(--surface-strong)">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">Termo</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">Impressões</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {searchTerms.map((s, i) => (
              <tr key={i} className="border-t border-(--border) transition-colors hover:bg-(--accent-soft)">
                <td className="px-4 py-3 text-(--text-primary)">{s.term}</td>
                <td className="font-data px-4 py-3 text-right text-(--text-secondary)">{s.impressions.toLocaleString("pt-BR")}</td>
                <td className="font-data px-4 py-3 text-right font-medium text-(--text-primary)">{s.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const reviewsBlock = (
    <div className="dashboard-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
        <p className="text-sm font-semibold text-(--text-primary)">Avaliações Recentes</p>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="font-data text-sm font-medium text-(--text-primary)">4,8</span>
          <span className="text-xs text-(--text-muted)">(127)</span>
        </div>
      </div>
      <div className="divide-y divide-(--border)">
        {reviews.map((r, i) => (
          <div key={i} className="px-5 py-4 transition-colors hover:bg-(--accent-soft)">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-(--text-primary)">{r.author}</p>
                <div className="mt-0.5 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s < r.rating ? "fill-amber-400 text-amber-400" : "text-(--text-muted)"}`}
                    />
                  ))}
                </div>
              </div>
              <span className="whitespace-nowrap text-xs text-(--text-muted)">{r.date}</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs text-(--text-secondary)">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent-soft)">
            <IconGoogleBusiness className="h-5 w-5 text-[#34D399]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-(--accent) uppercase opacity-80">
              {t("placeholder.kicker.gmb")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">
              Google Meu Negócio
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <DashboardDateCompareToolbar />
          <DashboardPeriodLegend />
        </div>
      </div>

      <PageWidgetLayout
        layoutId="google-meu-negocio"
        blocks={[
          { id: "kpis", labelKey: "pageBlock.gmb.kpis", content: kpiBlock },
          { id: "charts", labelKey: "pageBlock.gmb.charts", content: chartsBlock },
          { id: "terms", labelKey: "pageBlock.gmb.terms", content: termsBlock },
          { id: "reviews", labelKey: "pageBlock.gmb.reviews", content: reviewsBlock },
        ]}
      />

      <footer className="py-4 text-center text-xs text-(--text-muted)">{t("overview.footer")}</footer>
    </main>
  );
}
