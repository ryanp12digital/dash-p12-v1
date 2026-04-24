"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { metaFeaturedCampaigns, metaFeaturedAds } from "@/lib/meta-ads-data";
import { ResizableTable, type ResizableTableColumn } from "@/components/ui/resizable-table";
import TableEditModal, { type TableEditMetric } from "@/components/ui/table-edit-modal";
import { useMetaAdsData } from "@/components/meta/MetaAdsDataContext";
import { useOverviewScope } from "@/components/OverviewScopeContext";

const tableCardClass =
  "rounded-2xl border border-neutral-800/60 bg-neutral-900/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md";

const isLikelyActiveCampaign = (name: string) => !/\[(PAUSADO|PAUSED|INATIVO|INACTIVE)\]/i.test(name);

export default function MetaFeaturedCampaignsTable() {
  const { t, formatDisplayCurrencyAmount, formatCount, intlLocale } = useDashboardSettings();
  const { selectedAccountId, hasTokenConfigured } = useMetaAdsData();
  const { dateFrom, dateTo } = useOverviewScope();
  const [editOpen, setEditOpen] = useState(false);
  const [rows, setRows] = useState(() => metaFeaturedCampaigns.filter((row) => isLikelyActiveCampaign(row.name)));

  useEffect(() => {
    if (!selectedAccountId || hasTokenConfigured === false) {
      setRows(metaFeaturedCampaigns.filter((row) => isLikelyActiveCampaign(row.name)));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          accountId: selectedAccountId,
          since: dateFrom,
          until: dateTo,
          limit: "100",
        });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/featured-ads?${params.toString()}`);
        const data = (await res.json()) as { ads?: typeof metaFeaturedAds; error?: string };
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        if (cancelled) return;

        const ads = (data.ads ?? []).filter((ad) => isLikelyActiveCampaign(ad.campaignName));
        if (ads.length === 0) {
          setRows(metaFeaturedCampaigns.filter((row) => isLikelyActiveCampaign(row.name)));
          return;
        }

        const byCampaign = new Map<string, (typeof metaFeaturedCampaigns)[number]>();
        const campaignAdCount = new Map<string, number>();

        for (const ad of ads) {
          const key = ad.campaignName.trim();
          const resultValue = Number(ad.resultValue.replace(/\./g, "").replace(",", ".")) || 0;
          campaignAdCount.set(key, (campaignAdCount.get(key) ?? 0) + 1);
          const current = byCampaign.get(key);
          if (!current) {
            byCampaign.set(key, {
              name: key,
              resultValue: String(resultValue),
              resultLabelKey: ad.resultLabelKey,
              costPerResultBrl: ad.costPerResultBrl,
              spent: ad.spent,
              reach: ad.reach,
              impressions: ad.impressions,
              linkClicks: ad.linkClicks,
              ctr: ad.ctr,
              cpc: ad.cpc,
              cpm: ad.cpm,
              frequency: ad.frequency,
            });
            continue;
          }

          current.resultValue = String((Number(current.resultValue) || 0) + resultValue);
          current.spent += ad.spent;
          current.reach += ad.reach;
          current.impressions += ad.impressions;
          current.linkClicks += ad.linkClicks;
          current.ctr += ad.ctr;
          current.cpc += ad.cpc;
          current.cpm += ad.cpm;
          current.frequency += ad.frequency;
          current.resultLabelKey = ad.resultLabelKey;
        }

        const aggregated = Array.from(byCampaign.values()).map((campaign) => {
          const adCount = campaignAdCount.get(campaign.name) ?? 1;
          const safeResults = Number(campaign.resultValue) || 0;
          const costPerResult = safeResults > 0 ? campaign.spent / safeResults : campaign.costPerResultBrl;
          return {
            ...campaign,
            costPerResultBrl: costPerResult,
            ctr: campaign.ctr / adCount,
            cpc: campaign.cpc / adCount,
            cpm: campaign.cpm / adCount,
            frequency: campaign.frequency / adCount,
            resultValue: String(safeResults),
          };
        });

        setRows(
          (aggregated.length > 0 ? aggregated : metaFeaturedCampaigns).filter((row) =>
            isLikelyActiveCampaign(row.name),
          ),
        );
      } catch {
        if (!cancelled) setRows(metaFeaturedCampaigns.filter((row) => isLikelyActiveCampaign(row.name)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId, hasTokenConfigured, dateFrom, dateTo]);

  const fmtPct = useCallback(
    (n: number) => `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n)}%`,
    [intlLocale],
  );

  const columns = useMemo<ResizableTableColumn<(typeof rows)[number]>[]>(
    () => [
      {
        key: "campaignName",
        header: t("meta.colCampaignName"),
        width: 240,
        minWidth: 200,
        sortable: true,
        sortType: "string",
        sortValue: (row) => row.name,
        render: (row) => <span className="truncate text-sm font-semibold text-neutral-100">{row.name}</span>,
      },
      {
        key: "results",
        header: t("meta.colResults"),
        width: 120,
        minWidth: 100,
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.resultValue,
        render: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-neutral-100">{row.resultValue}</span>
            <span className="text-[11px] leading-tight text-neutral-500">{t(row.resultLabelKey)}</span>
          </div>
        ),
      },
      {
        key: "costPerResult",
        header: t("meta.colCostPerResult"),
        width: 140,
        minWidth: 120,
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.costPerResultBrl,
        render: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-neutral-100">
              {formatDisplayCurrencyAmount(row.costPerResultBrl, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] leading-tight text-neutral-500">{t(row.resultLabelKey)}</span>
          </div>
        ),
      },
      {
        key: "spent",
        header: t("meta.colSpent"),
        width: 140,
        minWidth: 110,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.spent,
        render: (row) => (
          <span className="text-right text-sm font-medium text-neutral-100">
            {formatDisplayCurrencyAmount(row.spent, { maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: "reach",
        header: t("meta.colReach"),
        width: 120,
        minWidth: 100,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.reach,
        render: (row) => <span className="text-sm text-neutral-200">{formatCount(row.reach)}</span>,
      },
      {
        key: "impressions",
        header: t("meta.colImpressions"),
        width: 140,
        minWidth: 110,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.impressions,
        render: (row) => <span className="text-sm text-neutral-200">{formatCount(row.impressions)}</span>,
      },
      {
        key: "linkClicks",
        header: t("meta.colLinkClicks"),
        width: 140,
        minWidth: 110,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.linkClicks,
        render: (row) => <span className="text-sm text-neutral-200">{formatCount(row.linkClicks)}</span>,
      },
      {
        key: "ctr",
        header: t("meta.colCtrAll"),
        width: 90,
        minWidth: 80,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.ctr,
        render: (row) => <span className="text-sm text-neutral-200">{fmtPct(row.ctr)}</span>,
      },
      {
        key: "cpc",
        header: t("meta.colCpc"),
        width: 110,
        minWidth: 90,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.cpc,
        render: (row) => (
          <span className="text-sm text-neutral-200">
            {formatDisplayCurrencyAmount(row.cpc, { maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: "cpm",
        header: t("meta.colCpm"),
        width: 110,
        minWidth: 90,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.cpm,
        render: (row) => (
          <span className="text-sm text-neutral-200">
            {formatDisplayCurrencyAmount(row.cpm, { maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: "frequency",
        header: t("meta.colFrequency"),
        width: 120,
        minWidth: 100,
        align: "right",
        sortable: true,
        sortType: "number",
        sortValue: (row) => row.frequency,
        render: (row) => (
          <span className="text-sm text-neutral-200">
            {new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.frequency)}
          </span>
        ),
      },
    ],
    [t, formatDisplayCurrencyAmount, formatCount, intlLocale, fmtPct],
  );

  const storageKey = "p12-table-layout:meta-featured-campaigns";
  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  useEffect(() => {
    setColumnOrder((prev) => {
      const merged = [...prev.filter((k) => defaultOrder.includes(k)), ...defaultOrder.filter((k) => !prev.includes(k))];
      if (prev.length === merged.length && prev.every((v, i) => v === merged[i])) return prev;
      return merged;
    });
  }, [defaultOrder]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { order?: string[]; hidden?: string[] };
      if (Array.isArray(parsed.order)) {
        setColumnOrder((prev) => {
          if (prev.length === parsed.order!.length && prev.every((v, i) => v === parsed.order![i])) return prev;
          return parsed.order!;
        });
      }
      if (Array.isArray(parsed.hidden)) setHiddenKeys(parsed.hidden);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ order: columnOrder, hidden: hiddenKeys }));
    } catch {
      // ignore
    }
  }, [storageKey, columnOrder, hiddenKeys]);

  const columnsByKey = useMemo(() => {
    const map = new Map<string, ResizableTableColumn<(typeof rows)[number]>>();
    for (const c of columns) map.set(c.key, c);
    return map;
  }, [columns]);

  const orderedColumnKeys = useMemo(
    () => [...columnOrder.filter((k) => columnsByKey.has(k)), ...defaultOrder.filter((k) => !columnOrder.includes(k))],
    [columnOrder, columnsByKey, defaultOrder],
  );

  const visibleColumns = useMemo(
    () =>
      orderedColumnKeys
        .filter((k) => !hiddenKeys.includes(k))
        .map((k) => columnsByKey.get(k))
        .filter(Boolean) as ResizableTableColumn<(typeof rows)[number]>[],
    [orderedColumnKeys, hiddenKeys, columnsByKey],
  );

  const toggleColumn = (key: string) => {
    setHiddenKeys((prev) => {
      const isHidden = prev.includes(key);
      if (!isHidden) {
        if (visibleColumns.length <= 1) return prev;
        return [...prev, key];
      }
      return prev.filter((k) => k !== key);
    });
  };

  const resetColumns = () => {
    setColumnOrder(defaultOrder);
    setHiddenKeys([]);
  };

  return (
    <div className={tableCardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/50 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-base font-semibold text-neutral-100">{t("meta.tableCampaignsTitle")}</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-500 hover:text-cyan-300"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("meta.editTable")}
        </button>
      </div>
      <ResizableTable
        tableId="meta-featured-campaigns"
        variant="dark"
        columns={visibleColumns}
        rows={rows}
        rowKey={(row) => `${row.name}-${row.resultValue}-${row.resultLabelKey}`}
        emptyState="Nenhuma campanha encontrada."
        cardClassName="bg-transparent border-0 shadow-none rounded-none overflow-visible"
      />
      <TableEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar tabela: Campanhas"
        metrics={orderedColumnKeys
          .map((key) => columnsByKey.get(key))
          .filter(Boolean)
          .map((col) => ({ key: col!.key, label: typeof col!.header === "string" ? col!.header : col!.key })) as TableEditMetric[]}
        order={orderedColumnKeys}
        hiddenKeys={hiddenKeys}
        onReset={resetColumns}
        onOrderChange={setColumnOrder}
        onToggleMetric={toggleColumn}
      />
    </div>
  );
}
