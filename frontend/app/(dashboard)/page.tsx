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
        <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A020]/80 uppercase">{t("overview.kicker")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#EDE8DE]">{t(account.labelKey)}</h1>
        <p className="mt-1 text-xs font-light text-[#6A6358]">{t("overview.accountTitleHint")}</p>
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
      <h2 className="text-base font-semibold tracking-tight text-[#EDE8DE]">{t("overview.summaries")}</h2>
      <div className="flex items-center gap-4 text-xs">
        {compareWithPrevious && (
          <span className="flex items-center gap-1.5 text-[#6A6358]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#6A6358]" />
            {t("overview.periodPrev").toUpperCase()}
          </span>
        )}
        <span className="flex items-center gap-1.5 font-semibold text-[#E8A020]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#E8A020] shadow-[0_0_8px_rgba(232,160,32,0.55)]" />
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
