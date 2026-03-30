import { NextResponse } from "next/server";
import {
  buildMetaInsightRangesFromSelection,
  getMetaComparisonRanges,
} from "@/lib/meta-date-ranges";
import { mergeMetaInsightsIntoKpiRows } from "@/lib/meta-kpi-merge";
import { getMetaServerEnv } from "@/lib/meta-env";
import { fetchAccountInsights, MetaGraphError } from "@/lib/meta-graph";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId")?.trim();
  if (!accountId) {
    return NextResponse.json({ error: "Parâmetro accountId é obrigatório (ex.: act_123)." }, { status: 400 });
  }

  const since = searchParams.get("since")?.trim();
  const until = searchParams.get("until")?.trim();
  const compareParam = searchParams.get("compare");
  const compareWithPrevious = compareParam !== "0" && compareParam !== "false";

  const { accessToken } = getMetaServerEnv();
  if (!accessToken) {
    return NextResponse.json({ error: "META_USER_ACCESS_TOKEN não configurado", code: "missing_token" }, { status: 501 });
  }

  const ranges =
    since && until ? buildMetaInsightRangesFromSelection(since, until) : getMetaComparisonRanges();

  try {
    const current = await fetchAccountInsights(accessToken, accountId, ranges.current);
    let previous = null;
    if (compareWithPrevious) {
      previous = await fetchAccountInsights(accessToken, accountId, ranges.previous);
    }

    const kpiRows = mergeMetaInsightsIntoKpiRows(current, previous, {
      compareWithPrevious: compareWithPrevious,
    });

    return NextResponse.json({
      accountId: accountId.startsWith("act_") ? accountId : `act_${accountId}`,
      ranges,
      kpiRows,
      raw: { current, previous },
      compareWithPrevious,
    });
  } catch (e) {
    if (e instanceof MetaGraphError) {
      return NextResponse.json({ error: e.message, code: e.code, details: e.raw }, { status: 400 });
    }
    throw e;
  }
}
