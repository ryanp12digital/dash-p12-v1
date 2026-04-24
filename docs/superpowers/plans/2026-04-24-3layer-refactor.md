# 3-Layer Architecture Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o dashboard para a arquitetura de 3 camadas: directives (SOPs) → FastAPI backend → execution scripts Python, movendo todo o frontend para `frontend/` e eliminando as rotas `app/api/`.

**Architecture:** FastAPI em `backend/` chama scripts Python determinísticos em `execution/`. O Next.js em `frontend/` consome o FastAPI via `NEXT_PUBLIC_API_URL`. Os arquivos TypeScript de chamada de API são deletados; componentes atualizam as URLs.

**Tech Stack:** Python 3.12, FastAPI, httpx, uvicorn, Next.js 16, Node 20

## Decisões de Escopo (fonte de verdade: spec aprovada)

- Este plano está alinhado a `docs/superpowers/specs/2026-04-24-3layer-refactor-design.md`.
- `frontend/lib/meta-date-ranges.ts` e `frontend/lib/meta-kpi-merge.ts` permanecem no frontend (lógica de UI).
- Não criar `execution/meta_date_ranges.py` nem `execution/meta_kpi_merge.py`.
- `backend/routers/meta.py` expõe contratos equivalentes aos endpoints atuais, sem portar lógica de UI para Python.
- Toda execução de código só começa após concluir o alinhamento documental da Task 2.

---

## File Map

**Criados:**
- `execution/__init__.py`
- `execution/meta_ads.py` — porta de `lib/meta-graph.ts`
- `execution/exchange_rate.py` — porta de `app/api/exchange-rate/route.ts`
- `backend/__init__.py`
- `backend/main.py` — FastAPI app + CORS
- `backend/routers/__init__.py`
- `backend/routers/meta.py` — 5 endpoints Meta
- `backend/routers/exchange_rate.py` — 1 endpoint
- `backend/requirements.txt`
- `directives/meta-ads.md`
- `directives/exchange-rate.md`
- `Dockerfile.backend`

**Movidos (git mv):**
- `app/` → `frontend/app/`
- `components/` → `frontend/components/`
- `lib/` → `frontend/lib/`
- `public/` → `frontend/public/`
- `package.json` → `frontend/package.json`
- `package-lock.json` → `frontend/package-lock.json`
- `next.config.ts` → `frontend/next.config.ts`
- `next-env.d.ts` → `frontend/next-env.d.ts`
- `postcss.config.mjs` → `frontend/postcss.config.mjs`
- `eslint.config.mjs` → `frontend/eslint.config.mjs`
- `tsconfig.json` → `frontend/tsconfig.json`
- `Dockerfile` → `Dockerfile.frontend`

**Deletados do frontend:**
- `frontend/app/api/` (diretório inteiro)
- `frontend/lib/meta-graph.ts`
- `frontend/lib/meta-env.ts`

**Modificados:**
- `frontend/components/DashboardSettingsProvider.tsx:67`
- `frontend/components/meta/MetaAdsDataContext.tsx:55,111`
- `frontend/components/meta/MetaAdsChartsSection.tsx:261`
- `frontend/components/meta/MetaFeaturedAdsTable.tsx:109,556`
- `frontend/lib/meta-date-ranges.ts` — mantido (sem migração para Python)
- `frontend/lib/meta-kpi-merge.ts` — mantido (sem migração para Python)
- `frontend/next.config.ts` — sem mudança de conteúdo, caminho muda
- `.env.example` — adiciona `NEXT_PUBLIC_API_URL`
- `.dockerignore` — adiciona `frontend/node_modules`

---

## Task 1: Execution layer — meta_ads.py

**Files:**
- Create: `execution/__init__.py`
- Create: `execution/meta_ads.py`

- [ ] **Step 1: Criar `execution/__init__.py`**

```bash
mkdir execution
touch execution/__init__.py
```

- [ ] **Step 2: Criar `execution/meta_ads.py`**

