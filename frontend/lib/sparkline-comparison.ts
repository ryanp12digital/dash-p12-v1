/**
 * Séries diárias sintéticas para sparkline no cartão KPI (período atual vs. anterior),
 * alinhadas em comprimento e proporcionais aos totais do período.
 */
export function buildComparisonDailySeries(
  currentTotal: number,
  prevTotal: number,
  points = 7,
): { current: number[]; previous: number[] } {
  const n = Math.max(2, Math.floor(points));
  const parts = (total: number, phase: number) => {
    if (!Number.isFinite(total) || total === 0) {
      return Array(n).fill(0);
    }
    const raw = Array.from({ length: n }, (_, i) => {
      const t = n <= 1 ? 0 : i / (n - 1);
      return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * Math.PI * 1.25 + phase));
    });
    const s = raw.reduce((a, b) => a + b, 0) || 1;
    return raw.map((r) => (r / s) * total);
  };
  return {
    current: parts(currentTotal, 0.2),
    previous: parts(prevTotal, 1.1),
  };
}
