/** Janelas de 30 dias (até ontem) e 30 dias anteriores, para comparar períodos no Meta Insights. */

import { addDaysYmd } from "@/lib/overview-dates";

export type MetaTimeRange = { since: string; until: string };

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Período atual = [dateFrom, dateTo] (inclusive).
 * Período anterior = mesmo número de dias imediatamente antes de dateFrom.
 */
export function buildMetaInsightRangesFromSelection(
  dateFrom: string,
  dateTo: string,
): { current: MetaTimeRange; previous: MetaTimeRange } {
  const a = new Date(`${dateFrom}T12:00:00`);
  const b = new Date(`${dateTo}T12:00:00`);
  const days = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  const untilPrev = addDaysYmd(dateFrom, -1);
  const sincePrev = addDaysYmd(untilPrev, -(days - 1));
  return {
    current: { since: dateFrom, until: dateTo },
    previous: { since: sincePrev, until: untilPrev },
  };
}

/** Últimos 30 dias completos (termina ontem) e o bloco de 30 dias antes disso. */
export function getMetaComparisonRanges(): { current: MetaTimeRange; previous: MetaTimeRange } {
  const end = new Date();
  end.setDate(end.getDate() - 1);

  const startCurrent = new Date(end);
  startCurrent.setDate(startCurrent.getDate() - 29);

  const endPrev = new Date(startCurrent);
  endPrev.setDate(endPrev.getDate() - 1);

  const startPrev = new Date(endPrev);
  startPrev.setDate(startPrev.getDate() - 29);

  return {
    current: { since: ymd(startCurrent), until: ymd(end) },
    previous: { since: ymd(startPrev), until: ymd(endPrev) },
  };
}