```python
"""Meta Graph API — chamadas HTTP determinísticas. Porta de lib/meta-graph.ts."""
import json
import os
from typing import Optional
import httpx

DEFAULT_VERSION = "v21.0"
INSIGHT_FIELDS = ",".join([
    "spend", "impressions", "reach", "inline_link_clicks",
    "ctr", "cpc", "cpm", "frequency",
    "actions", "cost_per_action_type", "purchase_roas",
])
AD_INSIGHT_FIELDS = ",".join([
    "campaign_id", "campaign_name", "objective", "optimization_goal",
    "ad_id", "ad_name", "adset_id", "adset_name",
    "spend", "impressions", "reach", "inline_link_clicks",
    "ctr", "cpc", "cpm", "frequency", "actions",
])


def get_graph_version() -> str:
    return os.getenv("META_GRAPH_API_VERSION", DEFAULT_VERSION).strip()


def graph_base() -> str:
    return f"https://graph.facebook.com/{get_graph_version()}"


class MetaGraphError(Exception):
    def __init__(self, message: str, code: Optional[int] = None, raw=None):
        super().__init__(message)
        self.code = code
        self.raw = raw


async def _graph_get(path: str, access_token: str, extra: dict | None = None) -> dict:
    url = f"{graph_base()}/{path.lstrip('/')}"
    params = {"access_token": access_token}
    if extra:
        params.update({k: v for k, v in extra.items() if v is not None and v != ""})
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(url, params=params)
    data = res.json()
    err = data.get("error")
    if not res.is_success or err:
        msg = (err or {}).get("message") or f"HTTP {res.status_code}"
        raise MetaGraphError(msg, (err or {}).get("code"), data)
    return data


async def fetch_ad_accounts(access_token: str) -> list[dict]:
    first = await _graph_get("me/adaccounts", access_token, {
        "fields": "id,name,account_id,currency,account_status",
        "limit": "100",
    })
    all_accounts = list(first.get("data", []))
    next_url = (first.get("paging") or {}).get("next")
    pages = 0
    async with httpx.AsyncClient(timeout=30.0) as client:
        while next_url and pages < 10:
            pages += 1
            res = await client.get(next_url)
            data = res.json()
            err = data.get("error")
            if not res.is_success or err:
                msg = (err or {}).get("message") or f"HTTP {res.status_code}"
                raise MetaGraphError(msg, (err or {}).get("code"), data)
            all_accounts.extend(data.get("data", []))
            next_url = (data.get("paging") or {}).get("next")
    return all_accounts


async def fetch_account_insights(
    access_token: str, account_id: str, time_range: dict
) -> Optional[dict]:
    act_id = account_id if account_id.startswith("act_") else f"act_{account_id}"
    data = await _graph_get(f"{act_id}/insights", access_token, {
        "fields": INSIGHT_FIELDS,
        "time_range": json.dumps(time_range),
    })
    rows = data.get("data", [])
    return rows[0] if rows else None


async def fetch_account_insights_breakdown(
    access_token: str, account_id: str, time_range: dict, breakdown: str
) -> list[dict]:
    act_id = account_id if account_id.startswith("act_") else f"act_{account_id}"
    params = {
        "access_token": access_token,
        "fields": INSIGHT_FIELDS,
        "breakdowns": breakdown,
        "time_range": json.dumps(time_range),
        "limit": "500",
    }
    url = f"{graph_base()}/{act_id}/insights"
    all_rows: list[dict] = []
    pages = 0
    is_first = True
    next_url: Optional[str] = url
    async with httpx.AsyncClient(timeout=30.0) as client:
        while next_url and pages < 25:
            pages += 1
            res = await client.get(next_url, params=params if is_first else None)
            is_first = False
            data = res.json()
            err = data.get("error")
            if not res.is_success or err:
                msg = (err or {}).get("message") or f"HTTP {res.status_code}"
                raise MetaGraphError(msg, (err or {}).get("code"), data)
            all_rows.extend(data.get("data", []))
            next_url = (data.get("paging") or {}).get("next")
    return all_rows


async def fetch_account_ad_insights(
    access_token: str, account_id: str, time_range: dict, limit: int
) -> list[dict]:
    act_id = account_id if account_id.startswith("act_") else f"act_{account_id}`"
    data = await _graph_get(f"{act_id}/insights", access_token, {
        "fields": AD_INSIGHT_FIELDS,
        "level": "ad",
        "limit": str(limit),
        "time_range": json.dumps(time_range),
    })
    return data.get("data", [])


async def fetch_ad_insights(
    access_token: str, ad_id: str, time_range: dict
) -> Optional[dict]:
    data = await _graph_get(f"{ad_id}/insights", access_token, {
        "fields": AD_INSIGHT_FIELDS,
        "time_range": json.dumps(time_range),
    })
    rows = data.get("data", [])
    return rows[0] if rows else None


