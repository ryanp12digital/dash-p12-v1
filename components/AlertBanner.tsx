import { Zap } from "lucide-react";

export default function AlertBanner() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[#0729cf] rounded-lg flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f172a]">Critical Insights &amp; Next Actions</p>
          <p className="text-sm text-[#64748b] mt-0.5">
            <span className="text-orange-500 font-medium">Warning:</span> CPA increased by 15% on Pmax campaigns. High-performing campaign{" "}
            <span className="font-semibold text-[#0f172a]">&apos;Summer Sale&apos;</span> is nearing its budget cap. Recommended bid adjustment: +8% to maintain Impression Share.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg px-4 py-2 hover:bg-[#f8fafc] transition-colors">
          DISMISS
        </button>
        <button className="text-sm font-semibold text-white bg-[#0729cf] rounded-lg px-4 py-2 hover:bg-[#0621a8] transition-colors">
          APPLY OPTIMIZATIONS
        </button>
      </div>
    </div>
  );
}
