"use client";

import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import DashboardPeriodLegend from "@/components/DashboardPeriodLegend";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

export default function GoogleAdsPage() {
  const { t } = useDashboardSettings();
  return (
    <main className="mx-auto w-full max-w-[405px] space-y-6 px-4 py-4 sm:max-w-[1140px] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0729cf] uppercase">
              {t("placeholder.kicker.googleAds")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              {t("placeholder.googleAds")}
            </h1>
            <p className="mt-2 max-w-xl text-[#64748b]">{t("placeholder.googleAdsBody")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            {t("meta.filtersSectionTitle")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DashboardDateCompareToolbar />
          </div>
          <DashboardPeriodLegend />
        </div>
      </div>
    </main>
  );
}
