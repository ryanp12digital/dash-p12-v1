"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { AD_ACCOUNTS } from "@/lib/accounts";
import { OVERVIEW_CHANNEL_KEYS, OVERVIEW_CHANNEL_LABEL_KEYS } from "@/lib/overview-account-channels";

export default function OverviewChannelAccounts() {
  const { t, accountIdByOverviewChannel, setOverviewChannelAccountId } = useDashboardSettings();

  return (
    <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <h3 className="text-sm font-semibold tracking-tight text-neutral-100">{t("overview.channelAccountsTitle")}</h3>
      <p className="mt-1 text-xs font-light text-neutral-500">{t("overview.channelAccountsHint")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW_CHANNEL_KEYS.map((channel) => (
          <label key={channel} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {t(OVERVIEW_CHANNEL_LABEL_KEYS[channel])}
            </span>
            <select
              value={accountIdByOverviewChannel[channel]}
              onChange={(e) => setOverviewChannelAccountId(channel, e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-neutral-700 bg-neutral-950/50 py-2.5 px-3 text-sm font-medium text-neutral-100 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/15"
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
