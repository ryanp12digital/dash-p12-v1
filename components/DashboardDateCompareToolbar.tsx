"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Calendar } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { defaultLastNDaysRange, parseYmdLocal } from "@/lib/overview-dates";

function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, onOutside, enabled]);
}

/** Seletor de intervalo de datas + alternar comparação com período anterior (reutilizável em todas as páginas do dashboard). */
export default function DashboardDateCompareToolbar() {
  const { t, intlLocale } = useDashboardSettings();
  const { dateFrom, dateTo, setDateRange, compareWithPrevious, setCompareWithPrevious } = useOverviewScope();

  const [dateOpen, setDateOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const dateRef = useRef<HTMLDivElement>(null);
  useClickOutside(dateRef, () => setDateOpen(false), dateOpen);

  useEffect(() => {
    if (dateOpen) {
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
    }
  }, [dateOpen, dateFrom, dateTo]);

  const formatRangeLabel = useCallback(() => {
    const a = parseYmdLocal(dateFrom);
    const b = parseYmdLocal(dateTo);
    const df = new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "short" });
    return `${df.format(a)} — ${df.format(b)}`;
  }, [dateFrom, dateTo, intlLocale]);

  const applyDateRange = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from > to) [from, to] = [to, from];
    setDateRange(from, to);
    setDateOpen(false);
  };

  const setPreset = (days: number) => {
    const r = defaultLastNDaysRange(days);
    setDateRange(r.from, r.to);
    setDraftFrom(r.from);
    setDraftTo(r.to);
    setDateOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative" ref={dateRef}>
        <button
          type="button"
          onClick={() => setDateOpen((o) => !o)}
          className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="max-w-[200px] truncate sm:max-w-none">{formatRangeLabel()}</span>
        </button>
        {dateOpen && (
          <div
            className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl"
            style={{ boxShadow: "0 12px 40px rgba(7,41,207,0.12)" }}
          >
            <p className="mb-3 text-xs font-semibold text-[#64748b] uppercase">{t("toolbar.dateTitle")}</p>
            <div className="mb-3 flex flex-col gap-2">
              <label className="text-xs text-[#64748b]">
                {t("toolbar.dateFrom")}
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-[#64748b]">
                {t("toolbar.dateTo")}
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="cursor-pointer rounded-lg bg-[#f1f5f9] px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#e2e8f0]"
              >
                {t("toolbar.preset7")}
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="cursor-pointer rounded-lg bg-[#f1f5f9] px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#e2e8f0]"
              >
                {t("toolbar.preset30")}
              </button>
              <button
                type="button"
                onClick={() => setPreset(90)}
                className="cursor-pointer rounded-lg bg-[#f1f5f9] px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#e2e8f0]"
              >
                {t("toolbar.preset90")}
              </button>
            </div>
            <button
              type="button"
              onClick={applyDateRange}
              className="cursor-pointer w-full rounded-lg bg-[#0729cf] py-2 text-sm font-semibold text-white hover:bg-[#0621a8]"
            >
              {t("toolbar.dateApply")}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCompareWithPrevious(!compareWithPrevious)}
        aria-pressed={compareWithPrevious}
        aria-label={compareWithPrevious ? t("toolbar.compareAriaOn") : t("toolbar.compareAriaOff")}
        className={`cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors ${
          compareWithPrevious
            ? "border-[#0729cf] bg-[#0729cf]/8 font-medium text-[#0729cf]"
            : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
        }`}
      >
        {t("overview.comparePrev")}
      </button>
    </div>
  );
}
