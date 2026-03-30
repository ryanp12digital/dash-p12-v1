"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import {
  SOCIAL_GENDER_COLORS,
  followerGrowthData,
  dailyReachData,
  audienceAgeGenderData,
  followersGenderPie,
} from "@/lib/overview-gmb-social-data";

function ChartShell({
  titleKey,
  helpKey,
  children,
}: {
  titleKey: string;
  helpKey: string;
  children: ReactNode;
}) {
  const { t } = useDashboardSettings();
  return (
    <div
      className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)" }}
    >
      <div className="mb-2 flex items-center justify-center gap-1.5">
        <h3 className="text-center text-sm font-semibold text-[#0f172a]">{t(titleKey)}</h3>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
          title={t(helpKey)}
          aria-label={t(helpKey)}
        >
          <CircleHelp className="h-3 w-3" />
        </button>
      </div>
      <div className="min-h-[220px] flex-1">{children}</div>
    </div>
  );
}

export default function SocialAudienceCharts() {
  const { t, intlLocale } = useDashboardSettings();

  const pieData = followersGenderPie.map((s) => ({
    ...s,
    name: t(s.nameKey),
  }));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#0f172a]">{t("overview.sectionSocialAudience")}</h2>
        <p className="text-xs text-[#64748b]">{t("overview.sectionSocialAudienceHint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartShell titleKey="social.chartFollowerGrowth" helpKey="social.help.followerGrowth">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={followerGrowthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                domain={["dataMin - 20", "dataMax + 20"]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(v as number)
                }
              />
              <Tooltip
                formatter={(v) => [
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(Number(v ?? 0)),
                  t("social.legendFollowers"),
                ]}
                labelFormatter={(l) => String(l)}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={() => <span className="text-[#475569]">{t("social.legendFollowers")}</span>}
              />
              <Bar dataKey="seguidores" fill={SOCIAL_GENDER_COLORS.male} radius={[6, 6, 0, 0]} name={t("social.legendFollowers")} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartDailyReach" helpKey="social.help.dailyReach">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyReachData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={4} angle={-35} textAnchor="end" height={52} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(v as number)
                }
              />
              <Tooltip
                formatter={(v) => [
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(Number(v ?? 0)),
                  t("social.legendReach"),
                ]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Legend
                formatter={() => <span className="text-[#475569]">{t("social.legendReach")}</span>}
              />
              <Line
                type="monotone"
                dataKey="alcance"
                stroke={SOCIAL_GENDER_COLORS.male}
                strokeWidth={2}
                dot={false}
                name={t("social.legendReach")}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartAgeGender" helpKey="social.help.ageGender">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={audienceAgeGenderData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                formatter={(v, name) => {
                  const n = String(name ?? "");
                  const label =
                    n === "masculino"
                      ? t("social.legendMale")
                      : n === "feminino"
                        ? t("social.legendFemale")
                        : t("social.legendUnknown");
                  return [new Intl.NumberFormat(intlLocale).format(Number(v ?? 0)), label];
                }}
              />
              <Legend
                formatter={(value) => {
                  const map: Record<string, string> = {
                    masculino: t("social.legendMale"),
                    feminino: t("social.legendFemale"),
                    desconhecido: t("social.legendUnknown"),
                  };
                  return <span className="text-[#475569]">{map[value] ?? value}</span>;
                }}
              />
              <Bar dataKey="masculino" fill={SOCIAL_GENDER_COLORS.male} radius={[2, 2, 0, 0]} />
              <Bar dataKey="feminino" fill={SOCIAL_GENDER_COLORS.female} radius={[2, 2, 0, 0]} />
              <Bar dataKey="desconhecido" fill={SOCIAL_GENDER_COLORS.unknown} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartGenderPie" helpKey="social.help.genderPie">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip
                formatter={(v, _n, item) => {
                  const name =
                    item && typeof item === "object" && "payload" in item
                      ? String((item.payload as { name?: string }).name ?? "")
                      : "";
                  return [
                    `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(Number(v ?? 0))}%`,
                    name,
                  ];
                }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Legend
                formatter={(value) => <span className="text-[#475569]">{value}</span>}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={1}
                labelLine={false}
                label={({ percent, x, y, textAnchor }) => (
                  <text
                    x={x ?? 0}
                    y={y ?? 0}
                    fill="#0f172a"
                    textAnchor={textAnchor ?? "middle"}
                    dominantBaseline="central"
                    className="text-[11px] font-semibold"
                  >
                    {((percent ?? 0) * 100).toFixed(2)}%
                  </text>
                )}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} stroke="white" strokeWidth={1} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </section>
  );
}
