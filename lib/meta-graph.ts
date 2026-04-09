/**
 * Chamadas à Graph API (Marketing) no servidor.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights
 */

const DEFAULT_VERSION = "v21.0";

export function getGraphApiVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_VERSION;
}

export class MetaGraphError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = "MetaGraphError";
  }
}

function graphBase(version: string): string {
  return `https://graph.facebook.com/${version}`;
}

export async function graphGet<T>(
  path: string,
  accessToken: string,
  extraParams?: Record<string, string>,
): Promise<T> {
  const version = getGraphApiVersion();
  const url = new URL(`${graphBase(version)}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", accessToken);
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as T & { error?: { message: string; code: number } };
  const err = (json as { error?: { message: string; code: number } }).error;
  if (!res.ok || err) {
    throw new MetaGraphError(err?.message ?? `HTTP ${res.status}`, err?.code, json);
  }
  return json;
}

export type MetaAdAccountApi = {
  id: string;
  name: string;
  account_id?: string;
  currency?: string;
  account_status?: number;
};

export type MetaAdAccountsResponse = {
  data: MetaAdAccountApi[];
  paging?: { next?: string };
};

export async function fetchMetaAdAccounts(accessToken: string): Promise<MetaAdAccountApi[]> {
  const first = await graphGet<MetaAdAccountsResponse>("me/adaccounts", accessToken, {
    fields: "id,name,account_id,currency,account_status",
    limit: "100",
  });
  const all = [...(first.data ?? [])];
  let next = first.paging?.next;
  let pages = 0;
  while (next && pages < 10) {
    pages += 1;
    const res = await fetch(next, { cache: "no-store" });
    const json = (await res.json()) as MetaAdAccountsResponse & { error?: { message: string; code: number } };
    if (!res.ok || json.error) {
      throw new MetaGraphError(json.error?.message ?? `HTTP ${res.status}`, json.error?.code, json);
    }
    all.push(...(json.data ?? []));
    next = json.paging?.next;
  }
  return all;
}

/** Uma linha de insights agregada (nível conta). */
export type MetaInsightRow = {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
  purchase_roas?: { value: string; action_type?: string }[];
};

export type MetaInsightsResponse = {
  data: MetaInsightRow[];
};

const INSIGHT_FIELDS = [
  "spend",
  "impressions",
  "reach",
  "inline_link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
  "cost_per_action_type",
  "purchase_roas",
].join(",");

/** Linha de insights ao nível de anúncio (para listar criativos/anúncios em destaque). */
export type MetaAdInsightRow = {
  campaign_id?: string;
  campaign_name?: string;
  objective?: string;
  optimization_goal?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
};

export type MetaAdInsightsResponse = {
  data: MetaAdInsightRow[];
};

const AD_INSIGHT_FIELDS = [
  "campaign_id",
  "campaign_name",
  "objective",
  "optimization_goal",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "spend",
  "impressions",
  "reach",
  "inline_link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
].join(",");

export async function fetchAccountInsights(
  accessToken: string,
  adAccountId: string,
  timeRange: { since: string; until: string },
): Promise<MetaInsightRow | null> {
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const json = await graphGet<MetaInsightsResponse>(`${id}/insights`, accessToken, {
    fields: INSIGHT_FIELDS,
    time_range: JSON.stringify(timeRange),
  });
  const row = json.data?.[0];
  return row ?? null;
}

/** Linha de insights com dimensão de breakdown (gênero, região, etc.). */
export type MetaInsightBreakdownRow = MetaInsightRow & {
  gender?: string;
  region?: string;
};

type MetaBreakdownInsightsResponse = {
  data: MetaInsightBreakdownRow[];
  paging?: { next?: string };
};

/**
 * Insights ao nível da conta com um único breakdown (ex.: gender, region).
 * Agrega todas as páginas de resultados.
 */
export async function fetchAccountInsightsBreakdown(
  accessToken: string,
  adAccountId: string,
  timeRange: { since: string; until: string },
  breakdown: "gender" | "region",
): Promise<MetaInsightBreakdownRow[]> {
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const version = getGraphApiVersion();
  const firstUrl = new URL(`${graphBase(version)}/${id}/insights`);
  firstUrl.searchParams.set("access_token", accessToken);
  firstUrl.searchParams.set("fields", INSIGHT_FIELDS);
  firstUrl.searchParams.set("breakdowns", breakdown);
  firstUrl.searchParams.set("time_range", JSON.stringify(timeRange));
  firstUrl.searchParams.set("limit", "500");

  const all: MetaInsightBreakdownRow[] = [];
  let next: string | undefined = firstUrl.toString();
  let pages = 0;
  while (next && pages < 25) {
    pages += 1;
    const res = await fetch(next, { cache: "no-store" });
    const json = (await res.json()) as MetaBreakdownInsightsResponse & {
      error?: { message: string; code: number };
    };
    const err = json.error;
    if (!res.ok || err) {
      throw new MetaGraphError(err?.message ?? `HTTP ${res.status}`, err?.code, json);
    }
    all.push(...(json.data ?? []));
    next = json.paging?.next;
  }
  return all;
}

/**
 * Insights ao nível de anúncio.
 * Usado para montar o bloco "Anúncios em destaque" com thumbnail real (via creative_id).
 */
export async function fetchAccountAdInsights(
  accessToken: string,
  adAccountId: string,
  timeRange: { since: string; until: string },
  limit: number,
): Promise<MetaAdInsightRow[]> {
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const json = await graphGet<MetaAdInsightsResponse>(`${id}/insights`, accessToken, {
    fields: AD_INSIGHT_FIELDS,
    level: "ad",
    limit: String(limit),
    time_range: JSON.stringify(timeRange),
  });
  return json.data ?? [];
}

/**
 * Insights para um anúncio específico por ID.
 * Usado para comparar desempenho de criativos entre períodos.
 */
export async function fetchAdInsights(
  accessToken: string,
  adId: string,
  timeRange: { since: string; until: string },
): Promise<MetaAdInsightRow | null> {
  const json = await graphGet<MetaAdInsightsResponse>(`${adId}/insights`, accessToken, {
    fields: AD_INSIGHT_FIELDS,
    time_range: JSON.stringify(timeRange),
  });
  return json.data?.[0] ?? null;
}

export async function fetchAdThumbnailUrl(accessToken: string, adId: string): Promise<string | null> {
  // Busca imagem de alta resolução via adcreatives.
  // Prioridade: image_url (alta res) > picture > thumbnail_url (baixa res).
  const res = await graphGet<any>(`${adId}`, accessToken, {
    fields: "adcreatives{image_url,thumbnail_url,object_story_spec}",
  });

  const creatives = res?.adcreatives?.data ?? [];
  const first = creatives[0];
  if (!first) return null;

  // Tenta image_url primeiro (resolução completa)
  const imageUrlDirect = typeof first.image_url === "string" ? first.image_url : null;
  if (imageUrlDirect) return imageUrlDirect;

  // Tenta campos dentro de object_story_spec (imagens e vídeos)
  const spec = first.object_story_spec as any;
  const linkData = spec?.link_data;
  const videoData = spec?.video_data;

  const specPicture =
    (typeof linkData?.image_url === "string" ? linkData.image_url : null) ??
    (typeof linkData?.picture === "string" ? linkData.picture : null) ??
    (typeof videoData?.image_url === "string" ? videoData.image_url : null);
  if (specPicture) return specPicture;

  // Fallback: thumbnail_url (pode ser baixa resolução)
  const thumbnail = typeof first.thumbnail_url === "string" ? first.thumbnail_url : null;
  return thumbnail;
}

export function parseInsightNumber(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

export function sumAction(actions: MetaInsightRow["actions"], type: string): number {
  if (!actions?.length) return 0;
  let sum = 0;
  for (const a of actions) {
    if (a.action_type === type) {
      sum += Number.parseFloat(a.value) || 0;
    }
  }
  return sum;
}