async def fetch_ad_thumbnail_url(access_token: str, ad_id: str) -> Optional[str]:
    res = await _graph_get(ad_id, access_token, {
        "fields": "adcreatives{image_url,thumbnail_url,object_story_spec}",
    })
    creatives = (res.get("adcreatives") or {}).get("data", [])
    if not creatives:
        return None
    first = creatives[0]
    if isinstance(first.get("image_url"), str):
        return first["image_url"]
    spec = first.get("object_story_spec") or {}
    link_data = spec.get("link_data") or {}
    video_data = spec.get("video_data") or {}
    for key in ("image_url", "picture"):
        if isinstance(link_data.get(key), str):
            return link_data[key]
    if isinstance(video_data.get("image_url"), str):
        return video_data["image_url"]
    return first.get("thumbnail_url") if isinstance(first.get("thumbnail_url"), str) else None


def parse_number(v) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        n = float(v)
        return n if n == n and abs(n) != float("inf") else None
    except (ValueError, TypeError):
        return None


def sum_action(actions: list | None, action_type: str) -> float:
    if not actions:
        return 0.0
    return sum(float(a.get("value") or 0) for a in actions if a.get("action_type") == action_type)
```

- [ ] **Step 3: Commit**

```bash
git add execution/__init__.py execution/meta_ads.py
git commit -m "feat: add execution/meta_ads.py — Python port of meta-graph.ts"
```

---

## Task 2: Alinhamento documental (obrigatório antes de código)

**Files:**
- Modify: `docs/superpowers/plans/2026-04-24-3layer-refactor.md`
- Reference: `docs/superpowers/specs/2026-04-24-3layer-refactor-design.md`

- [ ] **Step 1: Confirmar decisões de escopo**

- `meta-date-ranges` e `meta-kpi-merge` permanecem em `frontend/lib/`.
- Contratos FastAPI espelham rotas antigas sem mover regra de apresentação para `execution/`.

- [ ] **Step 2: Registrar no plano os critérios de aceite documental**

- Incluir seção explícita de critérios de aceite (fonte de verdade, contratos e arquivos mantidos no frontend).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-24-3layer-refactor.md
git commit -m "docs: sync implementation plan with approved spec scope"
```

---

## Task 3: Execution layer — exchange_rate.py

**Files:**
- Create: `execution/exchange_rate.py`

- [ ] **Step 1: Criar `execution/exchange_rate.py`**

```python
"""Taxa de câmbio USD→BRL via Frankfurter (sem API key). Porta de app/api/exchange-rate/route.ts."""
import os
from datetime import date
import httpx


async def fetch_exchange_rate() -> dict:
    fallback = float(os.getenv("NEXT_PUBLIC_FALLBACK_USD_BRL", "5.5"))
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get("https://api.frankfurter.app/latest?from=USD&to=BRL")
        if not res.is_success:
            raise ValueError(f"Frankfurter {res.status_code}")
        data = res.json()
        rate = data.get("rates", {}).get("BRL")
        if not isinstance(rate, (int, float)):
            raise ValueError("Invalid rate")
        return {"rate": rate, "date": data.get("date"), "source": "frankfurter"}
    except Exception:
        return {
            "rate": fallback,
            "date": date.today().isoformat(),
            "source": "fallback",
            "error": True,
        }
```

- [ ] **Step 2: Commit**

```bash
git add execution/exchange_rate.py
git commit -m "feat: add execution/exchange_rate.py"
```

---

## Task 4: Backend — FastAPI structure + exchange rate router

**Files:**
- Create: `backend/__init__.py`
- Create: `backend/routers/__init__.py`
- Create: `backend/main.py`
- Create: `backend/routers/exchange_rate.py`
- Create: `backend/requirements.txt`

- [ ] **Step 1: Criar estrutura de diretórios e arquivos vazios**

```bash
mkdir -p backend/routers
touch backend/__init__.py backend/routers/__init__.py
```

- [ ] **Step 2: Criar `backend/requirements.txt`**

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

- [ ] **Step 3: Criar `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.routers import meta, exchange_rate

app = FastAPI(title="Dashboard P12 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(meta.router, prefix="/meta", tags=["meta"])
app.include_router(exchange_rate.router, tags=["utils"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Criar `backend/routers/exchange_rate.py`**

```python
from fastapi import APIRouter
from execution.exchange_rate import fetch_exchange_rate

router = APIRouter()


@router.get("/exchange-rate")
async def get_exchange_rate():
    return await fetch_exchange_rate()
