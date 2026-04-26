"use client";

import KpiCards from "@/components/KpiCards";
import SocialAudienceCharts from "@/components/SocialAudienceCharts";
import GmbBusinessSection from "@/components/GmbBusinessSection";
import OverviewToolbar from "@/components/OverviewToolbar";
import OverviewChannelAccounts from "@/components/OverviewChannelAccounts";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS } from "@/lib/dashboard-layout";
import PageWidgetLayout from "@/components/dashboard/PageWidgetLayout";

function OverviewHeader() {
  const { t, account } = useDashboardSettings();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-(--accent) uppercase opacity-80">{t("overview.kicker")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-(--text-primary)">{t(account.labelKey)}</h1>
        <p className="mt-1 text-xs font-light text-(--text-secondary)">{t("overview.accountTitleHint")}</p>
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
      <h2 className="text-base font-semibold tracking-tight text-(--text-primary)">{t("overview.summaries")}</h2>
      <div className="flex items-center gap-4 text-xs">
        {compareWithPrevious && (
          <span className="flex items-center gap-1.5 text-(--text-muted)">
            <span className="inline-block h-2 w-2 rounded-full bg-(--text-muted)" />
            {t("overview.periodPrev").toUpperCase()}
          </span>
        )}
        <span className="flex items-center gap-1.5 font-semibold text-(--accent)">
          <span className="inline-block h-2 w-2 rounded-full bg-(--accent)" />
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
      <PageWidgetLayout
        layoutId="overview"
        blocks={[
          {
            id: "accounts",
            labelKey: "pageBlock.overview.accounts",
            content: <OverviewChannelAccounts />,
          },
          {
            id: "kpis",
            labelKey: "pageBlock.overview.kpis",
            content: (
              <div>
                <PerformanceSummariesHeading />
                <KpiCards />
              </div>
            ),
          },
          {
            id: "social",
            labelKey: "pageBlock.overview.social",
            content: <SocialAudienceCharts />,
          },
          {
            id: "gmb",
            labelKey: "pageBlock.overview.gmb",
            content: <GmbBusinessSection />,
          },
        ]}
      />
      <footer className="py-4 text-center text-xs text-neutral-500">{t("overview.footer")}</footer>
    </main>
  );
}

export default function OverviewPage() {
  return <OverviewContent />;
}
