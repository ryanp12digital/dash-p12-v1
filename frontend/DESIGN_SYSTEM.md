# P12 Digital — Design System

Dashboard de Automações Ativas · Paleta Azul Minimalista  
Baseado no layout Fintrixity, sem neon, fundo escuro navy-black.

---

## 1. Paleta de Cores

### Tokens CSS (`globals.css`)

| Token | Uso |
|-------|-----|
| `--background` | Fundo da página (navy quase preto) |
| `--foreground` / `--text-primary` | Texto principal |
| `--surface` / `--surface-elevated` / `--surface-strong` | Cartões, modais, camadas |
| `--border` / `--border-subtle` / `--border-accent` | Contornos discretos; accent em foco |
| `--text-secondary` / `--text-muted` | Hierarquia de leitura |
| `--accent` / `--accent-muted` / `--accent-soft` | Azul luxo minimal (sem neon) |
| `--shadow-card` / `--shadow-menu` | Profundidade suave |
| `--radius-card` | Cantos generosos (estética referência) |

**Classe utilitária:** `.dashboard-card` — cartão padrão (vidro sutil, hover sem “lift” agressivo).  
**Micro-tendência em KPI:** `components/dashboard/MicroSparkline.tsx` (área mínima sob o valor).

> Valores exatos: ver `:root` em `app/globals.css` (atualizados no redesign unificado).

### Cores de Status

| Nome | Valor | Uso |
|------|-------|-----|
| Positivo | `#22C55E` (emerald-500) | Métricas favoráveis, badge up |
| Negativo | `#F25A5A` | Métricas ruins, badge down |
| Aviso | `#F59E0B` (amber-500) | Alertas, estados de atenção |
| Neutro | `#7A8CAE` | Sem variação |

### Paleta de Gráficos

| Nome | Hex | Uso |
|------|-----|-----|
| `CHART_BLUE` | `#3573E6` | Custo / métrica principal |
| `CHART_CYAN` | `#22D3EE` | Conversões |
| `CHART_PURPLE` | `#8B5CF6` | Impressões |
| `CHART_GREEN` | `#34D399` | Cliques |
| `CHART_EMERALD` | `#10B981` | CTR |
| `CHART_BLUE_2` | `#60A5FA` | Série adicional |
| `CHART_INDIGO` | `#6366F1` | Série adicional |

---

## 2. Tipografia

### Famílias de Fonte

| Família | Variável CSS | Pesos | Uso |
|---------|-------------|-------|-----|
| **Alexandria** | `--font-alexandria` | 400–800 | Corpo, UI, labels |
| **Poppins** | `--font-poppins` | 400–700 | Cabeçalhos (h1–h6) |
| **DM Mono** | `--font-dm-mono` | 300–500 | Valores numéricos (`.font-data`) |

A classe `.font-data` ativa `font-variant-numeric: tabular-nums` + `letter-spacing: -0.02em`.

### Escala Tipográfica

| Classe Tailwind | px | Uso típico |
|----------------|----|-----------|
| `text-[9px]` | 9 | Micro-labels (logo) |
| `text-[10px]` | 10 | Labels de grupo, kicker uppercase |
| `text-xs` | 12 | Captions, metadados |
| `text-sm` | 14 | Corpo compacto, células de tabela |
| `text-base` | 16 | Corpo padrão |
| `text-xl` | 20 | Subtítulos |
| `text-3xl` | 30 | Título da página (h1) |
| `text-4xl` | 36 | Valor KPI principal |

---

## 3. Espaçamento

Baseado na escala 4px do Tailwind:

| Unidade | px | Contexto |
|---------|-----|---------|
| `gap-1` | 4 | Espaçamento interno mínimo |
| `gap-2` | 8 | Entre ícone e label |
| `gap-3` | 12 | Gap padrão entre cards |
| `gap-4` | 16 | Padding interno de card |
| `gap-6` | 24 | Entre seções da página |
| `p-5` | 20 | Padding padrão de card KPI |
| `px-4 py-3` | 16/12 | Célula de tabela |
| `px-4 py-2` | 16/8 | Botão padrão |

---

## 4. Componentes

### Card KPI

```tsx
const cardBase =
  "group relative flex min-h-[164px] flex-col justify-between overflow-hidden " +
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 " +
  "transition-all duration-300 ease-out";

const cardHover =
  "hover:-translate-y-0.5 hover:border-[var(--border-accent)] " +
  "hover:shadow-[0_8px_32px_rgba(0,0,0,0.36),0_0_24px_var(--accent-glow)]";

// Linha accent no topo (visível só no hover):
<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r
  from-transparent via-[var(--accent)] to-transparent
  opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
```