```

- [ ] **Step 5: Commit**

```bash
git add backend/ 
git commit -m "feat: add FastAPI backend scaffold + exchange rate router"
```

---

## Task 5: Backend — Meta router (5 endpoints)

**Files:**
- Create: `backend/routers/meta.py`

- [ ] **Step 1: Criar `backend/routers/meta.py`**

```python
"""Rotas Meta Ads — espelham os endpoints de app/api/meta/* do Next.js."""
import os
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from execution.meta_ads import (
    MetaGraphError, fetch_ad_accounts, fetch_account_insights,
    fetch_account_insights_breakdown, fetch_account_ad_insights,
    fetch_ad_insights, fetch_ad_thumbnail_url, parse_number, sum_action,
)

router = APIRouter()


def _get_token() -> str:
    token = os.getenv("META_USER_ACCESS_TOKEN", "").strip()
    if not token:
        raise HTTPException(
            status_code=501,
            detail={"error": "META_USER_ACCESS_TOKEN não configurado", "code": "missing_token"},
        )
    return token


def _to_act(account_id: str) -> str:
    return account_id if account_id.startswith("act_") else f"act_{account_id}"


# ──────────────────────────────────────────────
# GET /meta/ad-accounts
# ──────────────────────────────────────────────
@router.get("/ad-accounts")
async def get_ad_accounts():
    token = _get_token()
    try:
        raw = await fetch_ad_accounts(token)
        accounts = [
            {
                "id": _to_act(a["id"]),
                "name": (a.get("name") or a["id"]).strip(),
                "currency": a.get("currency"),
                "accountId": str(a.get("account_id") or a["id"].replace("act_", "")),
            }
            for a in raw
        ]
        return {"accounts": accounts}
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code, "details": e.raw})


# ──────────────────────────────────────────────
# GET /meta/insights
# ──────────────────────────────────────────────
@router.get("/insights")
async def get_insights(
    accountId: str = Query(...),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    compare: Optional[str] = Query(None),
):
    token = _get_token()
    compare_with_previous = compare not in ("0", "false")
    ranges = build_ranges_from_selection(since, until) if (since and until) else get_comparison_ranges()

    try:
        current = await fetch_account_insights(token, accountId, ranges["current"])
        previous = None
        if compare_with_previous:
            previous = await fetch_account_insights(token, accountId, ranges["previous"])

        kpi_rows = merge_insights_into_kpi_rows(current, previous, compare_with_previous)

        return {
            "accountId": _to_act(accountId),
            "ranges": ranges,
            "kpiRows": kpi_rows,
            "raw": {"current": current, "previous": previous},
            "compareWithPrevious": compare_with_previous,
        }
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code, "details": e.raw})


# ──────────────────────────────────────────────
# GET /meta/audience-insights
# ──────────────────────────────────────────────
def _normalize_gender(rows: list[dict]) -> list[dict]:
    KEYS = ["meta.gender.female", "meta.gender.male", "meta.gender.unknown"]
    acc: dict[str, dict] = {k: {"imp": 0, "reach": 0} for k in KEYS}
    for row in rows:
        g = (row.get("gender") or "").lower()
        key = "meta.gender.female" if g == "female" else "meta.gender.male" if g == "male" else "meta.gender.unknown"
        acc[key]["imp"]   += parse_number(row.get("impressions")) or 0
        acc[key]["reach"] += parse_number(row.get("reach")) or 0
    return [{"generoKey": k, "impressoes": round(v["imp"]), "alcance": round(v["reach"])} for k, v in acc.items()]


def _normalize_regions(rows: list[dict]) -> list[dict]:
    mapped = []
    for row in rows:
        label = (row.get("region") or "").strip() or "—"
        alcance   = round(parse_number(row.get("reach")) or 0)
        impressoes = round(parse_number(row.get("impressions")) or 0)
        spend     = parse_number(row.get("spend")) or 0
        cpm       = parse_number(row.get("cpm")) or 0
        freq      = parse_number(row.get("frequency")) or 0
        if impressoes > 0 and spend > 0 and cpm == 0:
            cpm = (spend / impressoes) * 1000
        if impressoes > 0 and alcance > 0 and freq == 0:
            freq = impressoes / alcance
        if label != "—" and (alcance > 0 or impressoes > 0 or spend > 0):
            mapped.append({"regionLabel": label, "alcance": alcance, "impressoes": impressoes,
                           "frequencia": freq, "valorInvestido": spend, "cpm": cpm})
    mapped.sort(key=lambda r: r["alcance"], reverse=True)
    return mapped[:40]


