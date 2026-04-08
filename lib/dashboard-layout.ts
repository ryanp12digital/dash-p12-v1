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
 */

/** Container centrado: mobile estreito + desktop com teto de largura. */
export const DASHBOARD_CONTENT_FRAME_CLASS =
  "mx-auto w-full max-w-[405px] px-4 py-4 sm:max-w-[1300px] sm:px-6 sm:py-6";

/** Espaçamento vertical entre seções na página (`<main>`). */
export const DASHBOARD_PAGE_MAIN_CLASS = "space-y-6";

/** Mesmo gap vertical quando um bloco interno empilha seções como na página (ex.: grid de KPIs). */
export const DASHBOARD_SECTION_STACK_CLASS = DASHBOARD_PAGE_MAIN_CLASS;

/** Superfícies largas (compare, lightbox) alinhadas ao frame desktop. */
export const DASHBOARD_WIDE_SURFACE_MAX_CLASS = "max-w-[1300px]";
