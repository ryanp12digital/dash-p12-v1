"use client";

import { useState, useCallback, useEffect } from "react";
import { kpiData, type KpiRow, type KpiPlatform } from "@/lib/data";
import { TrendingUp, TrendingDown, Minus, GripVertical } from "lucide-react";
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
  "group relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(100,95,120,0.28)] bg-[rgba(16,15,26,0.92)] p-5 transition-[border-color,box-shadow,transform] duration-300 ease-out";
const cardHover =
  "hover:-translate-y-0.5 hover:border-[rgba(232,160,32,0.20)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.36),0_0_24px_rgba(232,160,32,0.07)]";

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
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/60"
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
      ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/40"
      : kpi.tone === "down"
        ? "bg-rose-950/70 text-rose-400 border border-rose-800/40"
        : "bg-neutral-900/60 text-[#6A6358] border border-[rgba(100,95,120,0.30)]";

  return (
    <>
      {/* Linha de acento âmbar visível no hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,160,32,0.50)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="mb-4 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-snug tracking-[0.14em] text-[#6A6358] uppercase">
          {t(kpi.labelKey)}
        </h3>
      </div>

      <PlatformIcons platforms={kpi.platforms} />

      <p className="font-data mt-1 text-4xl leading-none font-light tracking-tight text-[#EDE8DE]">{main}</p>

      {compareWithPrevious && (
        <>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass}`}>
              {kpi.tone === "up" && <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "down" && <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
              {kpi.tone === "neutral" && <Minus className="h-3.5 w-3.5 opacity-70" aria-hidden />}
              {pct}
            </span>
          </div>
          <p className="mt-3 text-xs text-[#6A6358]">
            <span className="font-medium text-[#6A6358]">{t("overview.prevPeriodValue")}: </span>
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
      ? "0 12px 36px rgba(0,0,0,0.40), 0 4px 16px rgba(232,160,32,0.10)"
      : "0 1px 3px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.06)",
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
        boxShadow: "0 20px 48px rgba(0,0,0,0.42), 0 8px 20px rgba(232,160,32,0.10)",
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
        <h3 className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-[#6A6358] uppercase">
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
      <h3 className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-[#6A6358] uppercase">
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