@router.get("/audience-insights")
async def get_audience_insights(
    accountId: str = Query(...),
    since: str = Query(...),
    until: str = Query(...),
):
    token = _get_token()
    time_range = {"since": since, "until": until}
    gender, regions, errors = [], [], {}

    try:
        gender_rows = await fetch_account_insights_breakdown(token, accountId, time_range, "gender")
        gender = _normalize_gender(gender_rows)
    except MetaGraphError as e:
        errors["gender"] = str(e)
        gender = _normalize_gender([])

    try:
        region_rows = await fetch_account_insights_breakdown(token, accountId, time_range, "region")
        regions = _normalize_regions(region_rows)
    except MetaGraphError as e:
        errors["region"] = str(e)

    return {
        "accountId": _to_act(accountId),
        "timeRange": time_range,
        "gender": gender,
        "regions": regions,
        **({"errors": errors} if errors else {}),
    }


# ──────────────────────────────────────────────
# GET /meta/featured-ads
# ──────────────────────────────────────────────
def _calc_conversions(actions: list | None, result_type: str, objective: str) -> tuple[float, str]:
    obj = objective.upper()
    purchases    = sum_action(actions, "purchase") + sum_action(actions, "omni_purchase") + sum_action(actions, "offsite_conversion.fb_pixel_purchase")
    leads        = sum_action(actions, "lead") + sum_action(actions, "onsite_conversion.lead") + sum_action(actions, "offsite_conversion.fb_pixel_lead") + sum_action(actions, "leadgen_grouped")
    conversations = sum_action(actions, "onsite_conversion.messaging_conversation_started_7d") + sum_action(actions, "onsite_conversion.messaging_first_reply")
    registrations = sum_action(actions, "complete_registration") + sum_action(actions, "offsite_conversion.fb_pixel_complete_registration")

    if result_type == "purchases":    return purchases,     "meta.metric.purchases"
    if result_type == "leads":        return leads,         "meta.metric.leadsOnMeta"
    if result_type == "conversations":return conversations, "meta.metric.conversationsStarted"
    if result_type == "registrations":return registrations, "meta.metric.registrations"

    # auto
    if "PURCHASE" in obj and purchases > 0:     return purchases,     "meta.metric.purchases"
    if "LEAD" in obj and leads > 0:             return leads,         "meta.metric.leadsOnMeta"
    if "MESSAGE" in obj and conversations > 0:  return conversations, "meta.metric.conversationsStarted"
    if "REGISTRATION" in obj and registrations > 0: return registrations, "meta.metric.registrations"
    if purchases > 0:     return purchases,     "meta.metric.purchases"
    if leads > 0:         return leads,         "meta.metric.leadsOnMeta"
    if conversations > 0: return conversations, "meta.metric.conversationsStarted"
    if registrations > 0: return registrations, "meta.metric.registrations"
    return 0.0, ""


@router.get("/featured-ads")
async def get_featured_ads(
    accountId: str = Query(...),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    limit: int = Query(8),
    resultType: str = Query("auto"),
):
    token = _get_token()
    ranges = build_ranges_from_selection(since, until) if (since and until) else get_comparison_ranges()
    current_range = ranges["current"]

    try:
        ad_rows = await fetch_account_ad_insights(token, accountId, current_range, max(limit * 2, 20))

        scored = []
        for r in ad_rows:
            impressions = parse_number(r.get("impressions")) or 0
            if impressions == 0:
                continue
            spend      = parse_number(r.get("spend")) or 0
            reach      = parse_number(r.get("reach")) or 0
            link_clicks = parse_number(r.get("inline_link_clicks")) or 0
            actions    = r.get("actions") or []
            objective  = r.get("objective") or ""
            result_value, result_label = _calc_conversions(actions, resultType, objective)
            scored.append({"r": r, "spend": spend, "impressions": impressions, "reach": reach,
                           "link_clicks": link_clicks, "result_value": result_value, "result_label": result_label})

        scored.sort(key=lambda x: x["result_value"], reverse=True)
        top = scored[:max(1, limit)]

        thumbnail_cache: dict[str, Optional[str]] = {}
        featured = []
        for x in top:
            ad = x["r"]
            ad_id = ad.get("ad_id")
            thumbnail_url = None
            if ad_id:
                if ad_id not in thumbnail_cache:
                    try:
                        thumbnail_cache[ad_id] = await fetch_ad_thumbnail_url(token, ad_id)
                    except Exception:
                        thumbnail_cache[ad_id] = None
                thumbnail_url = thumbnail_cache[ad_id]

            spend    = x["spend"]
            result   = x["result_value"]
            cost_per = spend / result if result > 0 else 0
            ctr = parse_number(ad.get("ctr")) or (x["link_clicks"] / x["impressions"] if x["impressions"] else 0)
            cpc = spend / x["link_clicks"] if x["link_clicks"] > 0 else parse_number(ad.get("cpc")) or 0
            cpm = (spend / x["impressions"]) * 1000 if x["impressions"] > 0 else parse_number(ad.get("cpm")) or 0

            featured.append({
                "id": ad_id or f"{ad.get('adset_id','')}-{ad.get('ad_name','')}",
                "name": ad.get("ad_name") or "Ad",
                "campaignName": ad.get("campaign_name") or "Campaign",
                "adsetName": ad.get("adset_name") or "Ad set",
                "thumbLetter": (ad.get("ad_name") or "A")[0].upper(),
                "thumbnailUrl": thumbnail_url,
                "resultValue": str(round(result * 1000) / 1000),
                "resultLabelKey": x["result_label"],
                "costPerResultBrl": cost_per,
                "spent": spend,
                "reach": x["reach"],
                "impressions": x["impressions"],
                "linkClicks": x["link_clicks"],
                "ctr": ctr if isinstance(ctr, float) else 0,
                "cpc": cpc,
                "cpm": cpm,
                "frequency": parse_number(ad.get("frequency")) or 0,
                "pageEngagement": 0,
                "videoPlays25": 0,
                "utm": None,
            })

        return {"accountId": _to_act(accountId), "ranges": ranges, "ads": featured}
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})


