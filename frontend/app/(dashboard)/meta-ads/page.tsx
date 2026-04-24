"use client";

import MetaAdsPageHeader from "@/components/meta/MetaAdsPageHeader";
import MetaAdsKpiGrid from "@/components/meta/MetaAdsKpiGrid";
import MetaFeaturedCampaignsTable from "@/components/meta/MetaFeaturedCampaignsTable";
import MetaFeaturedAdsTable from "@/components/meta/MetaFeaturedAdsTable";
import MetaAdsChartsSection from "@/components/meta/MetaAdsChartsSection";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { DASHBOARD_PAGE_MAIN_CLASS } from "@/lib/dashboard-layout";

export default function MetaAdsPage() {
  const { t } = useDashboardSettings();
  const { insightsError } = useMetaAdsData();

  return (
    <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      <MetaAdsPageHeader />
      {insightsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {insightsError} — {t("meta.insightsFallback")}
        </div>
      )}
      <MetaAdsKpiGrid />
      <MetaFeaturedCampaignsTable />
      <MetaFeaturedAdsTable />
      <MetaAdsChartsSection />
      <footer className="py-4 text-center text-xs text-[#94a3b8]">{t("overview.footer")}</footer>
    </main>
  );
}
