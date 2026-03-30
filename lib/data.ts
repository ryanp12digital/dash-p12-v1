/** Valores monetários em USD (base para conversão BRL via cotação do dia). */

export type KpiKind = "count" | "money";

export type KpiPlatform = "meta" | "google" | "facebook" | "instagram";

export type KpiSection = "ads" | "social";

export type KpiChangeTone = "up" | "down" | "neutral";

export type KpiRow = {
  labelKey: string;
  helpKey: string;
  kind: KpiKind;
  section: KpiSection;
  platforms: KpiPlatform[];
  prev: number;
  current: number;
  /** Variação percentual vs período anterior (ex.: -4.86 = -4,86%). */
  changePct: number;
  tone: KpiChangeTone;
};

/**
 * Visão geral — métricas de anúncios (Meta + Google) e redes sociais (Facebook + Instagram).
 * Valor investido: USD base ~ equivalente aos R$ da referência (cotação ~5,5).
 */
export const kpiData: KpiRow[] = [
  {
    labelKey: "kpi.investedValue",
    helpKey: "kpi.help.investedValue",
    kind: "money",
    section: "ads",
    platforms: ["meta", "google"],
    prev: 14229.86 / 5.5,
    current: 13538.32 / 5.5,
    changePct: -4.86,
    tone: "down",
  },
  {
    labelKey: "kpi.impressions",
    helpKey: "kpi.help.impressions",
    kind: "count",
    section: "ads",
    platforms: ["meta", "google"],
    prev: 411_348,
    current: 161_354,
    changePct: -60.77,
    tone: "down",
  },
  {
    labelKey: "kpi.clicks",
    helpKey: "kpi.help.clicks",
    kind: "count",
    section: "ads",
    platforms: ["meta", "google"],
    prev: 14_019,
    current: 2596,
    changePct: -81.48,
    tone: "down",
  },
  {
    labelKey: "kpi.adsCount",
    helpKey: "kpi.help.adsCount",
    kind: "count",
    section: "ads",
    platforms: ["meta", "google"],
    prev: 49,
    current: 50,
    changePct: 2.04,
    tone: "up",
  },
  {
    labelKey: "kpi.reach",
    helpKey: "kpi.help.reach",
    kind: "count",
    section: "social",
    platforms: ["facebook", "instagram"],
    prev: 50_833,
    current: 48_375,
    changePct: -4.84,
    tone: "down",
  },
  {
    labelKey: "kpi.postEngagement",
    helpKey: "kpi.help.postEngagement",
    kind: "count",
    section: "social",
    platforms: ["facebook", "instagram"],
    prev: 1728,
    current: 1843,
    changePct: 6.78,
    tone: "up",
  },
  {
    labelKey: "kpi.newFollowers",
    helpKey: "kpi.help.newFollowers",
    kind: "count",
    section: "social",
    platforms: ["facebook", "instagram"],
    prev: 5,
    current: 4,
    changePct: -20,
    tone: "down",
  },
  {
    labelKey: "kpi.postsCount",
    helpKey: "kpi.help.postsCount",
    kind: "count",
    section: "social",
    platforms: ["facebook", "instagram"],
    prev: 0,
    current: 0,
    changePct: 0,
    tone: "neutral",
  },
];

export type WeeklyChartRow = {
  dayKey: string;
  costUsd: number;
  conversions: number;
  impressions: number;
  clicks: number;
};

export const weeklyChartData: WeeklyChartRow[] = [
  { dayKey: "week.mon", costUsd: 1800, conversions: 95, impressions: 42_000, clicks: 1100 },
  { dayKey: "week.tue", costUsd: 2200, conversions: 120, impressions: 51_000, clicks: 1380 },
  { dayKey: "week.wed", costUsd: 1950, conversions: 108, impressions: 46_200, clicks: 1210 },
  { dayKey: "week.thu", costUsd: 2600, conversions: 145, impressions: 58_800, clicks: 1620 },
  { dayKey: "week.fri", costUsd: 2100, conversions: 130, impressions: 49_500, clicks: 1420 },
  { dayKey: "week.sat", costUsd: 1600, conversions: 85, impressions: 36_000, clicks: 920 },
  { dayKey: "week.sun", costUsd: 1400, conversions: 70, impressions: 31_200, clicks: 780 },
];

export type CampaignChannelKey = "pmax" | "youtube" | "search";

export type CampaignRow = {
  name: string;
  statusKey: string;
  channelKey: CampaignChannelKey;
  budgetUsdPerDay: number;
  costUsd: number;
  conversions: number;
  cpaUsd: number;
  roas: number;
  trend: "up" | "down" | "flat";
  highlight: boolean;
};

export const campaigns: CampaignRow[] = [
  {
    name: "Summer Promotion 2024",
    statusKey: "status.active",
    channelKey: "pmax",
    budgetUsdPerDay: 500,
    costUsd: 4520,
    conversions: 284,
    cpaUsd: 15.91,
    roas: 6.2,
    trend: "up",
    highlight: true,
  },
  {
    name: "Brand Awareness - Global",
    statusKey: "status.active",
    channelKey: "youtube",
    budgetUsdPerDay: 200,
    costUsd: 2100,
    conversions: 42,
    cpaUsd: 50.0,
    roas: 1.8,
    trend: "flat",
    highlight: false,
  },
  {
    name: "Product Launch Retargeting",
    statusKey: "status.paused",
    channelKey: "search",
    budgetUsdPerDay: 100,
    costUsd: 850,
    conversions: 115,
    cpaUsd: 7.39,
    roas: 11.4,
    trend: "down",
    highlight: false,
  },
];

/** Partilha de investimento por dispositivo (anúncios). */
export const deviceData = [
  { labelKey: "device.mobile", costUsd: 9200, percent: 68, color: "#0729cf" },
  { labelKey: "device.desktop", costUsd: 3100, percent: 22, color: "#2563eb" },
  { labelKey: "device.tablet", costUsd: 1200, percent: 10, color: "#60a5fa" },
];

export const placementData = [
  { labelKey: "placement.search", percent: 45, color: "#0729cf" },
  { labelKey: "placement.pmax", percent: 35, color: "#3b82f6" },
  { labelKey: "placement.youtube", percent: 20, color: "#60a5fa" },
];

/** Onde o utilizador acedeu ao conteúdo (app nativo vs web). */
export const accessTypeData = [
  { labelKey: "access.nativeApp", percent: 52, color: "#0729cf" },
  { labelKey: "access.mobileWeb", percent: 31, color: "#3b82f6" },
  { labelKey: "access.desktopWeb", percent: 17, color: "#94a3b8" },
];

export const multiMetricData = [
  { monthKey: "months.jan", costUsd: 8200, conversions: 420, cpaUsd: 19.5, roas: 3.8 },
  { monthKey: "months.feb", costUsd: 9100, conversions: 510, cpaUsd: 17.8, roas: 4.1 },
  { monthKey: "months.mar", costUsd: 11500, conversions: 680, cpaUsd: 16.9, roas: 4.4 },
  { monthKey: "months.apr", costUsd: 13200, conversions: 820, cpaUsd: 16.1, roas: 4.7 },
  { monthKey: "months.may", costUsd: 12800, conversions: 890, cpaUsd: 14.4, roas: 5.1 },
  { monthKey: "months.jun", costUsd: 14200, conversions: 912, cpaUsd: 15.6, roas: 4.5 },
];
