import { NextResponse } from "next/server";

/** Cotação USD→BRL do dia (Frankfurter ECB). Sem API key. */
export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=BRL", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = (await res.json()) as { rates: { BRL: number }; date: string };
    const rate = data.rates?.BRL;
    if (typeof rate !== "number" || !Number.isFinite(rate)) throw new Error("Invalid rate");
    return NextResponse.json({ rate, date: data.date, source: "frankfurter" });
  } catch {
    const fallback = Number(process.env.NEXT_PUBLIC_FALLBACK_USD_BRL) || 5.5;
    return NextResponse.json({
      rate: fallback,
      date: new Date().toISOString().slice(0, 10),
      source: "fallback",
      error: true,
    });
  }
}
