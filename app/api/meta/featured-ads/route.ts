import { NextResponse } from "next/server";
import {
  buildMetaInsightRangesFromSelection,
  getMetaComparisonRanges,
} from "@/lib/meta-date-ranges";
import { getMetaServerEnv } from "@/lib/meta-env";
import {
  fetchAccountAdInsights,
  fetchAdThumbnailUrl,
  parseInsightNumber,
  sumAction,
  type MetaAdInsightRow,
} from "@/lib/meta-graph";
import { makeAdThumbnailDataUri } from "@/lib/meta-ads-data";

function toActId(id: string) {
  return id.startsWith("act_") ? id : `act_${id}`;
}

function adLetterFromName(name?: string) {
  const t = (name ?? "").trim();
  if (!t) return "A";
  return t[0].toUpperCase();
}

type ResultType =
  | "auto"
  | "purchases"
  | "leads"
  | "conversations"
  | "registrations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountIdRaw = searchParams.get("accountId")?.trim();
  if (!accountIdRaw) {
    return NextResponse.json({ error: "Parâmetro accountId é obrigatório (ex.: act_123)." }, { status: 400 });
  }

  const since = searchParams.get("since")?.trim();
  const until = searchParams.get("until")?.trim();
  const limitStr = searchParams.get("limit")?.trim();
  const limit = Number.parseInt(limitStr ?? "8", 10);
  const resultType = (searchParams.get("resultType")?.trim() ?? "auto") as ResultType;

  const { accessToken } = getMetaServerEnv();
  if (!accessToken) {
    return NextResponse.json({ error: "META_USER_ACCESS_TOKEN não configurado", code: "missing_token" }, { status: 501 });
  }

  const ranges = since && until ? buildMetaInsightRangesFromSelection(since, until) : getMetaComparisonRanges();
  const current = ranges.current;

  try {
    // Busca um conjunto "amplo" de anúncios e depois seleciona os TOPs.
    // Mantemos um buffer para reduzir chamadas, mas sem explodir o volume.
    const adRows = await fetchAccountAdInsights(accessToken, accountIdRaw, current, Math.max(limit * 2, 20));

    const scored = adRows
      .map((r) => {
        const spend = parseInsightNumber(r.spend) ?? 0;
        const impressions = parseInsightNumber(r.impressions) ?? 0;
        const reach = parseInsightNumber(r.reach) ?? 0;
        const linkClicks = parseInsightNumber(r.inline_link_clicks) ?? 0;

        // Only real conversions count as "result" by default
        const purchases =
          sumAction(r.actions, "purchase") +
          sumAction(r.actions, "omni_purchase") +
          sumAction(r.actions, "offsite_conversion.fb_pixel_purchase");
        const leads =
          sumAction(r.actions, "lead") +
          sumAction(r.actions, "onsite_conversion.lead") +
          sumAction(r.actions, "offsite_conversion.fb_pixel_lead") +
          sumAction(r.actions, "leadgen_grouped");
        const conversations =
          sumAction(r.actions, "onsite_conversion.messaging_conversation_started_7d") +
          sumAction(r.actions, "onsite_conversion.messaging_first_reply");
        const registrations =
          sumAction(r.actions, "complete_registration") +
          sumAction(r.actions, "offsite_conversion.fb_pixel_complete_registration");

        let resultValue = 0;
        let resultLabelKey = "";
        const objective = ((r.objective ?? "") as string).toUpperCase();

        if (resultType === "purchases") {
          resultValue = purchases;
          resultLabelKey = "meta.metric.purchases";
        } else if (resultType === "leads") {
          resultValue = leads;
          resultLabelKey = "meta.metric.leadsOnMeta";
        } else if (resultType === "conversations") {
          resultValue = conversations;
          resultLabelKey = "meta.metric.conversationsStarted";
        } else if (resultType === "registrations") {
          resultValue = registrations;
          resultLabelKey = "meta.metric.registrations";
        } else {
          // auto por objetivo da campanha, sem usar cliques/CPC como "resultado"
          if (objective.includes("PURCHASE")) {
            resultValue = purchases;
            resultLabelKey = "meta.metric.purchases";
          } else if (objective.includes("LEAD")) {
            resultValue = leads;
            resultLabelKey = "meta.metric.leadsOnMeta";
          } else if (objective.includes("MESSAGE")) {
            resultValue = conversations;
            resultLabelKey = "meta.metric.conversationsStarted";
          } else if (objective.includes("REGISTRATION")) {
            resultValue = registrations;
            resultLabelKey = "meta.metric.registrations";
          } else if (purchases > 0) {
            resultValue = purchases;
            resultLabelKey = "meta.metric.purchases";
          } else if (leads > 0) {
            resultValue = leads;
            resultLabelKey = "meta.metric.leadsOnMeta";
          } else if (conversations > 0) {
            resultValue = conversations;
            resultLabelKey = "meta.metric.conversationsStarted";
          } else if (registrations > 0) {
            resultValue = registrations;
            resultLabelKey = "meta.metric.registrations";
          }
        }

        return {
          r,
          spend,
          impressions,
          reach,
          linkClicks,
          leads,
          resultValue,
          resultLabelKey,
        };
      })
      .filter((x) => x.impressions > 0);

    scored.sort((a, b) => b.resultValue - a.resultValue);
    const top = scored.slice(0, Math.max(1, limit));

    // Cache por ad_id para reduzir chamadas.
    const adThumbnailCache = new Map<string, string | null>();

    const featured = await Promise.all(
      top.map(async (x) => {
        const ad: MetaAdInsightRow = x.r;

        // Fallback: mesmo se o Graph falhar, mantemos a "thumb" local para não quebrar a UI.
        // Isso também ajuda quando o Meta bloqueia `adcreatives` por permissão.
        const thumbLetter = adLetterFromName(ad.ad_name ?? "");
        let thumbnailUrl: string = makeAdThumbnailDataUri(thumbLetter);
        const adId = ad.ad_id;
        if (adId) {
          if (adThumbnailCache.has(adId)) {
            thumbnailUrl = adThumbnailCache.get(adId) ?? thumbnailUrl;
          } else {
            try {
              const real = await fetchAdThumbnailUrl(accessToken, adId);
              if (real) thumbnailUrl = real;
            } catch {
              // keep fallback
            }
            adThumbnailCache.set(adId, thumbnailUrl);
          }
        }

        const spent = x.spend;
        const result = x.resultValue;
        const costPerResultBrl = result > 0 ? spent / result : 0;

        const ctr = ad.ctr ? parseInsightNumber(ad.ctr) : (ad.impressions ? (x.linkClicks / x.impressions) : undefined);
        const cpc = x.linkClicks > 0 ? spent / x.linkClicks : parseInsightNumber(ad.cpc) ?? 0;
        const cpm = x.impressions > 0 ? (spent / x.impressions) * 1000 : parseInsightNumber(ad.cpm) ?? 0;

        const frequency = parseInsightNumber(ad.frequency) ?? 0;

        return {
          id: ad.ad_id ?? `${ad.adset_id ?? ""}-${ad.ad_name ?? ""}`,
          name: ad.ad_name ?? "Ad",
          campaignName: ad.campaign_name ?? "Campaign",
          adsetName: ad.adset_name ?? "Ad set",
          thumbLetter,
          thumbnailUrl,

          resultValue: String(Math.round(result * 1000) / 1000),
          resultLabelKey: x.resultLabelKey,
          costPerResultBrl,

          spent,
          reach: x.reach,
          impressions: x.impressions,
          ctr: typeof ctr === "number" && Number.isFinite(ctr) ? ctr : 0,

          cpc,
          cpm,
          frequency,

          pageEngagement: 0,
          videoPlays25: 0,
          utm: null,
        };
      }),
    );

    return NextResponse.json({
      accountId: toActId(accountIdRaw),
      ranges,
      ads: featured,
    });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao buscar anúncios em destaque" }, { status: 400 });
  }
}

