"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import { ArrowDown, ArrowUp } from "lucide-react";

export type ResizableTableAlign = "left" | "right";

export type ResizableTableSortDir = "asc" | "desc";
export type ResizableTableSortValue = string | number | Date | null | undefined;
export type ResizableTableSortType = "string" | "number" | "date";

export type ResizableTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  align?: ResizableTableAlign;
  className?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortType?: ResizableTableSortType;
  sortValue?: (row: T) => ResizableTableSortValue;
};

export function ResizableTable<T>({
  tableId,
  columns,
  rows,
  rowKey,
  emptyState,
  className,
  cardClassName = "bg-white/95 border border-[#e2e8f0] shadow-[0_4px_20px_rgba(7,41,207,0.06),0_1px_4px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden",
  headerClassName = "bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wider text-[#64748b]",
  bodyRowHoverClassName = "hover:bg-[#f8fafc]/90",
  onColumnResize,
  defaultSort,
}: {
  tableId: string;
  columns: ResizableTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState: React.ReactNode;
  className?: string;
  cardClassName?: string;
  headerClassName?: string;
  bodyRowHoverClassName?: string;
  onColumnResize?: (columnKey: string, width: number) => void;
  defaultSort?: { key: string; dir: ResizableTableSortDir };
}) {
  const storageKey = `p12-resizable-table-widths:${tableId}`;
  const sortStorageKey = `p12-resizable-table-sort:${tableId}`;

  const initialWidths = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of columns) map[c.key] = c.width;
    return map;
  }, [columns]);

  const [widths, setWidths] = useState<Record<string, number>>(initialWidths);

  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<ResizableTableSortDir>(defaultSort?.dir ?? "desc");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setWidths((prev) => {
        const next = { ...prev };
        for (const c of columns) {
          const v = parsed[c.key];
          if (typeof v === "number" && Number.isFinite(v)) {
            const min = c.minWidth ?? 80;
            const max = c.maxWidth ?? 600;
            next[c.key] = Math.max(min, Math.min(max, v));
          }
        }
        return next;
      });
    } catch {
      // ignore
    }
  }, [storageKey, columns]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(sortStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { key?: unknown; dir?: unknown };
      const k = typeof parsed.key === "string" ? parsed.key : null;
      const d = parsed.dir === "asc" || parsed.dir === "desc" ? parsed.dir : null;
      if (k && columns.some((c) => c.key === k)) setSortKey(k);
      if (d) setSortDir(d);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      // ignore
    }
  }, [storageKey, widths]);

  useEffect(() => {
    try {
      window.localStorage.setItem(sortStorageKey, JSON.stringify({ key: sortKey, dir: sortDir }));
    } catch {
      // ignore
    }
  }, [sortStorageKey, sortKey, sortDir]);

  const resolveSortValue = (col: ResizableTableColumn<T>, row: T): ResizableTableSortValue => {
    if (col.sortValue) return col.sortValue(row);
    const anyRow = row as any;
    if (anyRow && typeof anyRow === "object" && col.key in anyRow) return anyRow[col.key] as ResizableTableSortValue;
    return undefined;
  };

  const compareSortValues = (
    a: ResizableTableSortValue,
    b: ResizableTableSortValue,
    type: ResizableTableSortType,
  ) => {
    const aNull = a === null || a === undefined || (type === "string" && String(a).trim() === "");
    const bNull = b === null || b === undefined || (type === "string" && String(b).trim() === "");
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;

    if (type === "number") return Number(a) - Number(b);
    if (type === "date") {
      const at = a instanceof Date ? a.getTime() : new Date(a as any).getTime();
      const bt = b instanceof Date ? b.getTime() : new Date(b as any).getTime();
      return at - bt;
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  };

  const isSortable = (c: ResizableTableColumn<T>) => c.sortable ?? Boolean(c.sortValue);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !isSortable(col)) return rows;

    const type: ResizableTableSortType = col.sortType ?? "string";
    const dirFactor = sortDir === "asc" ? 1 : -1;
    return rows
      .map((r, idx) => ({ r, idx }))
      .sort((x, y) => {
        const av = resolveSortValue(col, x.r);
        const bv = resolveSortValue(col, y.r);
        const cmp = compareSortValues(av, bv, type);
        if (cmp !== 0) return cmp * dirFactor;
        return x.idx - y.idx;
      })
      .map((x) => x.r);
  }, [rows, columns, sortKey, sortDir]);

  const totalWidth = useMemo(() => {
    return columns.reduce((sum, c) => sum + (widths[c.key] ?? c.width), 0);
  }, [columns, widths]);

  return (
    <div className={className}>
      <div className={cardClassName}>
        <div className="overflow-x-auto">
          <div className="min-h-full">
            <div className={`flex py-3 ${headerClassName} border-b border-[#f1f5f9]`} style={{ minWidth: totalWidth }}>
              {columns.map((c, idx) => {
                const w = widths[c.key] ?? c.width;
                const minW = c.minWidth ?? 80;
                const maxW = c.maxWidth ?? 600;
                const isLast = idx === columns.length - 1;
                const align = c.align ?? "left";
                const sortable = isSortable(c);
                const active = sortable && sortKey === c.key;

                return (
                  <Resizable
                    key={c.key}
                    width={w}
                    height={0}
                    axis="x"
                    minConstraints={[minW, 0]}
                    maxConstraints={[maxW, 0]}
                    onResize={(_e, data) => {
                      const nextW = Math.max(minW, Math.min(maxW, data.size.width));
                      setWidths((prev) => ({ ...prev, [c.key]: nextW }));
                      onColumnResize?.(c.key, nextW);
                    }}
                    handle={
                      <span
                        className="react-resizable-handle react-resizable-handle-e right-0 top-0 h-full w-4 cursor-col-resize bg-none after:content-none"
                        aria-hidden
                      >
                        <span className="pointer-events-none absolute right-1.5 top-0 h-full w-[2px] rounded-full bg-[#e2e8f0] opacity-0 transition-all duration-150 group-hover/col:opacity-100 group-hover/col:bg-[#0729cf]" />
                      </span>
                    }
                  >
                    <div
                      className={`group/col relative flex items-center overflow-hidden px-4 sm:px-6 ${isLast ? "" : "border-r border-[#f1f5f9]"} ${c.className ?? ""}`}
                      style={{ width: w, flexShrink: 0 }}
                      aria-label={typeof c.header === "string" ? c.header : c.key}
                    >
                      <button
                        type="button"
                        disabled={!sortable}
                        onClick={() => {
                          if (!sortable) return;
                          if (sortKey !== c.key) {
                            setSortKey(c.key);
                            setSortDir("desc");
                            return;
                          }
                          setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                        }}
                        className={`flex min-w-0 items-center gap-2 ${align === "right" ? "ml-auto" : ""} ${
                          sortable ? "cursor-pointer hover:text-[#0f172a]" : "cursor-default"
                        }`}
                        aria-pressed={active ? true : undefined}
                        aria-label={sortable ? `Ordenar por ${typeof c.header === "string" ? c.header : c.key}` : undefined}
                      >
                        <span className="min-w-0 truncate">{c.header}</span>
                        {active && (
                          <span className="shrink-0 text-[#0729cf]" aria-hidden>
                            {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </button>
                    </div>
                  </Resizable>
                );
              })}
            </div>

            {sortedRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#64748b]">{emptyState}</div>
            ) : (
              <div style={{ minWidth: totalWidth }}>
                {sortedRows.map((row) => (
                  <div
                    key={rowKey(row)}
                    className={`py-3.5 group relative transition-all duration-150 border-b border-[#f1f5f9] flex ${bodyRowHoverClassName}`}
                  >
                    {columns.map((c, idx) => {
                      const w = widths[c.key] ?? c.width;
                      const isLast = idx === columns.length - 1;
                      const align = c.align ?? "left";
                      return (
                        <div
                          key={c.key}
                          className={`flex items-center min-w-0 overflow-hidden px-4 sm:px-6 ${isLast ? "" : "border-r border-[#f1f5f9]"} ${c.cellClassName ?? ""}`}
                          style={{ width: w, flexShrink: 0 }}
                        >
                          <div className={`min-w-0 w-full ${align === "right" ? "flex justify-end text-right" : "text-left"}`}>{c.render(row)}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

