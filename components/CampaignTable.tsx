"use client";

import { useMemo, useState } from "react";
import { campaigns } from "@/lib/data";
import { TrendingUp, TrendingDown, Minus, ArrowDown, ArrowUp } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-[#94a3b8]" />;
};

export default function CampaignTable() {
  const { t, formatMoneyFromUsd, formatRatio } = useDashboardSettings();
  const { filterCampaigns } = useOverviewScope();
  const visible = useMemo(() => filterCampaigns(campaigns), [filterCampaigns]);
  const [sortKey, setSortKey] = useState<
    "name" | "status" | "budget" | "cost" | "conversions" | "cpa" | "roas"
  >("cost");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedVisible = useMemo(() => {
    const getValue = (row: (typeof campaigns)[number]) => {
      switch (sortKey) {
        case "name":
          return row.name;
        case "status":
          return row.statusKey;
        case "budget":
          return row.budgetUsdPerDay;
        case "cost":
          return row.costUsd;
        case "conversions":
          return row.conversions;
        case "cpa":
          return row.cpaUsd;
        case "roas":
          return row.roas;
      }
    };

    const dir = sortDir === "asc" ? 1 : -1;
    return [...visible].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [visible, sortKey, sortDir]);

  const columns: {
    key: "name" | "status" | "budget" | "cost" | "conversions" | "cpa" | "roas";
    label: string;
  }[] = [
    { key: "name", label: t("campaign.name").toUpperCase() },
    { key: "status", label: t("campaign.status").toUpperCase() },
    { key: "budget", label: t("campaign.budget").toUpperCase() },
    { key: "cost", label: t("campaign.cost").toUpperCase() },
    { key: "conversions", label: t("campaign.conversions").toUpperCase() },
    { key: "cpa", label: t("campaign.cpa").toUpperCase() },
    { key: "roas", label: t("campaign.roas").toUpperCase() },
  ];

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 4px 20px rgba(7,41,207,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
        <h2 className="text-base font-semibold text-[#0f172a]">{t("campaign.title")}</h2>
        <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
          {t("campaign.topPerforming")}{" "}
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-500"
            style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
          />
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr
            style={{
              background: "linear-gradient(90deg, #0d1626, #0f172a)",
              boxShadow: "0 4px 20px rgba(7,41,207,0.15)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3.5 text-left text-[10px] font-bold tracking-widest"
                style={{ color: "#475569" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (sortKey !== col.key) {
                      setSortKey(col.key);
                      setSortDir("desc");
                    } else {
                      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                    }
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <span>{col.label}</span>
                  {sortKey === col.key &&
                    (sortDir === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-[#0729cf]" aria-hidden />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-[#0729cf]" aria-hidden />
                    ))}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedVisible.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#64748b]">
                {t("campaign.empty")}
              </td>
            </tr>
          )}
          {sortedVisible.map((c, i) => (
            <tr
              key={c.name}
              className="border-t border-[#f1f5f9] transition-all duration-200"
              style={{
                background: c.highlight ? "rgba(7,41,207,0.04)" : "transparent",
                animation: `rowFadeIn 0.4s ease both`,
                animationDelay: `${i * 50}ms`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLTableRowElement;
                el.style.background = c.highlight ? "rgba(7,41,207,0.07)" : "rgba(248,250,252,0.8)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLTableRowElement;
                el.style.background = c.highlight ? "rgba(7,41,207,0.04)" : "transparent";
              }}
            >
              <td className="px-6 py-4">
                <span className={`text-sm font-semibold ${c.highlight ? "text-[#0729cf]" : "text-[#0f172a]"}`}>
                  {c.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                    c.statusKey === "status.active"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-orange-200 bg-orange-50 text-orange-600"
                  }`}
                  style={{
                    boxShadow:
                      c.statusKey === "status.active"
                        ? "0 0 8px rgba(16,185,129,0.15)"
                        : "0 0 8px rgba(249,115,22,0.15)",
                  }}
                >
                  {t(c.statusKey).toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-[#64748b]">
                {formatMoneyFromUsd(c.budgetUsdPerDay, { maximumFractionDigits: 0 })} / {t("campaign.perDay")}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-[#0f172a]">
                {formatMoneyFromUsd(c.costUsd, { maximumFractionDigits: 0 })}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0f172a]">{c.conversions}</span>
                  <TrendIcon trend={c.trend} />
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[#64748b]">
                {formatMoneyFromUsd(c.cpaUsd, { maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-[#0f172a]">{formatRatio(c.roas)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
