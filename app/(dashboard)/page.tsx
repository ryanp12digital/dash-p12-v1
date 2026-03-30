"use client";

import KpiCards from "@/components/KpiCards";
import SocialAudienceCharts from "@/components/SocialAudienceCharts";
import GmbBusinessSection from "@/components/GmbBusinessSection";
import OverviewToolbar from "@/components/OverviewToolbar";
import OverviewChannelAccounts from "@/components/OverviewChannelAccounts";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

function OverviewHeader() {
  const { t, account } = useDashboardSettings();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-widest text-[#0729cf] uppercase">{t("overview.kicker")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0f172a]">{t(account.labelKey)}</h1>
        <p className="mt-1 text-xs text-[#64748b]">{t("overview.accountTitleHint")}</p>
      </div>
      <OverviewToolbar />
    </div>
  );
}

function PerformanceSummariesHeading() {
  const { t } = useDashboardSettings();
  const { compareWithPrevious } = useOverviewScope();
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-[#0f172a]">{t("overview.summaries")}</h2>
      <div className="flex items-center gap-4 text-xs">
        {compareWithPrevious && (
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#94a3b8]" />
            {t("overview.periodPrev").toUpperCase()}
          </span>
        )}
        <span className="flex items-center gap-1.5 font-semibold text-[#0729cf]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#0729cf]" />
          {t("overview.periodCurrent").toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function OverviewContent() {
  const { t } = useDashboardSettings();
  return (
      <main className="mx-auto w-full max-w-[405px] space-y-6 px-4 py-4 sm:max-w-[1140px] sm:px-6 sm:py-6">
      
      <OverviewChannelAccounts />
      <div>
        <PerformanceSummariesHeading />
        <KpiCards />
      </div>
      <SocialAudienceCharts />
      <GmbBusinessSection />
      <footer className="py-4 text-center text-xs text-[#94a3b8]">{t("overview.footer")}</footer>
    </main>
  );
}

export default function OverviewPage() {
  return <OverviewContent />;
}
