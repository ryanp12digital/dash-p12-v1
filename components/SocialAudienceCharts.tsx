"use client";

import type { ReactNode } from "react";
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

const CHART_CARD_CLASS =
  "flex flex-col rounded-2xl border border-neutral-800/50 bg-neutral-900/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm";

const TOOLTIP_DARK = {
  borderRadius: 12,
  border: "1px solid rgba(82,82,82,0.8)",
  background: "#0a0a0a",
  color: "#e5e5e5",
} as const;

function ChartShell({
  titleKey,
  children,
}: {
  titleKey: string;
  children: ReactNode;
}) {
  const { t } = useDashboardSettings();
  return (
    <div className={CHART_CARD_CLASS}>
      <div className="mb-4 text-center">
        <h3 className="text-base font-medium tracking-tight text-neutral-200">{t(titleKey)}</h3>
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
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <h2 className="text-base font-semibold tracking-tight text-neutral-100">{t("overview.sectionSocialAudience")}</h2>
        <p className="text-xs font-light text-neutral-500">{t("overview.sectionSocialAudienceHint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartShell titleKey="social.chartFollowerGrowth">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={followerGrowthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="socialFollowersBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                axisLine={{ stroke: "rgba(82,82,82,0.6)" }}
              />
              <YAxis
                domain={["dataMin - 20", "dataMax + 20"]}
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                axisLine={false}
                tickLine={false}
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
                contentStyle={TOOLTIP_DARK}
                labelStyle={{ color: "#a3a3a3" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={() => <span className="text-neutral-400">{t("social.legendFollowers")}</span>}
              />
              <Bar
                dataKey="seguidores"
                fill="url(#socialFollowersBar)"
                radius={[8, 8, 0, 0]}
                name={t("social.legendFollowers")}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartDailyReach">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyReachData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: "#a3a3a3" }}
                interval={4}
                angle={-35}
                textAnchor="end"
                height={52}
                axisLine={{ stroke: "rgba(82,82,82,0.6)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(v as number)
                }
              />
              <Tooltip
                formatter={(v) => [
                  new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(Number(v ?? 0)),
                  t("social.legendReach"),
                ]}
                contentStyle={TOOLTIP_DARK}
                labelStyle={{ color: "#a3a3a3" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={() => <span className="text-neutral-400">{t("social.legendReach")}</span>}
              />
              <Line
                type="monotone"
                dataKey="alcance"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#22d3ee", stroke: "#0a0a0a", strokeWidth: 2 }}
                name={t("social.legendReach")}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartAgeGender">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={audienceAgeGenderData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={4}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(64,64,64,0.45)" vertical={false} />
              <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={{ stroke: "rgba(82,82,82,0.6)" }} />
              <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_DARK}
                labelStyle={{ color: "#a3a3a3" }}
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
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => {
                  const map: Record<string, string> = {
                    masculino: t("social.legendMale"),
                    feminino: t("social.legendFemale"),
                    desconhecido: t("social.legendUnknown"),
                  };
                  return <span className="text-neutral-400">{map[value] ?? value}</span>;
                }}
              />
              <Bar dataKey="masculino" fill={SOCIAL_GENDER_COLORS.male} radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="feminino" fill={SOCIAL_GENDER_COLORS.female} radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="desconhecido" fill={SOCIAL_GENDER_COLORS.unknown} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell titleKey="social.chartGenderPie">
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
                contentStyle={TOOLTIP_DARK}
                labelStyle={{ color: "#a3a3a3" }}
              />
              <Legend formatter={(value) => <span className="text-neutral-400">{value}</span>} />
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
                    fill="#e5e5e5"
                    textAnchor={textAnchor ?? "middle"}
                    dominantBaseline="central"
                    className="text-[11px] font-semibold"
                  >
                    {((percent ?? 0) * 100).toFixed(2)}%
                  </text>
                )}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} stroke="rgba(23,23,23,0.95)" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </section>
  );
}
