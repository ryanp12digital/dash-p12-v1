import { NextResponse } from "next/server";
import { getMetaServerEnv } from "@/lib/meta-env";
import {
  fetchAccountInsightsBreakdown,
  MetaGraphError,
  parseInsightNumber,
  type MetaInsightBreakdownRow,
} from "@/lib/meta-graph";

export type AudienceGenderRow = { generoKey: string; impressoes: number; alcance: number };

export type AudienceRegionRow = {
  regionLabel: string;
  alcance: number;
  impressoes: number;
  frequencia: number;
  valorInvestido: number;
  cpm: number;
};

const GENDER_KEYS = ["meta.gender.female", "meta.gender.male", "meta.gender.unknown"] as const;

function mapGenderToKey(raw: string | undefined): (typeof GENDER_KEYS)[number] {
  const g = (raw ?? "").toLowerCase();
  if (g === "female") return "meta.gender.female";
  if (g === "male") return "meta.gender.male";
  return "meta.gender.unknown";
}

function normalizeGenderRows(rows: MetaInsightBreakdownRow[]): AudienceGenderRow[] {
  const acc = new Map<string, { imp: number; reach: number }>();
  for (const k of GENDER_KEYS) acc.set(k, { imp: 0, reach: 0 });

  for (const row of rows) {
    const key = mapGenderToKey(row.gender);
    const cur = acc.get(key)!;
    cur.imp += parseInsightNumber(row.impressions) ?? 0;
    cur.reach += parseInsightNumber(row.reach) ?? 0;
  }

  return GENDER_KEYS.map((generoKey) => {
    const v = acc.get(generoKey)!;
    return {
      generoKey,
      impressoes: Math.round(v.imp),
      alcance: Math.round(v.reach),
    };
  });
}

function normalizeRegionRows(rows: MetaInsightBreakdownRow[]): AudienceRegionRow[] {
  const mapped = rows
    .map((row) => {
      const regionLabel = (row.region ?? "").trim();
      const alcance = Math.round(parseInsightNumber(row.reach) ?? 0);
      const impressoes = Math.round(parseInsightNumber(row.impressions) ?? 0);
      const valorInvestido = parseInsightNumber(row.spend) ?? 0;
      let frequencia = parseInsightNumber(row.frequency) ?? 0;
      let cpm = parseInsightNumber(row.cpm) ?? 0;
      if (impressoes > 0 && valorInvestido > 0 && cpm === 0) {
        cpm = (valorInvestido / impressoes) * 1000;
      }
      if (impressoes > 0 && alcance > 0 && frequencia === 0) {
        frequencia = impressoes / alcance;
      }
      return {
        regionLabel: regionLabel || "—",
        alcance,
        impressoes,
        frequencia,
        valorInvestido,
        cpm,
      };
    })
    .filter((r) => r.regionLabel !== "—" && (r.alcance > 0 || r.impressoes > 0 || r.valorInvestido > 0));

  mapped.sort((a, b) => b.alcance - a.alcance);
  return mapped.slice(0, 40);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId")?.trim();
  const since = searchParams.get("since")?.trim();
  const until = searchParams.get("until")?.trim();

  if (!accountId) {
    return NextResponse.json({ error: "Parâmetro accountId é obrigatório." }, { status: 400 });
  }
  if (!since || !until) {
    return NextResponse.json({ error: "Parâmetros since e until são obrigatórios (YYYY-MM-DD)." }, { status: 400 });
  }

  const { accessToken } = getMetaServerEnv();
  if (!accessToken) {
    return NextResponse.json({ error: "META_USER_ACCESS_TOKEN não configurado", code: "missing_token" }, { status: 501 });
  }

  const timeRange = { since, until };

  let gender: AudienceGenderRow[] = normalizeGenderRows([]);
  let regions: AudienceRegionRow[] = [];
  const errors: { gender?: string; region?: string } = {};

  try {
    const genderRows = await fetchAccountInsightsBreakdown(accessToken, accountId, timeRange, "gender");
    gender = normalizeGenderRows(genderRows);
  } catch (e) {
    errors.gender = e instanceof MetaGraphError ? e.message : "Erro ao carregar insights por gênero.";
  }

  try {
    const regionRows = await fetchAccountInsightsBreakdown(accessToken, accountId, timeRange, "region");
    regions = normalizeRegionRows(regionRows);
  } catch (e) {
    errors.region = e instanceof MetaGraphError ? e.message : "Erro ao carregar insights por região.";
  }

  return NextResponse.json({
    accountId: accountId.startsWith("act_") ? accountId : `act_${accountId}`,
    timeRange,
    gender,
    regions,
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
