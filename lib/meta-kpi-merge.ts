import { metaKpiRows, type MetaKpiRow } from "@/lib/meta-ads-data";
import type { MetaInsightRow } from "@/lib/meta-graph";
import { parseInsightNumber, sumAction } from "@/lib/meta-graph";

function pctChange(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / prev) * 100;
}

function roasFromRow(row: MetaInsightRow | null): number {
  const pr = row?.purchase_roas;
  if (!pr?.length) return 0;
  let sum = 0;
  for (const x of pr) {
    const v = parseInsightNumber(x.value);
    if (v != null) sum += v;
  }
  return sum || parseInsightNumber(pr[0]?.value) || 0;
}

function costPerAction(row: MetaInsightRow | null, actionType: string): number {
  const list = row?.cost_per_action_type;
  if (!list?.length) return 0;
  for (const x of list) {
    if (x.action_type === actionType) {
      return parseInsightNumber(x.value) ?? 0;
    }
  }
  return 0;
}

export type MergeMetaInsightsOptions = {
  /** Se false, não mostra tendência nem período anterior (só valores do intervalo atual). */
  compareWithPrevious?: boolean;
};

/**
 * Constrói linhas de KPI a partir de insights (período atual + opcionalmente anterior).
 */
export function mergeMetaInsightsIntoKpiRows(
  current: MetaInsightRow | null,
  previous: MetaInsightRow | null,
  options?: MergeMetaInsightsOptions,
): MetaKpiRow[] {
  const compare = options?.compareWithPrevious !== false;
  const hasPrev = compare && previous != null;

  const rows = metaKpiRows.map((r) => ({ ...r }));

  const curSpend = parseInsightNumber(current?.spend) ?? 0;
  const prevSpend = parseInsightNumber(previous?.spend) ?? 0;
  const curImp = parseInsightNumber(current?.impressions) ?? 0;
  const prevImp = parseInsightNumber(previous?.impressions) ?? 0;
  const curReach = parseInsightNumber(current?.reach) ?? 0;
  const prevReach = parseInsightNumber(previous?.reach) ?? 0;
  const curLink = parseInsightNumber(current?.inline_link_clicks) ?? 0;
  const prevLink = parseInsightNumber(previous?.inline_link_clicks) ?? 0;

  const curCtr = parseInsightNumber(current?.ctr);
  const prevCtr = parseInsightNumber(previous?.ctr);
  const curCpc = parseInsightNumber(current?.cpc) ?? 0;
  const prevCpc = parseInsightNumber(previous?.cpc) ?? 0;
  const curCpm = parseInsightNumber(current?.cpm) ?? 0;
  const prevCpm = parseInsightNumber(previous?.cpm) ?? 0;
  const curFreq = parseInsightNumber(current?.frequency) ?? 0;
  const prevFreq = parseInsightNumber(previous?.frequency) ?? 0;

  const curLeads = sumAction(current?.actions, "lead");
  const prevLeads = sumAction(previous?.actions, "lead");
  const curPurch = sumAction(current?.actions, "purchase") + sumAction(current?.actions, "omni_purchase");
  const prevPurch = sumAction(previous?.actions, "purchase") + sumAction(previous?.actions, "omni_purchase");

  const curCpl = costPerAction(current, "lead") || (curLeads > 0 ? curSpend / curLeads : 0);
  const prevCpl = costPerAction(previous, "lead") || (prevLeads > 0 ? prevSpend / prevLeads : 0);
  const curCpp = costPerAction(current, "purchase") || (curPurch > 0 ? curSpend / curPurch : 0);
  const prevCpp = costPerAction(previous, "purchase") || (prevPurch > 0 ? prevSpend / prevPurch : 0);

  const map: Record<string, Partial<MetaKpiRow>> = {
    spent: {
      current: curSpend,
      prev: hasPrev ? prevSpend : undefined,
      changePct: hasPrev ? pctChange(curSpend, prevSpend) : undefined,
      showTrend: hasPrev,
      goodWhen: "neutral",
    },
    impressions: {
      current: curImp,
      prev: hasPrev ? prevImp : undefined,
      changePct: hasPrev ? pctChange(curImp, prevImp) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    reach: {
      current: curReach,
      prev: hasPrev ? prevReach : undefined,
      changeAbs: hasPrev ? curReach - prevReach : undefined,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    linkClicks: {
      current: curLink,
      prev: hasPrev ? prevLink : undefined,
      changePct: hasPrev ? pctChange(curLink, prevLink) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    ctr: {
      current: curCtr ?? 0,
      prev: hasPrev ? prevCtr ?? 0 : undefined,
      changePct:
        hasPrev && curCtr != null && prevCtr != null && prevCtr !== 0
          ? pctChange(curCtr, prevCtr) ?? undefined
          : undefined,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    cpc: {
      current: curCpc,
      prev: hasPrev ? prevCpc : undefined,
      changePct: hasPrev ? pctChange(curCpc, prevCpc) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "lower",
    },
    cpm: {
      current: curCpm,
      prev: hasPrev ? prevCpm : undefined,
      changePct: hasPrev ? pctChange(curCpm, prevCpm) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "lower",
    },
    frequency: {
      current: curFreq,
      prev: hasPrev ? prevFreq : undefined,
      changePct: hasPrev ? pctChange(curFreq, prevFreq) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "lower",
    },
    purchases: {
      current: curPurch,
      prev: hasPrev ? prevPurch : undefined,
      changePct: hasPrev ? pctChange(curPurch, prevPurch) ?? 0 : 0,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    costPerPurchase: {
      current: curCpp,
      prev: hasPrev ? prevCpp : undefined,
      changePct: hasPrev ? pctChange(curCpp, prevCpp) ?? 0 : 0,
      showTrend: hasPrev,
      goodWhen: "lower",
    },
    purchaseConversionValue: {
      current: 0,
      showTrend: false,
      goodWhen: "higher",
    },
    sitePurchaseRoas: {
      current: roasFromRow(current),
      showTrend: false,
      goodWhen: "higher",
    },
    leads: {
      current: curLeads,
      prev: hasPrev ? prevLeads : undefined,
      changePct: hasPrev ? pctChange(curLeads, prevLeads) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "higher",
    },
    costPerLead: {
      current: curCpl,
      prev: hasPrev ? prevCpl : undefined,
      changePct: hasPrev ? pctChange(curCpl, prevCpl) ?? undefined : undefined,
      showTrend: hasPrev,
      goodWhen: "lower",
    },
  };

  for (const row of rows) {
    const patch = map[row.id];
    if (!patch) continue;
    Object.assign(row, patch);
  }

  return rows;
}
