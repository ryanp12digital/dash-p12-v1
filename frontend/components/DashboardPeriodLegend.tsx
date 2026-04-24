"use client";

import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";

export default function DashboardPeriodLegend() {
  const { t } = useDashboardSettings();
  const { compareWithPrevious } = useOverviewScope();

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
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
  );
}

