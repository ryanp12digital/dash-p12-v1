"use client";

import { useState, useCallback, useEffect } from "react";
import { kpiData, type KpiRow, type KpiPlatform } from "@/lib/data";
import { CircleHelp, TrendingUp, TrendingDown, Minus, GripVertical } from "lucide-react";
import { IconMeta, IconGoogleAds, IconFacebook, IconInstagram } from "@/components/platform-icons";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const cardBase =
  "flex h-[132px] flex-col justify-between overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm";
const cardHover =
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md";

function formatChangePct(pct: number, intlLocale: string): string {
  if (pct === 0) return "0%";
  const n = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(pct);
  return `${n}%`;
}

function PlatformIcons({ platforms }: { platforms: KpiPlatform[] }) {
  return (
    <div className="flex justify-center gap-2 py-1">
      {platforms.map((p) => (
        <span
          key={p}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc]"
          aria-hidden
        >
          {p === "meta" && <IconMeta className="h-5 w-5 text-[#0668E1]" />}
          {p === "google" && <IconGoogleAds className="h-5 w-5 text-[#4285F4]" />}
          {p === "facebook" && <IconFacebook className="h-5 w-5 text-[#1877F2]" />}
          {p === "instagram" && <IconInstagram className="h-5 w-5 text-[#E4405F]" />}
        </span>
      ))}
    </div>
  );
}

function KpiCardContent({ kpi }: { kpi: KpiRow }) {
  const { t, intlLocale, formatCount, formatMoneyFromUsd } = useDashboardSettings();
  const { compareWithPrevious } = useOverviewScope();

  const main =
    kpi.kind === "count"
      ? formatCount(kpi.current, { compact: false })
      : formatMoneyFromUsd(kpi.current, { maximumFractionDigits: 2 });

  const prevFormatted =
    kpi.kind === "count"
      ? formatCount(kpi.prev, { compact: false })
      : formatMoneyFromUsd(kpi.prev, { maximumFractionDigits: 2 });

  const pct = formatChangePct(kpi.changePct, intlLocale);

  const pillClass =
    kpi.tone === "up"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
      : kpi.tone === "down"
        ? "bg-red-50 text-red-700 ring-1 ring-red-200/80"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80";

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-[#0f172a]">
          {t(kpi.labelKey)}
        </h3>
        <button
          type="button"
          className="shrink-0 rounded-md p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
          title={t(kpi.helpKey)}
          aria-label={t(kpi.helpKey)}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </div>

      <PlatformIcons platforms={kpi.platforms} />

      <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{main}</p>

      {compareWithPrevious && (
        <>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pillClass}`}>
              {kpi.tone === "up" && <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "down" && <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "neutral" && <Minus className="h-3.5 w-3.5 opacity-70" aria-hidden />}
              {pct}
            </span>
          </div>
          <p className="mt-3 text-xs text-[#64748b]">
            <span className="font-medium text-[#94a3b8]">{t("overview.prevPeriodValue")}: </span>
            {prevFormatted}
          </p>
        </>
      )}
    </>
  );
}

function SortableKpiCard({ kpi, i }: { kpi: KpiRow; i: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: kpi.labelKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animation: isDragging ? undefined : `kpiSlideUp 0.45s ease both`,
    animationDelay: isDragging ? undefined : `${i * 40}ms`,
    boxShadow: isDragging
      ? "0 8px 30px rgba(0,0,0,0.12), 0 4px 16px rgba(7,41,207,0.1)"
      : "0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(7,41,207,0.04)",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${cardBase} ${cardHover}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="absolute top-2 right-2 cursor-grab touch-none rounded-md p-0.5 text-[#cbd5e1] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Arrastar card"
        tabIndex={0}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <KpiCardContent kpi={kpi} />
    </div>
  );
}

function DragOverlayCard({ kpi }: { kpi: KpiRow }) {
  return (
    <div
      className={`${cardBase} rotate-1 scale-105`}
      style={{
        boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 8px 20px rgba(7,41,207,0.12)",
      }}
    >
      <KpiCardContent kpi={kpi} />
    </div>
  );
}

function useKpiOrder(section: "ads" | "social", initial: KpiRow[]) {
  const storageKey = `kpi-order-${section}`;

  const getInitialOrder = (): KpiRow[] => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return initial;
      const savedKeys: string[] = JSON.parse(saved);
      const map = new Map(initial.map((k) => [k.labelKey, k]));
      const ordered = savedKeys.map((k) => map.get(k)).filter(Boolean) as KpiRow[];
      // append any new keys not in saved order
      const missing = initial.filter((k) => !savedKeys.includes(k.labelKey));
      return [...ordered, ...missing];
    } catch {
      return initial;
    }
  };

  const [rows, setRows] = useState<KpiRow[]>(getInitialOrder);

  const reorder = useCallback(
    (newRows: KpiRow[]) => {
      setRows(newRows);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newRows.map((r) => r.labelKey)));
      } catch {}
    },
    [storageKey],
  );

  return { rows, reorder };
}

function KpiGroup({
  titleKey,
  section,
  initialRows,
  animOffset,
}: {
  titleKey: string;
  section: "ads" | "social";
  initialRows: KpiRow[];
  animOffset: number;
}) {
  const { t } = useDashboardSettings();
  const { rows, reorder } = useKpiOrder(section, initialRows);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeKpi = activeId ? rows.find((r) => r.labelKey === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.labelKey === active.id);
    const newIndex = rows.findIndex((r) => r.labelKey === over.id);
    reorder(arrayMove(rows, oldIndex, newIndex));
  }

  if (!mounted) {
    return (
      <div>
        <h3 className="mb-3 text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
          {t(titleKey)}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((kpi, j) => (
            <div key={kpi.labelKey} className={`group relative ${cardBase} ${cardHover}`} style={{ animation: `kpiSlideUp 0.45s ease both`, animationDelay: `${(animOffset + j) * 40}ms` }}>
              <KpiCardContent kpi={kpi} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
        {t(titleKey)}
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rows.map((r) => r.labelKey)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((kpi, j) => (
              <SortableKpiCard key={kpi.labelKey} kpi={kpi} i={animOffset + j} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeKpi ? <DragOverlayCard kpi={activeKpi} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default function KpiCards() {
  const adsRows = kpiData.filter((k) => k.section === "ads");
  const socialRows = kpiData.filter((k) => k.section === "social");

  return (
    <div className="space-y-8">
      <KpiGroup
        titleKey="overview.kpiGroupAds"
        section="ads"
        initialRows={adsRows}
        animOffset={0}
      />
      <KpiGroup
        titleKey="overview.kpiGroupSocial"
        section="social"
        initialRows={socialRows}
        animOffset={adsRows.length}
      />

      <style>{`
        @keyframes kpiSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
