/**
 * Persistência de ordem e visibilidade de blocos por página (aba).
 * Chave: `p12-page-blocks-v1:{layoutId}`
 */

export type PageWidgetState = {
  order: string[];
  hidden: string[];
};

const PREFIX = "p12-page-blocks-v1:";

export function pageWidgetStorageKey(layoutId: string): string {
  return `${PREFIX}${layoutId}`;
}

export function loadPageWidgetState(
  layoutId: string,
  defaultOrder: string[],
): PageWidgetState {
  if (typeof window === "undefined") {
    return { order: [...defaultOrder], hidden: [] };
  }
  try {
    const raw = window.localStorage.getItem(pageWidgetStorageKey(layoutId));
    if (!raw) return { order: [...defaultOrder], hidden: [] };
    const parsed = JSON.parse(raw) as Partial<PageWidgetState>;
    const order = Array.isArray(parsed?.order)
      ? (parsed.order as string[]).filter((id) => defaultOrder.includes(id))
      : [];
    const hidden = Array.isArray(parsed?.hidden)
      ? (parsed.hidden as string[]).filter((id) => defaultOrder.includes(id))
      : [];
    const missing = defaultOrder.filter((id) => !order.includes(id));
    return { order: [...order, ...missing], hidden };
  } catch {
    return { order: [...defaultOrder], hidden: [] };
  }
}

export function savePageWidgetState(layoutId: string, state: PageWidgetState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(pageWidgetStorageKey(layoutId), JSON.stringify(state));
  } catch {
    /* storage bloqueado */
  }
}