### Badge de Variação

```tsx
// Positivo:
"bg-emerald-950/70 text-emerald-400 border border-emerald-800/40"

// Negativo:
"bg-rose-950/70 text-rose-400 border border-rose-800/40"

// Neutro:
"bg-neutral-900/60 text-[var(--text-muted)] border border-[var(--border)]"
```

### Barra de Navegação (DashboardTopMenu)

```
position: fixed · bottom: 20px · centrado horizontalmente
bg: rgba(7,9,18,0.90) + backdrop-blur-md
border: 1px solid rgba(38,55,100,0.35)
item ativo: bg-[var(--accent-soft)] · text-[var(--accent)]
```

### Botão Primário

```tsx
<button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm
  font-semibold text-white hover:opacity-90 transition-opacity">
  Ação
</button>
```

### Botão Outline

```tsx
<button className="rounded-lg border border-[var(--border)] px-4 py-2
  text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]
  hover:text-[var(--text-primary)] transition-colors">
  Ação
</button>
```

### Input

```tsx
<input className="rounded-lg border border-[var(--border)] bg-[var(--surface)]
  px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
  focus:border-[var(--border-accent)] focus:outline-none transition-colors" />
```

### Tabela

```tsx
<thead className="bg-[var(--surface-strong)] text-[10px] tracking-[0.12em] uppercase">
  <th className="px-4 py-3 text-left text-[var(--text-muted)] font-semibold">
    Coluna
  </th>
</thead>
<tbody>
  <tr className="border-t border-[var(--border)] hover:bg-[var(--accent-soft)]
    transition-colors">
    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
      Valor
    </td>
  </tr>
</tbody>
```

---

## 5. Visualização de Dados (Recharts)

### Configuração Base

```tsx
export const CHART_COLORS = {
  primary:    "#3573E6",  // azul principal
  secondary:  "#22D3EE",  // ciano
  tertiary:   "#8B5CF6",  // roxo
  quaternary: "#34D399",  // verde
  quinary:    "#10B981",  // esmeralda
};

// Tooltip dark:
const tooltipContentStyle = {
  backgroundColor: "rgba(7,9,18,0.96)",
  border: "1px solid rgba(38,55,100,0.35)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#D8E4F5",
  fontSize: "12px",
};

// Grid lines:
const cartesianGridStyle = {
  stroke: "rgba(38,55,100,0.18)",
  strokeDasharray: "4 4",
};

// Eixos:
const axisStyle = {
  tick: { fill: "#3C4D6A", fontSize: 11 },
  line: { stroke: "transparent" },
};
```

---

## 6. Animações

```css
@keyframes kpiSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

| Contexto | Classe / Duração |
|----------|-----------------|
| Hover cards | `transition-all duration-300 ease-out` |
| Nav items | `transition-colors duration-200` |
| Botões | `transition-opacity duration-150` |
| KPI card entrada | `kpiSlideUp 0.45s ease both` + delay `i * 40ms` |

---

## 7. Layout

| Constante | Valor | Uso |
|-----------|-------|-----|
| `DASHBOARD_CONTENT_FRAME_CLASS` | `mx-auto w-full max-w-[405px] px-4 py-4 sm:max-w-[1260px] sm:px-6 sm:py-6` | Wrapper central |
| `DASHBOARD_PAGE_MAIN_CLASS` | `space-y-6` | Espaçamento vertical entre seções |
| `DASHBOARD_TABLE_SCROLL_AREA_CLASS` | `max-h-[min(65vh,32rem)] overflow-auto` | Tabelas roláveis |

Grid de KPIs: `grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4`

---

## 8. Scrollbar

Classe `.dashboard-scroll` — thin scrollbar com tom azul sutil:

```css
scrollbar-width: thin;
scrollbar-color: rgba(53, 115, 230, 0.30) transparent;
```

---

## 9. Páginas

| Rota | Página | Status |
|------|--------|--------|
| `/` | Visão Geral (Overview) | ✅ Implementado |
| `/meta-ads` | Meta Ads | ✅ Implementado |
| `/google-ads` | Google Ads | ✅ Implementado |
| `/google-meu-negocio` | Google Meu Negócio | ✅ Implementado |
| `/instagram` | Instagram | ✅ Implementado |
