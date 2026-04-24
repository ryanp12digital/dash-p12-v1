"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

const dataBig = [
  { label: "A1", value: 500 },
  { label: "B1", value: 280 },
  { label: "C1", value: 190 },
  { label: "D1", value: 70 },
];

const dataSmall = [
  { label: "A2", value: 200 },
  { label: "B2", value: 180 },
  { label: "C2", value: 90 },
  { label: "D2", value: 50 },
];

const COLORS_BIG = ["#1a4cf5", "#3b82f6", "#60a5fa", "#93c5fd"];
const COLORS_SMALL = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

function FunnelBar({
  label,
  value,
  max,
  color,
  i,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  i: number;
}) {
  const pct = (value / max) * 100;
  const margin = (100 - pct) / 2;

  return (
    <div
      className="flex items-center gap-3 mb-2"
      style={{
        animation: `barFadeIn 0.45s ease both`,
        animationDelay: `${i * 70}ms`,
      }}
    >
      <span className="text-[11px] font-semibold text-[#94a3b8] w-7 text-right">{label}</span>
      <div className="flex-1 relative h-8 bg-[#f1f5f9] rounded-lg overflow-hidden">
        <div
          className="absolute h-full rounded-lg flex items-center justify-end pr-2"
          style={{
            left: `${margin}%`,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 12px ${color}55`,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span className="text-[10px] font-bold text-white drop-shadow-sm">{value}</span>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
};

export default function FunnelStacked() {
  const { t } = useDashboardSettings();
  const maxBig = dataBig[0].value;
  const maxSmall = dataSmall[0].value;

  return (
    <div
      className="rounded-2xl p-6"
      style={cardStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 12px 36px rgba(7,41,207,0.10), 0 2px 8px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      <h2 className="mb-5 text-base font-semibold text-[#0f172a]">{t("funnel.title")}</h2>

      <div className="mb-4">
        <p className="mb-3 text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">{t("funnel.series1")}</p>
        {dataBig.map((d, i) => (
          <FunnelBar key={d.label} label={d.label} value={d.value} max={maxBig} color={COLORS_BIG[i]} i={i} />
        ))}
      </div>

      <div className="border-t border-[#f1f5f9] pt-3">
        <p className="mb-3 text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">{t("funnel.series2")}</p>
        {dataSmall.map((d, i) => (
          <FunnelBar key={d.label} label={d.label} value={d.value} max={maxSmall} color={COLORS_SMALL[i]} i={i} />
        ))}
      </div>

      <style>{`
        @keyframes barFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
