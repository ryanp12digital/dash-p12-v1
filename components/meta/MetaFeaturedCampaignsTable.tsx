"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Pencil } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { metaFeaturedCampaigns } from "@/lib/meta-ads-data";
import { ResizableTable, type ResizableTableColumn } from "@/components/ui/resizable-table";
import TableEditModal, { type TableEditMetric } from "@/components/ui/table-edit-modal";

const tableCardClass =
  "overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white/95 shadow-[0_4px_20px_rgba(7,41,207,0.06),0_1px_4px_rgba(0,0,0,0.04)]";

const theadClass =
  "bg-[#f8fafc] text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]";

export default function MetaFeaturedCampaignsTable() {
  const { t, formatDisplayCurrencyAmount, formatCount, intlLocale } = useDashboardSettings();
  const [editOpen, setEditOpen] = useState(false);

  const fmtPct = (n: number) =>
    `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(n)}%`;

  const columns = useMemo<ResizableTableColumn<(typeof metaFeaturedCampaigns)[number]>[]>(
    () => [
      {
        key: "campaignName",
        header: t("meta.colCampaignName"),
        width: 240,
        minWidth: 200,
        sortable: true,
        sortType: "string",
        sortValue: (row) => row.name,
        render: (row) => <span className="text-sm font-semibold text-[#0f172a] truncate">{row.name}</span>,
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
            <span className="text-sm font-bold text-[#0f172a]">{row.resultValue}</span>
            <span className="text-[11px] leading-tight text-[#64748b]">{t(row.resultLabelKey)}</span>
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
            <span className="text-sm font-bold text-[#0f172a]">
              {formatDisplayCurrencyAmount(row.costPerResultBrl, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] leading-tight text-[#64748b]">{t(row.resultLabelKey)}</span>
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
          <span className="text-right text-sm font-medium text-[#0f172a]">
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
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.reach)}</span>,
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
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.impressions)}</span>,
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
        render: (row) => <span className="text-sm text-[#0f172a]">{formatCount(row.linkClicks)}</span>,
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
        render: (row) => <span className="text-sm text-[#0f172a]">{fmtPct(row.ctr)}</span>,
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
          <span className="text-sm text-[#0f172a]">
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
          <span className="text-sm text-[#0f172a]">
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
          <span className="text-sm text-[#0f172a]">
            {new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(row.frequency)}
          </span>
        ),
      },
    ],
    [t, formatDisplayCurrencyAmount, formatCount, intlLocale],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ order: columnOrder, hidden: hiddenKeys }));
    } catch {
      // ignore
    }
  }, [storageKey, columnOrder, hiddenKeys]);

  const columnsByKey = useMemo(() => {
    const map = new Map<string, ResizableTableColumn<(typeof metaFeaturedCampaigns)[number]>>();
    for (const c of columns) map.set(c.key, c);
    return map;
  }, [columns]);

  const orderedColumnKeys = useMemo(
    () => [...columnOrder.filter((k) => columnsByKey.has(k)), ...defaultOrder.filter((k) => !columnOrder.includes(k))],
    [columnOrder, columnsByKey, defaultOrder],
  );

  const visibleColumns = useMemo(
    () => orderedColumnKeys.filter((k) => !hiddenKeys.includes(k)).map((k) => columnsByKey.get(k)).filter(Boolean) as ResizableTableColumn<(typeof metaFeaturedCampaigns)[number]>[],
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-base font-semibold text-[#0f172a]">{t("meta.tableCampaignsTitle")}</h2>
          <button
            type="button"
            className="rounded-md p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9]"
            title={t("meta.tableCampaignsHelp")}
            aria-label={t("meta.tableCampaignsHelp")}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("meta.editTable")}
        </button>
      </div>
      <ResizableTable
        tableId="meta-featured-campaigns"
        columns={visibleColumns}
        rows={metaFeaturedCampaigns}
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
