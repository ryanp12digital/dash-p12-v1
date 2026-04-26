"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import {
  loadPageWidgetState,
  savePageWidgetState,
  type PageWidgetState,
} from "@/lib/page-widget-storage";

export type PageWidgetBlock = {
  id: string;
  /** Chave i18n para título do bloco no painel de organização */
  labelKey: string;
  content: ReactNode;
};

function SortableBlock({
  id,
  children,
  showChrome,
}: {
  id: string;
  children: ReactNode;
  showChrome: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
  } as const;

  return (
    <div ref={setNodeRef} style={style} className="group relative w-full min-w-0">
      {showChrome && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 z-10 flex cursor-grab touch-none items-center justify-center rounded-lg border border-(--border) bg-(--surface-strong) p-1.5 text-(--text-muted) opacity-0 transition-opacity hover:border-(--border-accent) hover:text-(--text-secondary) group-focus-within:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar bloco"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      )}
      {children}
    </div>
  );
}

type PageWidgetLayoutProps = {
  layoutId: string;
  blocks: PageWidgetBlock[];
  className?: string;
};

/**
 * Reordena blocos inteiros da página e permite ocultar/mostrar seções.
 * Estado persistido por `layoutId` (uma chave por aba).
 */
export default function PageWidgetLayout({ layoutId, blocks, className }: PageWidgetLayoutProps) {
  const { t } = useDashboardSettings();
  const defaultOrder = useMemo(() => blocks.map((b) => b.id), [blocks]);
  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PageWidgetState>(() => ({
    order: [...defaultOrder],
    hidden: [],
  }));
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setState(loadPageWidgetState(layoutId, defaultOrder));
  }, [layoutId, defaultOrder.join("|")]);

  useEffect(() => {
    if (!mounted) return;
    savePageWidgetState(layoutId, state);
  }, [layoutId, state, mounted]);

  const visibleOrder = useMemo(() => {
    const hidden = new Set(state.hidden);
    return state.order.filter((id) => !hidden.has(id) && blockById.has(id));
  }, [state.order, state.hidden, blockById]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const hidden = new Set(state.hidden);
    const orderVisible = state.order.filter((id) => !hidden.has(id));
    const a = orderVisible.findIndex((id) => id === active.id);
    const b = orderVisible.findIndex((id) => id === over.id);
    if (a < 0 || b < 0) return;
    const nextVisible = arrayMove(orderVisible, a, b);
    const hiddenIds = state.order.filter((id) => hidden.has(id));
    setState((s) => ({
      ...s,
      order: [...nextVisible, ...hiddenIds],
    }));
  };

  const toggleHidden = useCallback((id: string) => {
    setState((s) => {
      const hidden = new Set(s.hidden);
      if (hidden.has(id)) hidden.delete(id);
      else hidden.add(id);
      return { ...s, hidden: [...hidden] };
    });
  }, []);

  const showAll = () => setState((s) => ({ ...s, hidden: [] }));

  const activeBlock = activeId ? blockById.get(activeId) : null;

  if (!mounted) {
    return (
      <div className={className ?? "space-y-6"}>
        {defaultOrder.map((id) => (
          <div key={id} className="w-full min-w-0">
            {blockById.get(id)?.content}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className ?? "space-y-6"}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--text-secondary) transition-colors hover:border-(--border-accent) hover:text-(--text-primary)"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-(--accent)" aria-hidden />
          {t("pageBlocks.organize")}
        </button>
      </div>

      {panelOpen && (
        <div
          className="dashboard-card rounded-2xl border p-4"
          role="region"
          aria-label={t("pageBlocks.panelLabel")}
        >
          <p className="text-sm font-medium text-(--text-primary)">{t("pageBlocks.panelTitle")}</p>
          <p className="mt-0.5 text-xs text-(--text-muted)">{t("pageBlocks.panelHint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={showAll}
              className="rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-1.5 text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary)"
            >
              {t("pageBlocks.showAll")}
            </button>
          </div>
          <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1 dashboard-scroll">
            {defaultOrder.map((id) => {
              const b = blockById.get(id);
              if (!b) return null;
              const isHidden = state.hidden.includes(id);
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-(--border) bg-(--surface-elevated) px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-(--text-primary)">
                    {t(b.labelKey)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleHidden(id)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface) px-2.5 py-1 text-[11px] font-semibold text-(--text-secondary) hover:text-(--text-primary)"
                  >
                    {isHidden ? (
                      <>
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {t("pageBlocks.show")}
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" aria-hidden />
                        {t("pageBlocks.hide")}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {visibleOrder.map((id) => {
              const b = blockById.get(id);
              if (!b) return null;
              return (
                <SortableBlock key={id} id={id} showChrome>
                  {b.content}
                </SortableBlock>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeBlock ? (
            <div className="dashboard-card w-[min(100vw-2rem,64rem)] rotate-1 overflow-hidden p-0 opacity-95">
              <div className="pointer-events-none p-1">{activeBlock.content}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
