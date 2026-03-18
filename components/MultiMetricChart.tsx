"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { multiMetricData } from "@/lib/data";

const metrics = [
  { key: "cost", label: "COST", color: "#0729cf" },
  { key: "conversions", label: "CONVERSIONS", color: "#22d3ee" },
  { key: "cpa", label: "CPA", color: "#f43f5e" },
  { key: "roas", label: "ROAS", color: "#a3e635" },
];

export default function MultiMetricChart() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Multi-Metric Historical Performance</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">6-Month Trend Analysis: Growth &amp; Efficiency Metrics</p>
        </div>
        <div className="flex items-center gap-4">
          {metrics.map((m) => (
            <span key={m.key} className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={multiMetricData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
            />
            {metrics.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
