import { kpiData } from "@/lib/data";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function KpiCards() {
  return (
    <div className="space-y-3">
      {/* Previous Period */}
      <div className="grid grid-cols-6 gap-3">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <p className="text-[10px] font-semibold text-[#94a3b8] tracking-wider uppercase">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#0f172a] mt-1">{kpi.prev}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">{kpi.prevRaw}</p>
          </div>
        ))}
      </div>

      {/* Current Period */}
      <div className="grid grid-cols-6 gap-3">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #00DAFF 0%, #0626CE 100%)' }}>
            <p className="text-[10px] font-semibold text-blue-200 tracking-wider uppercase">{kpi.label}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-2xl font-bold text-white">{kpi.current}</p>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  kpi.positive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
