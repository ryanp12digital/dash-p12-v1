import { NextResponse } from "next/server";
import { getMetaServerEnv } from "@/lib/meta-env";
import {
  fetchAdInsights,
  parseInsightNumber,
  sumAction,
  type MetaAdInsightRow,
} from "@/lib/meta-graph";

function calcConversions(actions: MetaAdInsightRow["actions"]) {
  const purchases =
    sumAction(actions, "purchase") +
    sumAction(actions, "omni_purchase") +
    sumAction(actions, "offsite_conversion.fb_pixel_purchase");
  const leads =
    sumAction(actions, "lead") +
    sumAction(actions, "onsite_conversion.lead") +
    sumAction(actions, "offsite_conversion.fb_pixel_lead") +
    sumAction(actions, "leadgen_grouped");
  const conversations =
    sumAction(actions, "onsite_conversion.messaging_conversation_started_7d") +
    sumAction(actions, "onsite_conversion.messaging_first_reply");
  const registrations =
    sumAction(actions, "complete_registration") +
    sumAction(actions, "offsite_conversion.fb_pixel_complete_registration");

  if (purchases > 0) return { value: purchases, labelKey: "meta.metric.purchases" };
  if (leads > 0) return { value: leads, labelKey: "meta.metric.leadsOnMeta" };
  if (conversations > 0) return { value: conversations, labelKey: "meta.metric.conversationsStarted" };
  if (registrations > 0) return { value: registrations, labelKey: "meta.metric.registrations" };
  return { value: 0, labelKey: "" };
}

function buildMetrics(row: MetaAdInsightRow | null) {
  if (!row) return null;
  const spent = parseInsightNumber(row.spend) ?? 0;
  const impressions = parseInsightNumber(row.impressions) ?? 0;
  const reach = parseInsightNumber(row.reach) ?? 0;
  const linkClicks = parseInsightNumber(row.inline_link_clicks) ?? 0;
  const { value: resultValue, labelKey: resultLabelKey } = calcConversions(row.actions);
  const costPerResult = resultValue > 0 ? spent / resultValue : 0;
  const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : (parseInsightNumber(row.ctr) ?? 0);
  const cpc = linkClicks > 0 ? spent / linkClicks : (parseInsightNumber(row.cpc) ?? 0);
  const cpm = impressions > 0 ? (spent / impressions) * 1000 : (parseInsightNumber(row.cpm) ?? 0);
  const frequency = parseInsightNumber(row.frequency) ?? 0;

  return { spent, impressions, reach, linkClicks, resultValue, resultLabelKey, costPerResult, ctr, cpc, cpm, frequency };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adId = searchParams.get("adId")?.trim();
  const since1 = searchParams.get("since1")?.trim();
  const until1 = searchParams.get("until1")?.trim();
  const since2 = searchParams.get("since2")?.trim();
  const until2 = searchParams.get("until2")?.trim();

  if (!adId || !since1 || !until1 || !since2 || !until2) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: adId, since1, until1, since2, until2" },
      { status: 400 },
    );
  }

  const { accessToken } = getMetaServerEnv();
  if (!accessToken) {
    return NextResponse.json(
      { error: "META_USER_ACCESS_TOKEN não configurado", code: "missing_token" },
      { status: 501 },
    );
  }

  try {
    const [row1, row2] = await Promise.all([
      fetchAdInsights(accessToken, adId, { since: since1, until: until1 }),
      fetchAdInsights(accessToken, adId, { since: since2, until: until2 }),
    ]);

    return NextResponse.json({
      adId,
      period1: { since: since1, until: until1, metrics: buildMetrics(row1) },
      period2: { since: since2, until: until2, metrics: buildMetrics(row2) },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao comparar períodos" },
      { status: 400 },
    );
  }
}
