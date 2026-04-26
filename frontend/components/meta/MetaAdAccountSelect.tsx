"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";

export default function MetaAdAccountSelect() {
  const { t } = useDashboardSettings();
  const {
    accounts,
    accountsLoading,
    accountsError,
    selectedAccountId,
    setSelectedAccountId,
    insightsLoading,
    hasTokenConfigured,
  } = useMetaAdsData();

  const formatAccountDisplay = (name: string) => {
    // Ex.: "00 - [TK] CA Lorena Carvalho" -> "CA Lorena Carvalho"
    const trimmed = name.trim();
    // Remover prefixo tipo: "<número> - [TK] " (mantém o resto legível).
    if (/^\s*\d+\s*-\s*\[/.test(trimmed)) {
      const bracketEnd = trimmed.indexOf("]");
      if (bracketEnd >= 0) return trimmed.slice(bracketEnd + 1).trim();
    }
    return trimmed;
  };

  if (hasTokenConfigured === false) {
    return (
      <div className="rounded-xl border border-(--border-accent) bg-(--accent-soft) px-4 py-3 text-sm text-(--text-secondary)">
        {t("meta.adAccountsNoToken")}
      </div>
    );
  }

  if (accountsError && accounts.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{accountsError}</div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor="meta-ad-account" className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
        {t("meta.adAccountLabel")}
      </label>
      <div className="relative">
        <select
          id="meta-ad-account"
          value={selectedAccountId ?? ""}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          disabled={accountsLoading || accounts.length === 0}
          className="w-full cursor-pointer appearance-none rounded-xl border border-[#e2e8f0] bg-white py-2.5 pr-10 pl-4 text-sm font-medium text-[#0f172a] outline-none focus:ring-2 focus:ring-[#0729cf]/20 disabled:opacity-60"
        >
          {accountsLoading && <option value="">{t("meta.adAccountsLoading")}</option>}
          {!accountsLoading && accounts.length === 0 && (
            <option value="">{t("meta.adAccountsEmpty")}</option>
          )}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {formatAccountDisplay(a.name)}
              {a.currency ? ` (${a.currency})` : ""}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-medium text-[#94a3b8]">
          {insightsLoading ? t("meta.insightsLoading") : ""}
        </span>
      </div>
    </div>
  );
}
