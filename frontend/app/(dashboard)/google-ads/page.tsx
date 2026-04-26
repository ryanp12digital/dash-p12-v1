"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  DollarSign,
  Percent,
  BarChart2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconGoogleAds } from "@/components/platform-icons";
import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import DashboardPeriodLegend from "@/components/DashboardPeriodLegend";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS, DASHBOARD_TABLE_SCROLL_AREA_CLASS } from "@/lib/dashboard-layout";
import PageWidgetLayout from "@/components/dashboard/PageWidgetLayout";
import MicroSparkline from "@/components/dashboard/MicroSparkline";

const CHART_COLORS = {
  cost: "#3a7ae8",
  clicks: "#34D399",
  impressions: "#8B5CF6",
  conversions: "#22D3EE",
} as const;

const weeklyData = [
  { week: "25 Mar", cost: 3200, clicks: 1820, impressions: 62000, conversions: 48 },
  { week: "01 Abr", cost: 3850, clicks: 2100, impressions: 71000, conversions: 55 },
  { week: "08 Abr", cost: 4100, clicks: 2350, impressions: 78000, conversions: 63 },
  { week: "15 Abr", cost: 3750, clicks: 2050, impressions: 69000, conversions: 52 },
  { week: "22 Abr", cost: 4320, clicks: 2480, impressions: 83000, conversions: 71 },
  { week: "29 Abr", cost: 3980, clicks: 2210, impressions: 74000, conversions: 58 },
  { week: "06 Mai", cost: 4580, clicks: 2640, impressions: 91200, conversions: 78 },
];

const deviceData = [
  { device: "Mobile", clicks: 5820, cost: 11340, ctr: 3.2 },
  { device: "Desktop", clicks: 4960, cost: 9680, ctr: 2.5 },
  { device: "Tablet", clicks: 1703, cost: 2074, ctr: 1.9 },
];

const campaigns = [
  { name: "Marca — Search", status: "active",  impressions: 182400, clicks: 4820, ctr: 2.64, cpc: 1.62, cost: 7808,  conv: 142, cpa: 54.99, roas: 5.2  },
  { name: "Concorrentes — Search", status: "active", impressions: 98200, clicks: 2340, ctr: 2.38, cpc: 2.10, cost: 4914, conv: 68, cpa: 72.26, roas: 3.8 },
  { name: "Display — Remarketing", status: "active", impressions: 214000, clicks: 1820, ctr: 0.85, cpc: 0.96, cost: 1747, conv: 34, cpa: 51.38, roas: 4.6 },
  { name: "PMAX — Conversões", status: "active", impressions: 127600, clicks: 2980, ctr: 2.34, cpc: 1.88, cost: 5602, conv: 98, cpa: 57.17, roas: 4.9 },
  { name: "YouTube — Awareness", status: "paused", impressions: 89400, clicks: 524, ctr: 0.59, cpc: 0.54, cost: 283, conv: 0, cpa: 0, roas: 0 },
  { name: "Shopping — Produtos", status: "active", impressions: 53600, clicks: 2000, ctr: 3.73, cpc: 1.37, cost: 2740, conv: 0, cpa: 0, roas: 0 },
];

const prevFactor = 0.88;
const kpis: {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  positive: boolean;
  trend: number[];
  trendPrevious: number[];
}[] = [
  { label: "Cliques",        value: "12.483",    change: +14.2, icon: MousePointerClick, positive: true,  trend: weeklyData.map((d) => d.clicks),                        trendPrevious: weeklyData.map((d) => d.clicks * prevFactor) },
  { label: "Impressões",     value: "428.750",   change: +9.8,  icon: Eye,              positive: true,  trend: weeklyData.map((d) => d.impressions / 2000),            trendPrevious: weeklyData.map((d) => (d.impressions * prevFactor) / 2000) },
  { label: "CTR Médio",      value: "2,91%",     change: +0.3,  icon: Percent,          positive: true,  trend: weeklyData.map((d) => (d.clicks / Math.max(1, d.impressions)) * 10_000), trendPrevious: weeklyData.map((d) => (d.clicks * prevFactor / Math.max(1, d.impressions * prevFactor)) * 10_000) },
  { label: "Custo Total",    value: "R$ 23.094", change: +18.4, icon: DollarSign,       positive: false, trend: weeklyData.map((d) => d.cost / 80),                      trendPrevious: weeklyData.map((d) => (d.cost * prevFactor) / 80) },
  { label: "Conversões",     value: "342",        change: +21.6, icon: Target,           positive: true,  trend: weeklyData.map((d) => d.conversions * 3),                 trendPrevious: weeklyData.map((d) => d.conversions * prevFactor * 3) },
  { label: "CPA Médio",      value: "R$ 67,52",  change: -4.1,  icon: BarChart2,        positive: true,  trend: weeklyData.map((d) => d.cost / Math.max(1, d.conversions)), trendPrevious: weeklyData.map((d) => (d.cost * prevFactor) / Math.max(1, d.conversions * prevFactor)) },
  { label: "ROAS",           value: "4,2×",      change: +0.6,  icon: TrendingUp,       positive: true,  trend: weeklyData.map((d) => 3 + d.conversions / 40),             trendPrevious: weeklyData.map((d) => 3 + (d.conversions * prevFactor) / 40) },
  { label: "CPC Médio",      value: "R$ 1,85",   change: -2.3,  icon: TrendingDown,     positive: true,  trend: weeklyData.map((d) => (d.cost / Math.max(1, d.clicks)) * 0.1), trendPrevious: weeklyData.map((d) => (d.cost * prevFactor / Math.max(1, d.clicks * prevFactor)) * 0.1) },
];

type SortKey = keyof (typeof campaigns)[0];

