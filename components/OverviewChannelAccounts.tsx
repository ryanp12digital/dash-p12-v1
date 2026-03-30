"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { AD_ACCOUNTS } from "@/lib/accounts";
import { OVERVIEW_CHANNEL_KEYS, OVERVIEW_CHANNEL_LABEL_KEYS } from "@/lib/overview-account-channels";

export default function OverviewChannelAccounts() {
  const { t, accountIdByOverviewChannel, setOverviewChannelAccountId } = useDashboardSettings();

  return (
    <div
      className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
    >
      <h3 className="text-sm font-semibold text-[#0f172a]">{t("overview.channelAccountsTitle")}</h3>
      <p className="mt-1 text-xs text-[#64748b]">{t("overview.channelAccountsHint")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW_CHANNEL_KEYS.map((channel) => (
          <label key={channel} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              {t(OVERVIEW_CHANNEL_LABEL_KEYS[channel])}
            </span>
            <select
              value={accountIdByOverviewChannel[channel]}
              onChange={(e) => setOverviewChannelAccountId(channel, e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-[#e2e8f0] bg-white py-2.5 px-3 text-sm font-medium text-[#0f172a] outline-none focus:ring-2 focus:ring-[#0729cf]/20"
            >
              {AD_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {t(a.labelKey)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