# ──────────────────────────────────────────────
# GET /meta/ad-compare
# ──────────────────────────────────────────────
def _build_metrics(row: Optional[dict]) -> Optional[dict]:
    if not row:
        return None
    spent      = parse_number(row.get("spend")) or 0
    impressions = parse_number(row.get("impressions")) or 0
    reach      = parse_number(row.get("reach")) or 0
    link_clicks = parse_number(row.get("inline_link_clicks")) or 0
    actions    = row.get("actions") or []
    result_value, result_label = _calc_conversions(actions, "auto", row.get("objective") or "")
    cost_per_result = spent / result_value if result_value > 0 else 0
    ctr = impressions and (link_clicks / impressions * 100) or parse_number(row.get("ctr")) or 0
    cpc = link_clicks and spent / link_clicks or parse_number(row.get("cpc")) or 0
    cpm = impressions and (spent / impressions * 1000) or parse_number(row.get("cpm")) or 0
    return {
        "spent": spent, "impressions": impressions, "reach": reach, "linkClicks": link_clicks,
        "resultValue": result_value, "resultLabelKey": result_label,
        "costPerResult": cost_per_result, "ctr": ctr, "cpc": cpc, "cpm": cpm,
        "frequency": parse_number(row.get("frequency")) or 0,
    }


