"use client";

import { useRef, useState, useEffect, type RefObject } from "react";
import { SlidersHorizontal, Download } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import { useOverviewScope, overviewChannelKeys } from "@/components/OverviewScopeContext";
import { buildOverviewCsvLines } from "@/lib/export-overview-csv";
import { kpiData, campaigns } from "@/lib/data";
import { AD_ACCOUNTS } from "@/lib/accounts";
import type { CampaignChannelKey } from "@/lib/data";

function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, onOutside, enabled]);
}

const CHANNEL_KEYS: { key: CampaignChannelKey; labelKey: string }[] = [
  { key: "pmax", labelKey: "toolbar.filterPmax" },
  { key: "youtube", labelKey: "toolbar.filterYoutube" },
  { key: "search", labelKey: "toolbar.filterSearch" },
];

export default function OverviewToolbar() {
  const { t, intlLocale, accountId, formatCount, formatMoneyFromUsd } = useDashboardSettings();
  const {
    dateFrom,
    dateTo,
    selectedChannels,
    toggleChannel,
    selectAllChannels,
    includeActive,
    includePaused,
    setIncludeActive,
    setIncludePaused,
    filterCampaigns,
    compareWithPrevious,
  } = useOverviewScope();

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen);

  const filtersNarrowed =
    selectedChannels.length < overviewChannelKeys.length || !includeActive || !includePaused;

  const trySetActive = (v: boolean) => {
    if (!v && !includePaused) return;
    setIncludeActive(v);
  };
  const trySetPaused = (v: boolean) => {
    if (!v && !includeActive) return;
    setIncludePaused(v);
  };

  const resetFilters = () => {
    selectAllChannels();
    setIncludeActive(true);
    setIncludePaused(true);
  };

  const handleExport = () => {
    const account = AD_ACCOUNTS.find((a) => a.id === accountId) ?? AD_ACCOUNTS[0];
    const accountLabel = t(account.labelKey);
    const filtered = filterCampaigns(campaigns);
    const lines = buildOverviewCsvLines({
      t,
      intlLocale,
      dateFrom,
      dateTo,
      compareWithPrevious,
      accountLabel,
      kpiRows: kpiData,
      campaigns: filtered,
      fmt: { formatCount, formatMoneyFromUsd },
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `p12-overview-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DashboardDateCompareToolbar />

      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className={`cursor-pointer relative rounded-lg border p-2 transition-colors ${
            filtersNarrowed
              ? "border-[#0729cf] bg-[#0729cf]/8 text-[#0729cf]"
              : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
          }`}
          title={filtersNarrowed ? t("toolbar.badgeFilters") : t("toolbar.filtersTitle")}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filtersNarrowed && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#0729cf]" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div
            className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,300px)] rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl"
            style={{ boxShadow: "0 12px 40px rgba(7,41,207,0.12)" }}
          >
            <p className="mb-3 text-xs font-semibold text-[#64748b] uppercase">{t("toolbar.filtersTitle")}</p>
            <p className="mb-2 text-[11px] font-semibold text-[#94a3b8] uppercase">{t("toolbar.filtersChannels")}</p>
            <div className="mb-4 space-y-2">
              {CHANNEL_KEYS.map(({ key, labelKey }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-[#0f172a]">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(key)}
                    onChange={() => toggleChannel(key)}
                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] focus:ring-[#0729cf]"
                  />
                  {t(labelKey)}
                </label>
              ))}
            </div>
            <p className="mb-2 text-[11px] font-semibold text-[#94a3b8] uppercase">{t("toolbar.filtersStatus")}</p>
            <div className="mb-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={includeActive}
                  onChange={(e) => trySetActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] focus:ring-[#0729cf]"
                />
                {t("toolbar.filterActive")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={includePaused}
                  onChange={(e) => trySetPaused(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1] text-[#0729cf] focus:ring-[#0729cf]"
                />
                {t("toolbar.filterPaused")}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="cursor-pointer flex-1 rounded-lg border border-[#e2e8f0] py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]"
              >
                {t("toolbar.filtersReset")}
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="cursor-pointer flex-1 rounded-lg bg-[#0729cf] py-2 text-xs font-semibold text-white hover:bg-[#0621a8]"
              >
                {t("toolbar.filtersClose")}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="cursor-pointer flex items-center gap-2 rounded-lg bg-[#0729cf] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0621a8]"
      >
        <Download className="h-4 w-4 shrink-0" />
        {t("overview.export")}
      </button>
    </div>
  );
}
