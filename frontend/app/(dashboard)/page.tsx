"use client";

import KpiCards from "@/components/KpiCards";
import SocialAudienceCharts from "@/components/SocialAudienceCharts";
import GmbBusinessSection from "@/components/GmbBusinessSection";
import OverviewToolbar from "@/components/OverviewToolbar";
import OverviewChannelAccounts from "@/components/OverviewChannelAccounts";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS } from "@/lib/dashboard-layout";

function OverviewHeader() {
  const { t, account } = useDashboardSettings();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-widest text-cyan-400/90 uppercase">{t("overview.kicker")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-100">{t(account.labelKey)}</h1>
        <p className="mt-1 text-xs font-light text-neutral-500">{t("overview.accountTitleHint")}</p>
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
      <h2 className="text-base font-semibold tracking-tight text-neutral-100">{t("overview.summaries")}</h2>
      <div className="flex items-center gap-4 text-xs">
        {compareWithPrevious && (
          <span className="flex items-center gap-1.5 text-neutral-500">
            <span className="inline-block h-2 w-2 rounded-full bg-neutral-500" />
            {t("overview.periodPrev").toUpperCase()}
          </span>
        )}
        <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          {t("overview.periodCurrent").toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function OverviewContent() {
  const { t } = useDashboardSettings();
  return (
      <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      
      <OverviewChannelAccounts />
      <div>
        <PerformanceSummariesHeading />
        <KpiCards />
      </div>
      <SocialAudienceCharts />
      <GmbBusinessSection />
      <footer className="py-4 text-center text-xs text-neutral-500">{t("overview.footer")}</footer>
    </main>
  );
}

export default function OverviewPage() {
  return <OverviewContent />;
}
