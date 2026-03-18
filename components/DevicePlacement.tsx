import { deviceData, placementData } from "@/lib/data";

function BarRow({ label, value, percent, color }: { label: string; value?: string; percent: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#64748b] tracking-wider">{label}</span>
        {value && <span className="text-sm font-bold text-[#0f172a]">{value} <span className="text-[#94a3b8] font-normal text-xs">({percent}%)</span></span>}
        {!value && <span className="text-sm font-bold text-[#0729cf]">{percent}%</span>}
      </div>
      <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function DevicePlacement() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Device Performance */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-semibold text-[#0f172a] mb-5">Device Performance (Cost)</h2>
        <div className="space-y-4">
          {deviceData.map((d) => (
            <BarRow key={d.label} label={d.label} value={d.value} percent={d.percent} color={d.color} />
          ))}
        </div>
      </div>

      {/* Placement Distribution */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-semibold text-[#0f172a] mb-5">Placement Distribution</h2>
        <div className="space-y-4">
          {placementData.map((p) => (
            <BarRow key={p.label} label={p.label} percent={p.percent} color={p.color} />
          ))}
        </div>
      </div>
    </div>
  );
}
