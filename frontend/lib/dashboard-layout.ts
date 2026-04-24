/**
 * Layout padrão do dashboard (base do “design system” de páginas).
 *
 * Altere apenas aqui largura máxima, padding horizontal/vertical e o ritmo vertical
 * entre blocos — evita classes duplicadas e sobrescrita entre arquivos.
 *
 * Uso:
 * - `DASHBOARD_CONTENT_FRAME_CLASS` → wrapper único em `DashboardShell` (todas as rotas `(dashboard)`).
 * - `DASHBOARD_PAGE_MAIN_CLASS` → `<main>` de cada página.
 * - `DASHBOARD_WIDE_SURFACE_MAX_CLASS` → modais/painéis que devem alinhar à largura do conteúdo.
 * - `DASHBOARD_TABLE_SCROLL_AREA_CLASS` / `DASHBOARD_TABLE_BODY_VERTICAL_SCROLL_CLASS` → áreas roláveis de tabela.
 * - `DASHBOARD_SCROLLBAR_CLASS` → estilo minimalista das barras de rolagem.
 */

/** Container centrado: mobile estreito + desktop com teto de largura. */
export const DASHBOARD_CONTENT_FRAME_CLASS =
  "mx-auto w-full max-w-[405px] px-4 py-4 sm:max-w-[1260px] sm:px-6 sm:py-6";

/** Espaçamento vertical entre seções na página (`<main>`). */
export const DASHBOARD_PAGE_MAIN_CLASS = "space-y-6";

/** Mesmo gap vertical quando um bloco interno empilha seções como na página (ex.: grid de KPIs). */
export const DASHBOARD_SECTION_STACK_CLASS = DASHBOARD_PAGE_MAIN_CLASS;

/** Superfícies largas (compare, lightbox) alinhadas ao frame desktop. */
export const DASHBOARD_WIDE_SURFACE_MAX_CLASS = "max-w-[1260px]";

/** Altura máxima compartilhada por tabelas com corpo rolável. */
export const DASHBOARD_TABLE_BODY_MAX_HEIGHT_CLASS = "max-h-[min(65vh,32rem)]";

/**
 * Barras de rolagem finas e discretas (definidas em `app/globals.css` como `.dashboard-scroll`).
 */
export const DASHBOARD_SCROLLBAR_CLASS = "dashboard-scroll";

/**
 * Tabela HTML completa num único bloco: scroll vertical e horizontal quando necessário.
 * Cabeçalho: `thead` com `sticky top-0 z-10` + fundo sólido.
 */
export const DASHBOARD_TABLE_SCROLL_AREA_CLASS = `${DASHBOARD_TABLE_BODY_MAX_HEIGHT_CLASS} overflow-auto overscroll-y-contain ${DASHBOARD_SCROLLBAR_CLASS}`;

/**
 * Corpo da tabela quando o scroll horizontal fica só no ancestral (ex.: `ResizableTable`).
 * `overflow-x-hidden` evita segunda barra horizontal no mesmo eixo.
 */
export const DASHBOARD_TABLE_BODY_VERTICAL_SCROLL_CLASS = `${DASHBOARD_TABLE_BODY_MAX_HEIGHT_CLASS} overflow-y-auto overflow-x-hidden overscroll-y-contain ${DASHBOARD_SCROLLBAR_CLASS}`;
