"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";

const PREV_MUTED = "color-mix(in srgb, var(--text-muted) 70%, var(--text-secondary) 30%)";

type Row = { i: number; cur: number; prev: number };

/**
 * Micro-tendência em cards KPI. Com `previousValues` (mesmo comprimento que `values`)
 * desenha período atual (área) vs. anterior (linha tracejada, por cima de trás).
 */
export default function MicroSparkline({
  values,
  previousValues,
  color = "var(--accent)",
}: {
  values: number[];
  color?: string;
  /** Série do período anterior; se omitido, mantém o modo de uma linha. */
  previousValues?: number[];
}) {
  const id = useId();
  const gradId = `spark-grad-${id.replace(/[:]/g, "")}`;

  const data = useMemo((): Row[] | null => {
    if (!values || values.length === 0) return null;
    const n = values.length;
    if (previousValues && previousValues.length === n) {
      return values.map((v, i) => ({
        i,
        cur: Number.isFinite(v) ? v : 0,
        prev: Number.isFinite(previousValues[i]!) ? previousValues[i]! : 0,
      }));
    }
    return null;
  }, [values, previousValues]);

  if (!values || values.length === 0) return null;

  if (!data) {
    const one = values.map((v, i) => ({ i, v: Number.isFinite(v) ? v : 0 }));
    return (
      <div className="mt-2 h-10 min-h-10 w-full min-w-0 opacity-90">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={one} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.4}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="mt-2 h-10 min-h-10 w-full min-w-0 opacity-90" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide type="number" />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="cur"
            stroke={color}
            strokeWidth={1.4}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="prev"
            stroke={PREV_MUTED}
            strokeWidth={1.15}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
