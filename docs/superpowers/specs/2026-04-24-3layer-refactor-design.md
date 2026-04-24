# Design: Refactor para Arquitetura de 3 Camadas

**Data:** 2026-04-24  
**Status:** Aprovado pelo usuário

## Contexto

O projeto é um dashboard Next.js que exibe métricas de Meta Ads, Google Ads, Instagram e Google Meu Negócio. Atualmente toda a lógica de API fica em rotas Next.js (`app/api/`) e arquivos TypeScript em `lib/`. O objetivo é refatorar para a arquitetura de 3 camadas do framework AGENTS.md.

## Arquitetura Final

```
dashboard-all/
├── directives/           # Camada 1: SOPs em Markdown
│   ├── meta-ads.md
│   └── exchange-rate.md
├── execution/            # Camada 3: Scripts Python determinísticos
│   ├── meta_ads.py       # Porta meta-graph.ts + rotas meta/*
│   └── exchange_rate.py  # Porta exchange-rate/route.ts
├── backend/              # FastAPI — ponte execution → frontend
│   ├── main.py
│   ├── routers/
│   │   ├── meta.py
│   │   └── exchange_rate.py
│   └── requirements.txt
├── frontend/             # Next.js — apenas UI, zero lógica de API
│   ├── app/              # (movido de raiz)
│   ├── components/
│   ├── lib/              # lib/ limpa: sem chamadas diretas a APIs externas
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── .env
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

## Fluxo de Dados

```
Usuário → Next.js (frontend/) → FastAPI (backend/) → execution/*.py → APIs externas
```

## Contratos de API (FastAPI)

### Meta Ads
| Método | Rota | Parâmetros | Espelho de |
|--------|------|-----------|-----------|
| GET | `/meta/ad-accounts` | — | `app/api/meta/ad-accounts` |
| GET | `/meta/insights` | `accountId`, `since`, `until`, `compare` | `app/api/meta/insights` |
| GET | `/meta/featured-ads` | `accountId`, `since`, `until`, `limit`, `resultType` | `app/api/meta/featured-ads` |
| GET | `/meta/audience-insights` | `accountId`, `since`, `until` | `app/api/meta/audience-insights` |
| GET | `/meta/ad-compare` | `adId`, `since1`, `until1`, `since2`, `until2` | `app/api/meta/ad-compare` |

### Utilitários
| Método | Rota | Espelho de |
|--------|------|-----------|
| GET | `/exchange-rate` | `app/api/exchange-rate` |

## Mudanças no Frontend

- `app/api/` é **removido** completamente
- `lib/meta-graph.ts`, `lib/meta-env.ts` são **removidos** (lógica vai para Python)
- `lib/meta-date-ranges.ts`, `lib/meta-kpi-merge.ts`, `lib/meta-ads-data.ts` são **mantidos** (lógica de UI pura)
- Todas as chamadas de API nos componentes trocam `/api/meta/*` por `${NEXT_PUBLIC_API_URL}/meta/*`
- Variável de ambiente nova: `NEXT_PUBLIC_API_URL` (aponta para o serviço FastAPI no EasyPanel)

## Execution Scripts

### `execution/meta_ads.py`
Porta fiel de `lib/meta-graph.ts`:
- `fetch_ad_accounts(access_token)` → lista de contas
- `fetch_account_insights(access_token, account_id, time_range)` → insights agregados
- `fetch_account_insights_breakdown(access_token, account_id, time_range, breakdown)` → gender/region
- `fetch_account_ad_insights(access_token, account_id, time_range, limit)` → nível de anúncio
- `fetch_ad_insights(access_token, ad_id, time_range)` → insight de anúncio específico
- `fetch_ad_thumbnail_url(access_token, ad_id)` → URL de thumbnail

### `execution/exchange_rate.py`
- `fetch_exchange_rate()` → `{rate, date, source}`

## Infraestrutura

**Dockerfile.backend** — Python 3.12-slim, instala requirements, roda `uvicorn backend.main:app --host 0.0.0.0 --port 8000`

**Dockerfile.frontend** — Node 20-alpine multi-stage com `output: standalone`, porta 3000

**EasyPanel** — 2 serviços no mesmo projeto:
- `dashboard-backend` → `Dockerfile.backend`, porta 8000
- `dashboard-frontend` → `Dockerfile.frontend`, porta 3000

## Variáveis de Ambiente

```
# Compartilhadas (backend usa diretamente, frontend só NEXT_PUBLIC_API_URL)
META_APP_ID=
META_APP_SECRET=
META_USER_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v21.0
META_AD_ACCOUNT_ID=

# Frontend
NEXT_PUBLIC_API_URL=https://<url-do-backend-no-easypanel>
NEXT_PUBLIC_FALLBACK_USD_BRL=5.5
```

## Estado Atual dos Dados

| Fonte | Estado atual | Pós-refactor |
|-------|-------------|--------------|
| Meta Ads | API real ✓ | Python execution script |
| Exchange Rate | API real ✓ | Python execution script |
| Google Ads | Mock data | Placeholder Python script |
| Instagram | Mock data | Placeholder Python script |
| GMB | Mock data | Placeholder Python script |
