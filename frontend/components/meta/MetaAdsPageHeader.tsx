"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import { IconMeta } from "@/components/platform-icons";
import MetaAdAccountSelect from "@/components/meta/MetaAdAccountSelect";
import DashboardPeriodLegend from "@/components/DashboardPeriodLegend";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";

export default function MetaAdsPageHeader() {
  const { t } = useDashboardSettings();
  const { accounts, accountsLoading, selectedAccountId } = useMetaAdsData();

  const formatAccountDisplay = (name: string) => {
    // Ex.: "00 - [TK] CA Lorena Carvalho" -> "CA Lorena Carvalho"
    const trimmed = name.trim();
    if (/^\s*\d+\s*-\s*\[/.test(trimmed)) {
      const bracketEnd = trimmed.indexOf("]");
      if (bracketEnd >= 0) return trimmed.slice(bracketEnd + 1).trim();
    }
    return trimmed;
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;
  const selectedAccountLabel = selectedAccount
    ? `${formatAccountDisplay(selectedAccount.name)}${selectedAccount.currency ? ` (${selectedAccount.currency})` : ""}`
    : accountsLoading
      ? t("meta.adAccountsLoading")
      : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
            <IconMeta className="h-6 w-6 text-[#0668E1]" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0729cf] uppercase">{t("placeholder.kicker.meta")}</p>
            <p className="mt-1 text-[40px] font-semibold tracking-tight text-[#0f172a]">{selectedAccountLabel}</p>
          </div>
        </div>
        <div className="w-full min-w-0">
          <MetaAdAccountSelect />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{t("meta.filtersSectionTitle")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardDateCompareToolbar />
        </div>
        <DashboardPeriodLegend />
      </div>
    </div>
  );
}