const tooltipStyle = {
  backgroundColor: "rgba(7,9,16,0.97)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

export default function GoogleAdsPage() {
  const { t } = useDashboardSettings();
  const [activeMetric, setActiveMetric] = useState<"cost" | "clicks" | "conversions">("cost");
  const [sortKey, setSortKey] = useState<string>("cost");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...campaigns].sort((a, b) => {
    const av = a[sortKey as SortKey] as number;
    const bv = b[sortKey as SortKey] as number;
    return sortAsc ? av - bv : bv - av;
  });

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  const SortIcon = ({ k }: { k: string }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : null;

  const kpiBlock = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="dashboard-card flex min-h-[128px] flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
              {kpi.label}
            </p>
            <kpi.icon className="h-3.5 w-3.5 text-(--text-muted)" aria-hidden />
          </div>
          <p className="font-data text-2xl font-light text-(--text-primary)">{kpi.value}</p>
          <MicroSparkline values={kpi.trend} previousValues={kpi.trendPrevious} />
          <span
            className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              kpi.positive
                ? "bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-900/40"
                : "bg-rose-950/50 text-rose-300 ring-1 ring-rose-900/40"
            }`}
          >
            {kpi.change > 0 ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {kpi.change > 0 ? "+" : ""}
            {kpi.change}%
          </span>
        </div>
      ))}
    </div>
  );

  const chartsBlock = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="dashboard-card p-5 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-(--text-primary)">Evolução Semanal</p>
          <div className="flex gap-1">
            {(["cost", "clicks", "conversions"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMetric(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeMetric === m
                    ? "bg-(--accent-soft) text-(--accent)"
                    : "text-(--text-muted) hover:text-(--text-secondary)"
                }`}
              >
                {{ cost: "Custo", clicks: "Cliques", conversions: "Conversões" }[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="rgba(45,65,120,0.15)" strokeDasharray="4 4" />
            <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(58,122,232,0.15)" }} />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={CHART_COLORS[activeMetric]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[activeMetric], r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-card p-5">
        <p className="mb-4 text-sm font-semibold text-(--text-primary)">Cliques por Dispositivo</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deviceData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={28}>
            <CartesianGrid stroke="rgba(45,65,120,0.15)" strokeDasharray="4 4" />
            <XAxis dataKey="device" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(58,122,232,0.06)" }} />
            <Bar dataKey="clicks" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const tableBlock = (
    <div className="dashboard-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
        <p className="text-sm font-semibold text-(--text-primary)">Campanhas</p>
        <span className="text-xs text-(--text-muted)">{campaigns.length} campanhas</span>
      </div>
      <div className={DASHBOARD_TABLE_SCROLL_AREA_CLASS}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-(--surface-strong)">
            <tr>
              {[
                { label: "Campanha",    key: "name"        },
                { label: "Impressões",  key: "impressions" },
                { label: "Cliques",     key: "clicks"      },
                { label: "CTR",         key: "ctr"         },
                { label: "CPC",         key: "cpc"         },
                { label: "Custo",       key: "cost"        },
                { label: "Conversões",  key: "conv"        },
                { label: "CPA",         key: "cpa"         },
                { label: "ROAS",        key: "roas"        },
              ].map(({ label, key }) => (
                <th
                  key={key}
                  onClick={() => key !== "name" && toggleSort(key)}
                  className={`px-4 py-3 text-left text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase select-none ${
                    key !== "name" ? "cursor-pointer hover:text-(--text-secondary)" : ""
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon k={key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.name}
                className="border-t border-(--border) transition-colors hover:bg-(--accent-soft)"
              >
                <td className="px-4 py-3 font-medium text-(--text-primary)">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.status === "active" ? "bg-emerald-400" : "bg-(--text-muted)"
                      }`}
                    />
                    {c.name}
                  </div>
                </td>
                <td className="font-data px-4 py-3 text-(--text-secondary)">{c.impressions.toLocaleString("pt-BR")}</td>
                <td className="font-data px-4 py-3 text-(--text-primary)">{c.clicks.toLocaleString("pt-BR")}</td>
                <td className="font-data px-4 py-3 text-(--text-secondary)">{c.ctr.toFixed(2)}%</td>
                <td className="font-data px-4 py-3 text-(--text-secondary)">R$ {c.cpc.toFixed(2)}</td>
                <td className="font-data px-4 py-3 font-medium text-(--text-primary)">R$ {c.cost.toLocaleString("pt-BR")}</td>
                <td className="font-data px-4 py-3 text-(--text-primary)">{c.conv}</td>
                <td className="font-data px-4 py-3 text-(--text-secondary)">{c.cpa > 0 ? `R$ ${c.cpa.toFixed(2)}` : "—"}</td>
                <td className="font-data px-4 py-3">
                  {c.roas > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/50 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-900/50">
                      {c.roas.toFixed(1)}×
                    </span>
                  ) : (
                    <span className="text-(--text-muted)">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="text-(--text-muted) transition-colors hover:text-(--accent)">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent-soft)">
            <IconGoogleAds className="h-5 w-5 text-(--accent)" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-(--accent) uppercase opacity-80">
              {t("placeholder.kicker.googleAds")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">
              Google Ads
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <DashboardDateCompareToolbar />
          <DashboardPeriodLegend />
        </div>
      </div>

      <PageWidgetLayout
        layoutId="google-ads"
        blocks={[
          { id: "kpis", labelKey: "pageBlock.google.kpis", content: kpiBlock },
          { id: "charts", labelKey: "pageBlock.google.charts", content: chartsBlock },
          { id: "table", labelKey: "pageBlock.google.table", content: tableBlock },
        ]}
      />

      <footer className="py-4 text-center text-xs text-(--text-muted)">{t("overview.footer")}</footer>
    </main>
  );
}
