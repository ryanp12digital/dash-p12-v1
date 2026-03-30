"use client";

import type { ReactNode } from "react";
import { DashboardSettingsProvider } from "@/components/DashboardSettingsProvider";
import { OverviewScopeProvider } from "@/components/OverviewScopeContext";
import DashboardTopMenu from "@/components/DashboardTopMenu";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardSettingsProvider>
      <div className="min-h-screen bg-[#f5f6f8] pb-24">
        <DashboardTopMenu />
        <div className="flex min-h-0 min-w-0 flex-col">
          {/* Sem overflow-auto para evitar clipping de dropdowns/tooltips (ex.: calendário) */}
          <div className="flex-1 overflow-visible">
            <OverviewScopeProvider>{children}</OverviewScopeProvider>
          </div>
        </div>
      </div>
    </DashboardSettingsProvider>
  );
}

