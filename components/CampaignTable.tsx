import { campaigns } from "@/lib/data";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-[#94a3b8]" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider ${
        isActive ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
      }`}
    >
      {status}
    </span>
  );
};

export default function CampaignTable() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-base font-semibold text-[#0f172a]">Campaign Performance</h2>
        <span className="text-xs text-[#64748b] flex items-center gap-1.5">
          Top Performing <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-[#0f172a]">
            {["CAMPAIGN NAME", "STATUS", "BUDGET", "COST", "CONVERSIONS", "CPA", "ROAS"].map((h) => (
              <th key={h} className="text-left text-[10px] font-semibold text-[#94a3b8] tracking-wider px-6 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr
              key={c.name}
              className={`border-t border-[#f1f5f9] ${c.highlight ? "bg-[#0729cf]/5" : "hover:bg-[#f8fafc]"} transition-colors`}
            >
              <td className="px-6 py-4">
                <span className={`text-sm font-semibold ${c.highlight ? "text-[#0729cf]" : "text-[#0f172a]"}`}>
                  {c.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-6 py-4 text-sm text-[#64748b]">{c.budget}</td>
              <td className="px-6 py-4 text-sm font-medium text-[#0f172a]">{c.cost}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0f172a]">{c.conversions}</span>
                  <TrendIcon trend={c.trend} />
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[#64748b]">{c.cpa}</td>
              <td className="px-6 py-4 text-sm font-semibold text-[#0f172a]">{c.roas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
