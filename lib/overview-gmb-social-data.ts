/** Dados mock para Visão geral — Google Meu Negócio e redes sociais (audiência). */

export const SOCIAL_GENDER_COLORS = {
  male: "#16a34a",
  female: "#172554",
  unknown: "#7dd3fc",
} as const;

export const GMB_LINE_COLORS = {
  total: "#22c55e",
  search: "#1e3a8a",
  maps: "#38bdf8",
  chat: "#2563eb",
  routes: "#7dd3fc",
  calls: "#0f172a",
  website: "#93c5fd",
  bookings: "#bae6fd",
  orders: "#15803d",
} as const;

export type FollowerGrowthRow = { dateLabel: string; seguidores: number };

export const followerGrowthData: FollowerGrowthRow[] = [
  { dateLabel: "27/03/2026", seguidores: 1192 },
  { dateLabel: "28/03/2026", seguidores: 1205 },
];

export type DailyReachRow = { dateLabel: string; alcance: number };

/** ~30 dias — alcance diário (Instagram/Facebook agregado). */
export const dailyReachData: DailyReachRow[] = (() => {
  const rows: DailyReachRow[] = [];
  let v = 420;
  for (let i = 0; i < 30; i++) {
    v += Math.round((Math.random() - 0.42) * 280);
    v = Math.max(80, Math.min(1980, v));
    const d = new Date(2026, 1, 27 + i);
    const dateLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    rows.push({ dateLabel, alcance: v });
  }
  return rows;
})();

export type AgeGenderRow = {
  faixa: string;
  masculino: number;
  feminino: number;
  desconhecido: number;
};

export const audienceAgeGenderData: AgeGenderRow[] = [
  { faixa: "13-17", masculino: 14, feminino: 18, desconhecido: 3 },
  { faixa: "18-24", masculino: 62, feminino: 71, desconhecido: 8 },
  { faixa: "25-34", masculino: 118, feminino: 132, desconhecido: 12 },
  { faixa: "35-44", masculino: 88, feminino: 95, desconhecido: 9 },
  { faixa: "45-54", masculino: 52, feminino: 48, desconhecido: 5 },
  { faixa: "55-64", masculino: 28, feminino: 24, desconhecido: 3 },
  { faixa: "65+", masculino: 12, feminino: 14, desconhecido: 2 },
];

export type GenderSlice = { nameKey: string; value: number; pct: number; fill: string };

export const followersGenderPie: GenderSlice[] = [
  { nameKey: "social.legendMale", value: 52.13, pct: 52.13, fill: SOCIAL_GENDER_COLORS.male },
  { nameKey: "social.legendFemale", value: 47.87, pct: 47.87, fill: SOCIAL_GENDER_COLORS.female },
];

export type GmbKpiTone = "up" | "down" | "neutral";

export type GmbKpiRow = {
  labelKey: string;
  helpKey: string;
  current: number;
  prev: number;
  changePct: number;
  tone: GmbKpiTone;
};

export const gmbKpiData: GmbKpiRow[] = [
  {
    labelKey: "gmb.kpi.totalViews",
    helpKey: "gmb.help.totalViews",
    current: 512,
    prev: 486,
    changePct: 5.35,
    tone: "up",
  },
  {
    labelKey: "gmb.kpi.searchViews",
    helpKey: "gmb.help.searchViews",
    current: 323,
    prev: 249,
    changePct: 29.72,
    tone: "up",
  },
  {
    labelKey: "gmb.kpi.mapsViews",
    helpKey: "gmb.help.mapsViews",
    current: 189,
    prev: 237,
    changePct: -20.25,
    tone: "down",
  },
  {
    labelKey: "gmb.kpi.totalActions",
    helpKey: "gmb.help.totalActions",
    current: 61,
    prev: 49,
    changePct: 24.49,
    tone: "up",
  },
  {
    labelKey: "gmb.kpi.websiteClicks",
    helpKey: "gmb.help.websiteClicks",
    current: 17,
    prev: 8,
    changePct: 112.5,
    tone: "up",
  },
  {
    labelKey: "gmb.kpi.calls",
    helpKey: "gmb.help.calls",
    current: 2,
    prev: 0,
    changePct: 0,
    tone: "neutral",
  },
  {
    labelKey: "gmb.kpi.routeRequests",
    helpKey: "gmb.help.routeRequests",
    current: 42,
    prev: 41,
    changePct: 2.44,
    tone: "up",
  },
  {
    labelKey: "gmb.kpi.bookings",
    helpKey: "gmb.help.bookings",
    current: 0,
    prev: 0,
    changePct: 0,
    tone: "neutral",
  },
];

export type GmbDailyRow = {
  dateLabel: string;
  total: number;
  pesquisas: number;
  mapas: number;
  acoesTotal: number;
  conversas: number;
  rotas: number;
  ligacoes: number;
  website: number;
  agendamentos: number;
  pedidos: number;
};

/** Série diária alinhada ao período (~30 dias). */
export const gmbDailySeries: GmbDailyRow[] = (() => {
  const rows: GmbDailyRow[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(2026, 1, 27 + i);
    const dateLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const t = 12 + Math.sin(i / 4) * 8 + (Math.random() - 0.5) * 6;
    const pesq = Math.round(t * 0.55);
    const map = Math.round(t * 0.35);
    const a = 2 + Math.sin(i / 3) * 2.5 + (Math.random() - 0.5) * 1.2;
    rows.push({
      dateLabel,
      total: Math.max(4, Math.round(pesq + map + (Math.random() - 0.5) * 4)),
      pesquisas: Math.max(2, pesq),
      mapas: Math.max(1, map),
      acoesTotal: Math.max(1, Math.round(a)),
      conversas: Math.max(0, Math.round(a * 0.25)),
      rotas: Math.max(0, Math.round(a * 0.45)),
      ligacoes: Math.max(0, Math.round(a * 0.08)),
      website: Math.max(0, Math.round(a * 0.22)),
      agendamentos: Math.max(0, Math.round(a * 0.05)),
      pedidos: Math.max(0, Math.round(a * 0.12)),
    });
  }
  return rows;
})();
