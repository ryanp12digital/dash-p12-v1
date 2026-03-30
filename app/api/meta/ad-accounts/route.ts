import { NextResponse } from "next/server";
import { getMetaServerEnv } from "@/lib/meta-env";
import { fetchMetaAdAccounts, MetaGraphError } from "@/lib/meta-graph";

export async function GET() {
  const { accessToken } = getMetaServerEnv();
  if (!accessToken) {
    return NextResponse.json(
      { error: "META_USER_ACCESS_TOKEN não configurado", code: "missing_token" },
      { status: 501 },
    );
  }
  try {
    const raw = await fetchMetaAdAccounts(accessToken);
    const accounts = raw.map((a) => ({
      id: a.id.startsWith("act_") ? a.id : `act_${a.id}`,
      name: (a.name || a.id).trim(),
      currency: a.currency ?? null,
      accountId: (a.account_id ?? a.id.replace(/^act_/, "")).toString(),
    }));
    return NextResponse.json({ accounts });
  } catch (e) {
    if (e instanceof MetaGraphError) {
      return NextResponse.json({ error: e.message, code: e.code, details: e.raw }, { status: 400 });
    }
    throw e;
  }
}
