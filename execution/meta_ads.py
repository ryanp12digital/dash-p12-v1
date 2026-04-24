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
    act_id = account_id if account_id.startswith("act_") else f"act_{account_id}"
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