@router.get("/ad-compare")
async def get_ad_compare(
    adId: str = Query(...),
    since1: str = Query(...),
    until1: str = Query(...),
    since2: str = Query(...),
    until2: str = Query(...),
):
    token = _get_token()
    try:
        import asyncio
        row1, row2 = await asyncio.gather(
            fetch_ad_insights(token, adId, {"since": since1, "until": until1}),
            fetch_ad_insights(token, adId, {"since": since2, "until": until2}),
        )
        return {
            "adId": adId,
            "period1": {"since": since1, "until": until1, "metrics": _build_metrics(row1)},
            "period2": {"since": since2, "until": until2, "metrics": _build_metrics(row2)},
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/meta.py
git commit -m "feat: add FastAPI meta router — 5 endpoints portados do Next.js"
```

---

## Task 6: Directives

**Files:**
- Create: `directives/meta-ads.md`
- Create: `directives/exchange-rate.md`

- [ ] **Step 1: Criar `directives/meta-ads.md`**

```markdown
# Directive: Meta Ads

## Objetivo
Buscar métricas de campanhas do Meta Ads (Facebook/Instagram) via Meta Marketing API.

## Entradas
- `META_USER_ACCESS_TOKEN` — token de usuário com permissão `ads_read`
- `META_GRAPH_API_VERSION` — versão da Graph API (padrão: v21.0)
- `account_id` — ID da conta de anúncios (ex.: `act_123456`)
- `time_range` — `{since: "YYYY-MM-DD", until: "YYYY-MM-DD"}`

## Ferramentas
- `execution/meta_ads.py` — todas as chamadas HTTP à Graph API
- `frontend/lib/meta-date-ranges.ts` — cálculo de janelas de comparação (lógica de UI)
- `frontend/lib/meta-kpi-merge.ts` — agregação de KPIs para exibição (lógica de UI)

## Saídas
- Lista de contas de anúncios
- KPI rows (spent, impressions, reach, CTR, CPC, CPM, frequency, leads, etc.)
- Insights por gênero e região
- Lista de anúncios em destaque com thumbnail
- Comparação de métricas entre dois períodos para um anúncio

## Edge Cases
- Token expirado → MetaGraphError com código 190; usuário deve renovar o token
- Conta sem dados no período → retorna row null; KPIs ficam zerados
- Limite de paginação: máximo 25 páginas por chamada de breakdown
- Thumbnail bloqueada por permissão → retorna None; frontend usa placeholder SVG
- Rate limit da Graph API → httpx lança HTTPStatusError; não fazer retry automático sem consultar o usuário
```

- [ ] **Step 2: Criar `directives/exchange-rate.md`**

```markdown
# Directive: Exchange Rate

## Objetivo
Obter cotação USD→BRL do dia para converter valores monetários na interface.

## Entradas
- Nenhuma (API pública sem chave)
- `NEXT_PUBLIC_FALLBACK_USD_BRL` — valor fallback se a API falhar (padrão: 5.5)

## Ferramentas
- `execution/exchange_rate.py`

## Saídas
- `{rate: float, date: str, source: "frankfurter" | "fallback", error?: True}`

## Edge Cases
- API Frankfurter offline → retorna fallback sem lançar exceção
- Cache: a cotação muda uma vez por dia; o frontend pode cachear por até 1h sem problema
```

- [ ] **Step 3: Commit**

```bash
git add directives/
git commit -m "docs: add directives for meta-ads and exchange-rate"
```

---

## Task 7: Mover frontend para frontend/

**Files:** tudo de `app/`, `components/`, `lib/`, `public/`, configs

- [ ] **Step 1: Criar diretório e mover arquivos com git mv**

```bash
mkdir frontend
git mv app frontend/app
git mv components frontend/components
git mv lib frontend/lib
git mv public frontend/public
git mv package.json frontend/package.json
git mv package-lock.json frontend/package-lock.json
git mv next.config.ts frontend/next.config.ts
git mv next-env.d.ts frontend/next-env.d.ts
git mv postcss.config.mjs frontend/postcss.config.mjs
git mv eslint.config.mjs frontend/eslint.config.mjs
git mv tsconfig.json frontend/tsconfig.json
```

- [ ] **Step 2: Renomear Dockerfile**

```bash
git mv Dockerfile Dockerfile.frontend
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: move Next.js project into frontend/ subdirectory"
```

---

## Task 8: Limpar frontend — remover rotas de API e libs de servidor

- [ ] **Step 1: Deletar `frontend/app/api/` inteiro**

```bash
git rm -r frontend/app/api/
```

- [ ] **Step 2: Deletar libs que iam só para o servidor**

```bash
git rm frontend/lib/meta-graph.ts
git rm frontend/lib/meta-env.ts
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: remove Next.js API routes and server-only libs (moved to Python)"
```

---

## Task 9: Atualizar componentes — trocar URLs de /api/* para NEXT_PUBLIC_API_URL

São 5 lugares em 3 arquivos.

- [ ] **Step 1: Atualizar `frontend/components/DashboardSettingsProvider.tsx` linha ~67**

Encontre:
```typescript
fetch("/api/exchange-rate")
```
Substitua por:
```typescript
fetch(`${process.env.NEXT_PUBLIC_API_URL}/exchange-rate`)
```

- [ ] **Step 2: Atualizar `frontend/components/meta/MetaAdsDataContext.tsx` linhas ~55 e ~111**

Encontre:
```typescript
const res = await fetch("/api/meta/ad-accounts");
```
Substitua por:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/ad-accounts`);
```

Encontre:
```typescript
const res = await fetch(`/api/meta/insights?${params.toString()}`);
```
Substitua por:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/insights?${params.toString()}`);
```

- [ ] **Step 3: Atualizar `frontend/components/meta/MetaAdsChartsSection.tsx` linha ~261**

Encontre:
```typescript
const res = await fetch(`/api/meta/audience-insights?${params.toString()}`);
```
Substitua por:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/audience-insights?${params.toString()}`);
```

- [ ] **Step 4: Atualizar `frontend/components/meta/MetaFeaturedAdsTable.tsx` linhas ~109 e ~556**

Encontre:
```typescript
const res = await fetch(`/api/meta/ad-compare?${params}`);
```
Substitua por:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/ad-compare?${params}`);
```

Encontre:
```typescript
const res = await fetch(`/api/meta/featured-ads?${params.toString()}`);
```
Substitua por:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/featured-ads?${params.toString()}`);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/
git commit -m "refactor: update API calls to use NEXT_PUBLIC_API_URL instead of /api/*"
```

---

## Task 10: Corrigir imports quebrados no frontend

Com `lib/meta-graph.ts` e `lib/meta-env.ts` deletados, verificar se algum arquivo restante os importa.

- [ ] **Step 1: Verificar imports quebrados**

```bash
rg "from.*meta-graph|from.*meta-env" frontend/
```

Resultado esperado: nenhuma linha (os únicos importadores eram rotas de API removidas).

- [ ] **Step 2: Verificar se `lib/meta-ads-data.ts` importa `MetaKpiRow` de meta-graph**

Abra `frontend/lib/meta-ads-data.ts`. Se houver `import type { MetaInsightRow } from "@/lib/meta-graph"` ou similar, remova a linha (o tipo não é mais necessário no frontend).

O tipo `MetaKpiRow` definido em `meta-ads-data.ts` continua sendo usado pelos componentes — ele fica.

---

## Critérios de aceite de documentação (gate antes de implementação)

- [ ] A spec em `docs/superpowers/specs/2026-04-24-3layer-refactor-design.md` está referenciada como fonte de verdade no plano.
- [ ] O File Map não inclui criação de `execution/meta_date_ranges.py` e `execution/meta_kpi_merge.py`.
- [ ] O File Map não inclui remoção de `frontend/lib/meta-kpi-merge.ts` nem `frontend/lib/meta-date-ranges.ts`.
- [ ] A Task 2 é exclusivamente de alinhamento documental e ocorre antes de qualquer task de código.
- [ ] Não há instrução no plano que contradiga contratos de API, estrutura final e escopo definidos na spec aprovada.

- [ ] **Step 3: Commit se houver mudanças**

```bash
git add frontend/lib/
git commit -m "fix: remove broken imports from deleted server libs"
```

---

## Task 11: Atualizar Dockerfiles e infraestrutura

**Files:**
- Create: `Dockerfile.backend`
- Modify: `Dockerfile.frontend`
- Modify: `.env.example`
- Modify: `.dockerignore`

- [ ] **Step 1: Criar `Dockerfile.backend`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY execution/ ./execution/
COPY backend/ ./backend/

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Atualizar `Dockerfile.frontend`**

O arquivo foi renomeado de `Dockerfile`. O WORKDIR e os paths precisam refletir `frontend/`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

- [ ] **Step 3: Atualizar `.env.example`**

```bash
# Meta Marketing API
META_APP_ID=
META_APP_SECRET=
META_USER_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v21.0
META_AD_ACCOUNT_ID=

