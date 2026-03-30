"use client";

import type { ReactNode } from "react";
import { deviceData, placementData, accessTypeData } from "@/lib/data";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

function BarRow({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value?: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#64748b]">{label}</span>
        {value && (
          <span className="text-sm font-bold whitespace-nowrap text-[#0f172a]">
            {value}{" "}
            <span className="text-xs font-normal text-[#94a3b8]">({percent}%)</span>
          </span>
        )}
        {!value && <span className="text-sm font-bold text-[#0729cf]">{percent}%</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
};

function AnalyticsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
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
      <h2 className="mb-5 text-base font-semibold text-[#0f172a]">{title}</h2>
      {children}
    </div>
  );
}

export default function DevicePlacement() {
  const { t, formatMoneyFromUsd } = useDashboardSettings();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <AnalyticsCard title={t("device.title")}>
        <div className="space-y-4">
          {deviceData.map((d) => (
            <BarRow
              key={d.labelKey}
              label={t(d.labelKey)}
              value={formatMoneyFromUsd(d.costUsd, { maximumFractionDigits: 0 })}
              percent={d.percent}
              color={d.color}
            />
          ))}
        </div>
      </AnalyticsCard>

      <AnalyticsCard title={t("placement.title")}>
        <div className="space-y-4">
          {placementData.map((p) => (
            <BarRow key={p.labelKey} label={t(p.labelKey)} percent={p.percent} color={p.color} />
          ))}
        </div>
      </AnalyticsCard>

      <AnalyticsCard title={t("access.title")}>
        <div className="space-y-4">
          {accessTypeData.map((a) => (
            <BarRow key={a.labelKey} label={t(a.labelKey)} percent={a.percent} color={a.color} />
          ))}
        </div>
      </AnalyticsCard>
    </div>
  );
}
