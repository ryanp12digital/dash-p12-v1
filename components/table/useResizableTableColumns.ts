"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

export function useResizableTableColumns<T extends string>({
  tableId,
  defaultWidths,
  minWidth = 80,
  maxWidth = 600,
}: {
  tableId: string;
  defaultWidths: Record<T, number>;
  minWidth?: number;
  maxWidth?: number;
}) {
  const storageKey = `p12-table-col-widths:${tableId}`;

  const [widths, setWidths] = useState<Record<string, number>>(() => ({ ...defaultWidths }));

  const resizingKeyRef = useRef<T | null>(null);
  const startXRef = useRef(0);
  const startWRef = useRef(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(defaultWidths)) {
        const candidate = parsed[k];
        if (typeof candidate === "number" && Number.isFinite(candidate)) next[k] = candidate;
      }
      setWidths((prev) => ({ ...prev, ...next }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      // ignore
    }
  }, [storageKey, widths]);

  const cols = useMemo(() => Object.keys(defaultWidths), [defaultWidths]);

  const beginResize = (key: T, e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    resizingKeyRef.current = key;
    startXRef.current = e.clientX;
    startWRef.current = widths[key] ?? defaultWidths[key];

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      const k = resizingKeyRef.current;
      if (!k) return;
      const dx = ev.clientX - startXRef.current;
      const raw = startWRef.current + dx;
      const nextW = Math.max(minWidth, Math.min(maxWidth, raw));
      setWidths((prev) => ({ ...prev, [k]: nextW }));
    };
    const onUp = () => {
      resizingKeyRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [minWidth, maxWidth]);

  return { widths, cols, beginResize };
}

