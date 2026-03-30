/** Dados mock — página Meta Ads (conta de exemplo). */

export const META_IMPRESSION_COLOR = "#22c55e";
export const META_REACH_COLOR = "#172554";

export function makeAdThumbnailDataUri(letter: string): string {
  const L = letter.trim().slice(0, 1).toUpperCase() || "A";

  let svg: string;

  if (L === "V") {
    // Vídeo: fundo escuro cinema + botão play + barra de progresso
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c1445"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#vg)"/>
  <rect x="0" y="6" width="80" height="3" rx="1" fill="white" opacity="0.06"/>
  <rect x="0" y="71" width="80" height="3" rx="1" fill="white" opacity="0.06"/>
  <circle cx="40" cy="37" r="19" fill="white" opacity="0.12"/>
  <polygon points="33,27 33,47 53,37" fill="white" opacity="0.95"/>
  <rect x="10" y="62" width="60" height="3" rx="1.5" fill="white" opacity="0.18"/>
  <rect x="10" y="62" width="26" height="3" rx="1.5" fill="#60a5fa" opacity="0.95"/>
  <circle cx="64" cy="15" r="4" fill="#ef4444" opacity="0.9"/>
</svg>`;
  } else if (L === "C") {
    // Carrossel: cards empilhados + seta de navegação + dots
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#cg)"/>
  <rect x="24" y="20" width="36" height="36" rx="6" fill="white" opacity="0.18"/>
  <rect x="16" y="14" width="36" height="36" rx="6" fill="white" opacity="0.32"/>
  <rect x="8" y="8" width="36" height="36" rx="6" fill="white" opacity="0.62"/>
  <rect x="13" y="18" width="26" height="3" rx="1.5" fill="#f59e0b" opacity="0.7"/>
  <rect x="13" y="25" width="18" height="2" rx="1" fill="#f59e0b" opacity="0.5"/>
  <rect x="13" y="31" width="22" height="2" rx="1" fill="#f59e0b" opacity="0.5"/>
  <circle cx="63" cy="26" r="9" fill="white" opacity="0.92"/>
  <polygon points="59,22 59,30 67,26" fill="#f59e0b"/>
  <circle cx="32" cy="66" r="3.5" fill="white"/>
  <circle cx="42" cy="66" r="3.5" fill="white" opacity="0.38"/>
  <circle cx="52" cy="66" r="3.5" fill="white" opacity="0.38"/>
</svg>`;
  } else if (L === "E") {
    // Estático: simulação de foto (céu + montanhas + sol)
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#db2777"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#fca5a5" stop-opacity="0.28"/>
    </linearGradient>
    <clipPath id="frame"><rect x="10" y="11" width="60" height="46" rx="6"/></clipPath>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#eg)"/>
  <rect x="10" y="11" width="60" height="46" rx="6" fill="url(#sky)"/>
  <g clip-path="url(#frame)">
    <polygon points="10,57 28,33 46,57" fill="white" opacity="0.52"/>
    <polygon points="30,57 46,37 62,57" fill="white" opacity="0.44"/>
    <circle cx="54" cy="22" r="8" fill="#fef3c7" opacity="0.88"/>
  </g>
  <rect x="10" y="61" width="60" height="10" rx="4" fill="#7f1d1d" opacity="0.35"/>
  <rect x="14" y="64" width="22" height="4" rx="2" fill="white" opacity="0.55"/>
</svg>`;
  } else {
    // Genérico: gradiente azul com ícone de imagem
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0729cf"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#gg)"/>
  <rect x="16" y="20" width="48" height="36" rx="6" fill="white" opacity="0.18"/>
  <circle cx="30" cy="33" r="6" fill="white" opacity="0.6"/>
  <polygon points="16,56 34,38 48,52 58,42 64,56" fill="white" opacity="0.45"/>
  <text x="40" y="72" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.7">${L}</text>
</svg>`;
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export type MetaKpiGoodWhen = "higher" | "lower" | "neutral";

/** Grupo de exibição: núcleo sempre visível; restantes por tipo de campanha / objetivo. */
export type MetaKpiGroupId = "core" | "delivery" | "purchases" | "leads";

export type MetaKpiRow = {
  id: string;
  group: MetaKpiGroupId;
  labelKey: string;
  helpKey: string;
  kind: "money" | "count" | "percent" | "ratio" | "plain";
  current: number;
  prev?: number;
  /** Variação % vs período anterior (quando aplicável). */
  changePct?: number | null;
  /** Variação absoluta (ex.: alcance). */
  changeAbs?: number | null;
  showTrend: boolean;
  /** Dois cartões mais largos na última linha (desktop). */
  wide?: boolean;
  goodWhen: MetaKpiGoodWhen;
};

export const metaKpiRows: MetaKpiRow[] = [
  {
    id: "spent",
    group: "core",
    labelKey: "meta.kpi.spent",
    helpKey: "meta.help.spent",
    kind: "money",
    current: 7674.34,
    prev: 7761.11,
    changePct: -1.12,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "impressions",
    group: "core",
    labelKey: "meta.kpi.impressions",
    helpKey: "meta.help.impressions",
    kind: "count",
    current: 134_932,
    prev: 136_647,
    changePct: -1.26,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "reach",
    group: "core",
    labelKey: "meta.kpi.reach",
    helpKey: "meta.help.reach",
    kind: "count",
    current: 28_505,
    prev: 32_308,
    changeAbs: -3803,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "linkClicks",
    group: "core",
    labelKey: "meta.kpi.linkClicks",
    helpKey: "meta.help.linkClicks",
    kind: "count",
    current: 850,
    prev: 787,
    changePct: 8.01,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "ctr",
    group: "core",
    labelKey: "meta.kpi.ctrShort",
    helpKey: "meta.help.ctr",
    kind: "percent",
    current: 0.63,
    prev: 0.58,
    changePct: 8.38,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "cpc",
    group: "core",
    labelKey: "meta.kpi.cpc",
    helpKey: "meta.help.cpc",
    kind: "money",
    current: 9.03,
    prev: 9.86,
    changePct: -8.45,
    showTrend: true,
    goodWhen: "lower",
  },
  {
    id: "cpm",
    group: "core",
    labelKey: "meta.kpi.cpm",
    helpKey: "meta.help.cpm",
    kind: "money",
    current: 56.88,
    prev: 56.8,
    changePct: 0.14,
    showTrend: true,
    goodWhen: "lower",
  },
  {
    id: "frequency",
    group: "delivery",
    labelKey: "meta.kpi.frequency",
    helpKey: "meta.help.frequency",
    kind: "ratio",
    current: 4.73,
    prev: 4.23,
    changePct: 11.92,
    showTrend: true,
    goodWhen: "higher",
  },
  {
    id: "purchases",
    group: "purchases",
    labelKey: "meta.kpi.purchases",
    helpKey: "meta.help.purchases",
    kind: "count",
    current: 0,
    prev: 0,
    changePct: 0,
    showTrend: true,
    goodWhen: "neutral",
  },
  {
    id: "costPerPurchase",
    group: "purchases",
    labelKey: "meta.kpi.costPerPurchase",
    helpKey: "meta.help.costPerPurchase",
    kind: "money",
    current: 0,
    prev: 0,
    changePct: 0,
    showTrend: true,
    goodWhen: "neutral",
  },
  {
    id: "purchaseConversionValue",
    group: "purchases",
    labelKey: "meta.kpi.purchaseConversionValue",
    helpKey: "meta.help.purchaseConversionValue",
    kind: "money",
    current: 0,
    showTrend: false,
    goodWhen: "neutral",
  },
  {
    id: "sitePurchaseRoas",
    group: "purchases",
    labelKey: "meta.kpi.sitePurchaseRoas",
    helpKey: "meta.help.sitePurchaseRoas",
    kind: "plain",
    current: 0,
    showTrend: false,
    goodWhen: "neutral",
  },
  {
    id: "leads",
    group: "leads",
    labelKey: "meta.kpi.leads",
    helpKey: "meta.help.leads",
    kind: "count",
    current: 58,
    prev: 55,
    changePct: 5.45,
    showTrend: true,
    wide: true,
    goodWhen: "higher",
  },
  {
    id: "costPerLead",
    group: "leads",
    labelKey: "meta.kpi.costPerLead",
    helpKey: "meta.help.costPerLead",
    kind: "money",
    current: 132.32,
    prev: 141.11,
    changePct: -6.23,
    showTrend: true,
    wide: true,
    goodWhen: "lower",
  },
];

export type MetaCampaignRow = {
  name: string;
  resultValue: string;
  resultLabelKey: string;
  costPerResultBrl: number;
  spent: number;
  reach: number;
  impressions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
};

export const metaFeaturedCampaigns: MetaCampaignRow[] = [
  {
    name: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    resultValue: "13.031",
    resultLabelKey: "meta.metric.videoThruplay",
    costPerResultBrl: 0.02,
    spent: 323.42,
    reach: 1818,
    impressions: 13_698,
    ctr: 0.03,
    cpc: 80.86,
    cpm: 23.61,
    frequency: 7.53,
  },
  {
    name: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    resultValue: "18",
    resultLabelKey: "meta.metric.leadsOnMeta",
    costPerResultBrl: 129.08,
    spent: 2324.4,
    reach: 12_400,
    impressions: 45_200,
    ctr: 0.12,
    cpc: 12.9,
    cpm: 51.42,
    frequency: 3.64,
  },
  {
    name: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    resultValue: "2.104",
    resultLabelKey: "meta.metric.videoThruplay",
    costPerResultBrl: 0.03,
    spent: 63.12,
    reach: 890,
    impressions: 6_120,
    ctr: 0.05,
    cpc: 30.0,
    cpm: 10.31,
    frequency: 6.88,
  },
  {
    name: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    resultValue: "890",
    resultLabelKey: "meta.metric.linkClicks",
    costPerResultBrl: 0.15,
    spent: 133.5,
    reach: 2100,
    impressions: 8900,
    ctr: 1.2,
    cpc: 0.15,
    cpm: 15.0,
    frequency: 4.24,
  },
  {
    name: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    resultValue: "420",
    resultLabelKey: "meta.metric.leadsOnMeta",
    costPerResultBrl: 2.1,
    spent: 882.0,
    reach: 5600,
    impressions: 18_200,
    ctr: 0.8,
    cpc: 2.1,
    cpm: 48.46,
    frequency: 3.25,
  },
];

export type MetaAdRow = {
  name: string;
  campaignName: string;
  adsetName: string;
  thumbLetter: string;
  thumbnailUrl?: string | null;
  resultValue: string;
  resultLabelKey: string;
  costPerResultBrl: number;
  spent: number;
  reach: number;
  impressions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  pageEngagement: number;
  videoPlays25: number;
  utm: string | null;
};

export const metaFeaturedAds: MetaAdRow[] = [
  {
    name: "[VID IA] [01/12]",
    campaignName: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    adsetName: "Ad set [01/12]",
    thumbLetter: "V",
    thumbnailUrl: makeAdThumbnailDataUri("V"),
    resultValue: "13.030",
    resultLabelKey: "meta.metric.videoThruplay",
    costPerResultBrl: 0.02,
    spent: 323.36,
    reach: 1806,
    impressions: 13_673,
    ctr: 0.02,
    cpc: 107.79,
    cpm: 23.65,
    frequency: 7.57,
    pageEngagement: 13_329,
    videoPlays25: 13_109,
    utm: null,
  },
  {
    name: "[VID IA] [01/12]",
    campaignName: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    adsetName: "Ad set [01/12]",
    thumbLetter: "V",
    thumbnailUrl: makeAdThumbnailDataUri("V"),
    resultValue: "12.800",
    resultLabelKey: "meta.metric.videoThruplay",
    costPerResultBrl: 0.03,
    spent: 384.0,
    reach: 1750,
    impressions: 12_800,
    ctr: 0.03,
    cpc: 96.0,
    cpm: 30.0,
    frequency: 7.31,
    pageEngagement: 12_100,
    videoPlays25: 12_500,
    utm: null,
  },
  {
    name: "[CARROSSEL] [15/11]",
    campaignName: "[P12][PLJP][CBO][ENG][VV][ABERTO][15/11]",
    adsetName: "Ad set [15/11]",
    thumbLetter: "C",
    thumbnailUrl: makeAdThumbnailDataUri("C"),
    resultValue: "24",
    resultLabelKey: "meta.metric.leadsOnMeta",
    costPerResultBrl: 45.0,
    spent: 1080.0,
    reach: 4200,
    impressions: 9800,
    ctr: 0.45,
    cpc: 45.0,
    cpm: 110.2,
    frequency: 2.33,
    pageEngagement: 890,
    videoPlays25: 0,
    utm: null,
  },
  {
    name: "[ESTÁTICO] [03/12]",
    campaignName: "[P12][PLJP][CBO][ENG][VV][ABERTO][03/12]",
    adsetName: "Ad set [03/12]",
    thumbLetter: "E",
    thumbnailUrl: makeAdThumbnailDataUri("E"),
    resultValue: "1.200",
    resultLabelKey: "meta.metric.linkClicks",
    costPerResultBrl: 0.08,
    spent: 96.0,
    reach: 3200,
    impressions: 12_000,
    ctr: 0.1,
    cpc: 0.08,
    cpm: 8.0,
    frequency: 3.75,
    pageEngagement: 450,
    videoPlays25: 0,
    utm: null,
  },
  {
    name: "[VID IA] [01/12]",
    campaignName: "[P12][PLJP][CBO][ENG][VV][ABERTO][01/12]",
    adsetName: "Ad set [01/12]",
    thumbLetter: "V",
    thumbnailUrl: makeAdThumbnailDataUri("V"),
    resultValue: "9.500",
    resultLabelKey: "meta.metric.videoThruplay",
    costPerResultBrl: 0.04,
    spent: 380.0,
    reach: 1500,
    impressions: 9500,
    ctr: 0.04,
    cpc: 40.0,
    cpm: 40.0,
    frequency: 6.33,
    pageEngagement: 9200,
    videoPlays25: 9100,
    utm: null,
  },
];

export type MetaDeviceSlice = { nameKey: string; pct: number; color: string };

export const metaReachByDevice: MetaDeviceSlice[] = [
  { nameKey: "meta.device.desktop", pct: 0.7, color: META_IMPRESSION_COLOR },
  { nameKey: "meta.device.mobileApp", pct: 99.07, color: META_REACH_COLOR },
  { nameKey: "meta.device.mobileWeb", pct: 0.23, color: "#38bdf8" },
];

export type MetaHourlyRow = { hour: string; impressoes: number; alcance: number };

export const metaImpressionsReachByHour: MetaHourlyRow[] = Array.from({ length: 24 }, (_, h) => {
  const base = h < 6 ? 80 : h < 12 ? 400 + h * 120 : h < 19 ? 800 + h * 200 : 9000 - (h - 19) * 400;
  const imp = Math.max(50, Math.round(base + (Math.random() - 0.5) * 400));
  const reach = Math.round(imp * (0.85 + Math.random() * 0.08));
  return {
    hour: `${String(h).padStart(2, "0")}h`,
    impressoes: imp,
    alcance: reach,
  };
});

export type MetaAgeRow = { faixa: string; impressoes: number; alcance: number };

export const metaImpressionsReachByAge: MetaAgeRow[] = [
  { faixa: "25-34", impressoes: 38_200, alcance: 32_100 },
  { faixa: "35-44", impressoes: 35_800, alcance: 29_400 },
  { faixa: "45-54", impressoes: 22_000, alcance: 18_200 },
  { faixa: "55-64", impressoes: 12_400, alcance: 10_100 },
  { faixa: "65+", impressoes: 4_200, alcance: 3_400 },
];

export type MetaGenderRow = { generoKey: string; impressoes: number; alcance: number };

export const metaImpressionsReachByGender: MetaGenderRow[] = [
  { generoKey: "meta.gender.female", impressoes: 72_000, alcance: 61_000 },
  { generoKey: "meta.gender.male", impressoes: 58_000, alcance: 48_500 },
  { generoKey: "meta.gender.unknown", impressoes: 0, alcance: 0 },
];

export type MetaRegionRow = {
  regionKey: string;
  alcance: number;
  impressoes: number;
  frequencia: number;
  valorInvestido: number;
  cpm: number;
};

export const metaTopRegions: MetaRegionRow[] = [
  {
    regionKey: "meta.region.sp",
    alcance: 28_505,
    impressoes: 134_932,
    frequencia: 4.73,
    valorInvestido: 7674.34,
    cpm: 56.88,
  },
  {
    regionKey: "meta.region.rj",
    alcance: 12_100,
    impressoes: 58_400,
    frequencia: 4.12,
    valorInvestido: 3210.5,
    cpm: 54.9,
  },
  {
    regionKey: "meta.region.mg",
    alcance: 8900,
    impressoes: 41_200,
    frequencia: 3.88,
    valorInvestido: 2100.0,
    cpm: 51.0,
  },
];
