"use client";

import MetaAdsPageHeader from "@/components/meta/MetaAdsPageHeader";
import MetaAdsKpiGrid from "@/components/meta/MetaAdsKpiGrid";
import MetaFeaturedCampaignsTable from "@/components/meta/MetaFeaturedCampaignsTable";
import MetaFeaturedAdsTable from "@/components/meta/MetaFeaturedAdsTable";
import MetaAdsChartsSection from "@/components/meta/MetaAdsChartsSection";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS } from "@/lib/dashboard-layout";
import PageWidgetLayout from "@/components/dashboard/PageWidgetLayout";

export default function MetaAdsPage() {
  const { t } = useDashboardSettings();
  const { insightsError } = useMetaAdsData();

  return (
    <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      <MetaAdsPageHeader />
      {insightsError && (
        <div className="rounded-xl border border-(--border-accent) bg-(--accent-soft) px-4 py-3 text-sm text-(--text-secondary)">
          {insightsError} — {t("meta.insightsFallback")}
        </div>
      )}
      <PageWidgetLayout
        layoutId="meta-ads"
        blocks={[
          { id: "kpi", labelKey: "pageBlock.meta.kpis", content: <MetaAdsKpiGrid /> },
          { id: "campaigns", labelKey: "pageBlock.meta.campaigns", content: <MetaFeaturedCampaignsTable /> },
          { id: "ads", labelKey: "pageBlock.meta.ads", content: <MetaFeaturedAdsTable /> },
          { id: "charts", labelKey: "pageBlock.meta.charts", content: <MetaAdsChartsSection /> },
        ]}
      />
      <footer className="py-4 text-center text-xs text-(--text-muted)">{t("overview.footer")}</footer>
    </main>
  );
}
