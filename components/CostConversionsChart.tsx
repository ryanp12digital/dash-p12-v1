"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { weeklyChartData } from "@/lib/data";

export default function CostConversionsChart() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-[#0f172a]">Cost vs Conversions Evolution</h2>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-3 h-0.5 bg-[#0729cf] inline-block rounded" />
            COST
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-3 h-0.5 bg-[#38bdf8] inline-block rounded" />
            CONVERSIONS
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#0729cf"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="conversions"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