# Frontend
NEXT_PUBLIC_API_URL=https://<url-do-backend-no-easypanel>
NEXT_PUBLIC_FALLBACK_USD_BRL=5.5
```

- [ ] **Step 4: Atualizar `.dockerignore`**

Adicionar ao final:
```
frontend/node_modules
frontend/.next
__pycache__
*.pyc
*.pyo
.venv
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile.backend Dockerfile.frontend .env.example .dockerignore
git commit -m "feat: add Dockerfile.backend, update Dockerfile.frontend for frontend/ subdir"
```

---

## Task 12: Push final e configuração EasyPanel

- [ ] **Step 1: Push para main**

```bash
git push origin main
```

- [ ] **Step 2: Configurar serviço backend no EasyPanel**

No EasyPanel → projeto `python_auto` → `+ Serviço` → App:
- **Source:** GitHub → repo `dashboard-all` → branch `main`
- **Build:** Dockerfile → arquivo: `Dockerfile.backend`
- **Port:** 8000
- **Env vars:** `META_USER_ACCESS_TOKEN`, `META_GRAPH_API_VERSION`, `META_APP_ID`, `META_APP_SECRET`

- [ ] **Step 3: Configurar serviço frontend no EasyPanel**

No serviço `dashboard-p12` existente → Fonte → atualizar dockerfile para `Dockerfile.frontend`
- **Port:** 3000
- **Env vars:** adicionar `NEXT_PUBLIC_API_URL=https://<domínio-do-backend>`

- [ ] **Step 4: Fazer deploy de ambos e verificar**

Backend — testar:
```
GET https://<backend-url>/health          → {"status":"ok"}
GET https://<backend-url>/exchange-rate   → {"rate":..., "source":"frankfurter"}
```

Frontend — acessar o domínio e confirmar que as páginas carregam dados reais.
