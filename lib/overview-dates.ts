/** Datas no formato `YYYY-MM-DD` (input type="date"). */

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toYmd(dt);
}

export function defaultLastNDaysRange(n: number): { from: string; to: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  return { from: toYmd(start), to: toYmd(end) };
}

export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
