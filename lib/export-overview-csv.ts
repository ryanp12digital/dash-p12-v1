import type { KpiRow, CampaignRow, CampaignChannelKey } from "@/lib/data";

function csvCell(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function channelLabel(t: (k: string) => string, key: CampaignChannelKey): string {
  if (key === "pmax") return t("toolbar.filterPmax");
  if (key === "youtube") return t("toolbar.filterYoutube");
  return t("toolbar.filterSearch");
}

type Fmt = {
  formatCount: (n: number, o?: { compact?: boolean }) => string;
  formatMoneyFromUsd: (n: number, o?: { compact?: boolean; maximumFractionDigits?: number }) => string;
};

function fmtKpi(kind: KpiRow["kind"], value: number, f: Fmt): string {
  if (kind === "count") return f.formatCount(value, { compact: false });
  return f.formatMoneyFromUsd(value, { maximumFractionDigits: 2 });
}

function formatChangePct(changePct: number, intlLocale: string): string {
  const formatted = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(changePct);
  return `${formatted}%`;
}

export function buildOverviewCsvLines(
  opts: {
    t: (k: string) => string;
    intlLocale: string;
    dateFrom: string;
    dateTo: string;
    compareWithPrevious: boolean;
    accountLabel: string;
    kpiRows: KpiRow[];
    campaigns: CampaignRow[];
    fmt: Fmt;
  },
): string[] {
  const { t, intlLocale, dateFrom, dateTo, compareWithPrevious, accountLabel, kpiRows, campaigns, fmt } = opts;
  const lines: string[] = [];
  const row = (cells: string[]) => cells.map(csvCell).join(",");

  lines.push(row([t("export.period"), `${dateFrom} — ${dateTo}`]));
  lines.push(row([t("export.account"), accountLabel]));
  lines.push(row([t("export.compare"), compareWithPrevious ? "yes" : "no"]));
  lines.push("");
  lines.push(row([t("export.metric"), t("export.previous"), t("export.current"), t("export.variation")]));
  for (const kpi of kpiRows) {
    lines.push(
      row([
        t(kpi.labelKey),
        fmtKpi(kpi.kind, kpi.prev, fmt),
        fmtKpi(kpi.kind, kpi.current, fmt),
        formatChangePct(kpi.changePct, intlLocale),
      ]),
    );
  }
  lines.push("");
  lines.push(row([t("export.campaigns")]));
  lines.push(
    row([
      t("campaign.name"),
      t("export.channel"),
      t("campaign.status"),
      t("campaign.cost"),
      t("campaign.conversions"),
      t("campaign.cpa"),
      t("campaign.roas"),
    ]),
  );
  for (const c of campaigns) {
    lines.push(
      row([
        c.name,
        channelLabel(t, c.channelKey),
        t(c.statusKey),
        fmt.formatMoneyFromUsd(c.costUsd, { maximumFractionDigits: 2 }),
        String(c.conversions),
        fmt.formatMoneyFromUsd(c.cpaUsd, { maximumFractionDigits: 2 }),
        `${c.roas}x`,
      ]),
    );
  }
  return lines;
}
