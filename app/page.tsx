import Header from "@/components/Header";
import AlertBanner from "@/components/AlertBanner";
import KpiCards from "@/components/KpiCards";
import CostConversionsChart from "@/components/CostConversionsChart";
import CampaignTable from "@/components/CampaignTable";
import DevicePlacement from "@/components/DevicePlacement";
import MultiMetricChart from "@/components/MultiMetricChart";
import FunnelStacked from "@/components/FunnelStacked";
import { Calendar, SlidersHorizontal, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Header />

      <main className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">
        {/* Performance Overview Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-[#0729cf] tracking-widest uppercase">Performance Overview</p>
            <h1 className="text-3xl font-bold text-[#0f172a] mt-1 tracking-tight">P12 Digital Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-sm font-medium text-[#0f172a] border border-[#e2e8f0] bg-white rounded-lg px-4 py-2 hover:bg-[#f8fafc] transition-colors">
              <Calendar className="w-4 h-4" />
              LAST 30 DAYS
            </button>
            <button className="flex items-center gap-2 text-sm text-[#64748b] border border-[#e2e8f0] bg-white rounded-lg px-4 py-2 hover:bg-[#f8fafc] transition-colors">
              COMPARE: PREV
            </button>
            <button className="p-2 border border-[#e2e8f0] bg-white rounded-lg hover:bg-[#f8fafc] transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-[#64748b]" />
            </button>
            <button className="flex items-center gap-2 text-sm font-semibold text-white bg-[#0729cf] rounded-lg px-4 py-2 hover:bg-[#0621a8] transition-colors">
              <Download className="w-4 h-4" />
              EXPORT REPORT
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        <AlertBanner />

        {/* Performance Summaries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#0f172a]">Performance Summaries</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#94a3b8]">
                <span className="w-2 h-2 rounded-full bg-[#94a3b8] inline-block" />
                PERÍODO ANTERIOR
              </span>
              <span className="flex items-center gap-1.5 text-[#0729cf] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#0729cf] inline-block" />
                PERÍODO ATUAL
              </span>
            </div>
          </div>
          <KpiCards />
        </div>

        {/* Cost vs Conversions Chart */}
        <CostConversionsChart />

        {/* Campaign Performance */}
        <CampaignTable />

        {/* Device + Placement */}
        <DevicePlacement />

        {/* Funnel Chart */}
        <FunnelStacked />

        {/* Multi-Metric Chart */}
        <MultiMetricChart />

        {/* Footer */}
        <footer className="text-center text-xs text-[#94a3b8] py-4">
          © 2024 P12 Digital • Premium Marketing Performance • All Rights Reserved
        </footer>
      </main>
    </div>
  );
}
