"""Instagram Graph API (conta comercial) — mídias, stories e insights por item."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

from execution.meta_ads import MetaGraphError, _graph_get

MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url,permalink}"
STORY_FIELDS = "id,media_type,media_url,thumbnail_url,timestamp,caption,permalink"

INSIGHTS_FEED = "impressions,reach,likes,comments,saves,shares,total_interactions,engagement,views,plays,profile_activity"
INSIGHTS_STORY = "exits,impressions,reach,replies,shares,total_interactions,navigation"


def get_ig_user_id() -> str:
    return (os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID") or "").strip()


async def fetch_connected_instagram_business_accounts(access_token: str) -> list[dict[str, Any]]:
    """
    Páginas do Facebook do token com Instagram Business vinculado.
    Cada item: pageId, pageName, igUserId, username, profilePictureUrl.
    """
    data = await _graph_get(
        "me/accounts",
        access_token,
        {
            "fields": "name,instagram_business_account{id,username,profile_picture_url}",
            "limit": "100",
        },
    )
    out: list[dict[str, Any]] = []
    for row in data.get("data") or []:
        if not isinstance(row, dict):
            continue
        ib = row.get("instagram_business_account")
        if not isinstance(ib, dict) or not ib.get("id"):
            continue
        out.append(
            {
                "pageId": str(row.get("id") or ""),
                "pageName": (row.get("name") or "").strip(),
                "igUserId": str(ib.get("id")),
                "username": (ib.get("username") or "").strip(),
                "profilePictureUrl": ib.get("profile_picture_url"),
            }
        )
    return out


def _parse_ig_ts(value: str | None) -> Optional[datetime]:
    if not value:
        return None
    v = str(value).strip()
    if not v:
        return None
    v = v.replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(v)
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d


def _in_range(d: Optional[datetime], start: datetime, end: datetime) -> bool:
    if d is None:
        return False
    return start <= d <= end


def _as_range(since: str, until: str) -> tuple[datetime, datetime]:
    """Datas ISO YYYY-MM-DD, intervalo [start day 00:00, end day 23:59:59] em UTC."""
    a = datetime.strptime(since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    b = datetime.strptime(until, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    return a, b


def _data_values(insights_payload: dict) -> dict[str, float | int | str | None]:
    out: dict[str, float | int | str | None] = {}
    for row in insights_payload.get("data") or []:
        if not isinstance(row, dict):
            continue
        name = row.get("name")
        vals = row.get("values") or []
        if not name or not isinstance(vals, list) or not vals:
            continue
        first = vals[0] if isinstance(vals[0], dict) else {}
        v = first.get("value")
        if v is not None and isinstance(v, (int, float, str)):
            if isinstance(v, (int, float)) and v == v:  # finito
                out[str(name)] = v
    return out


async def fetch_ig_profile(access_token: str, ig_id: str) -> dict:
    return await _graph_get(
        ig_id,
        access_token,
        {
            "fields": "id,username,profile_picture_url,media_count,followers_count,follows_count,website,biography",
        },
    )


async def _paging_get_all(
    first_page: dict, access_token: str, cap: int = 150
) -> list[dict]:
    rows: list[dict] = list(first_page.get("data") or [])
    next_url = (first_page.get("paging") or {}).get("next")
    pages = 0
    import httpx  # local import
    while next_url and len(rows) < cap and pages < 10:
        pages += 1
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(next_url)
        data = res.json()
        if data.get("error") or not res.is_success:
            break
        rows.extend(data.get("data") or [])
        next_url = (data.get("paging") or {}).get("next")
    return rows[:cap]


async def fetch_ig_media(access_token: str, ig_id: str) -> list[dict]:
    fields = MEDIA_FIELDS
    try:
        first = await _graph_get(
            f"{ig_id}/media",
            access_token,
            {"fields": fields, "limit": "50"},
        )
    except MetaGraphError:
        # Algumas contas não retornam like_count/comments no campo base
        fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url,permalink}"
        first = await _graph_get(
            f"{ig_id}/media",
            access_token,
            {"fields": fields, "limit": "50"},
        )
    return await _paging_get_all(first, access_token, 120)


async def fetch_ig_stories(access_token: str, ig_id: str) -> list[dict]:
    try:
        first = await _graph_get(
            f"{ig_id}/stories",
            access_token,
            {"fields": STORY_FIELDS, "limit": "50"},
        )
    except MetaGraphError:
        return []
    return await _paging_get_all(first, access_token, 80)


async def fetch_media_insight_metrics(
    access_token: str, media_id: str, *, is_story: bool
) -> dict[str, Any]:
    """
    Tenta agregar as métricas; o Graph responde conforme o tipo e permissões.
    """
    metrics = INSIGHTS_STORY if is_story else INSIGHTS_FEED
    try:
        # Primeira tentativa: lista de métricas
        return await _graph_get(
            f"{media_id}/insights",
            access_token,
            {"metric": metrics},
        )
    except MetaGraphError:
        pass
    out: dict[str, Any] = {"data": []}
    for m in metrics.split(","):
        m = m.strip()
        if not m:
            continue
        try:
            chunk = await _graph_get(f"{media_id}/insights", access_token, {"metric": m})
            rows = chunk.get("data")
            if isinstance(rows, list):
                (out.setdefault("data", [])).extend(rows)  # type: ignore[union-attr]
        except MetaGraphError:
            continue
    return out


def normalize_insights(d: dict) -> dict[str, float | int | str | None]:
    return {k: v for k, v in _data_values(d).items() if v is not None}


def filter_media_by_range(items: list[dict], since: str, until: str) -> list[dict]:
    start, end = _as_range(since, until)
    out: list[dict] = []
    for row in items:
        ts = _parse_ig_ts(row.get("timestamp") if isinstance(row, dict) else None)
        if _in_range(ts, start, end):
            out.append(row)
    return out


def classify_media(m: dict) -> str:
    t = (m.get("media_type") or "").upper()
    if t == "STORY" or t == "STORIES":
        return "story"
    if t == "CAROUSEL_ALBUM":
        return "carousel"
    if t == "VIDEO" or t == "REEL":
        return "reel"
    return "post"


def _fmt(v: object) -> str:
    if v is None:
        return "—"
    if isinstance(v, float) and (v != v or abs(v) == float("inf")):  # nan/inf
        return "—"
    return f"{v}"


def pick_three_metrics(
    m: dict, ins: dict[str, float | int | str | None]
) -> tuple[tuple[str, str], tuple[str, str], tuple[str, str]]:
    kind = classify_media(m)
    if kind == "story":
        return (
            ("Impressões", _fmt(ins.get("impressions"))),
            ("Alcance", _fmt(ins.get("reach"))),
            ("Respostas", _fmt(ins.get("replies", ins.get("exits")))),
        )
    likes = ins.get("likes")
    if likes is None and m.get("like_count") is not None:
        likes = m.get("like_count")
    comments = ins.get("comments")
    if comments is None and m.get("comments_count") is not None:
        comments = m.get("comments_count")
    r1: tuple[str, str] = ("Curtidas", _fmt(likes))
    r2: tuple[str, str] = ("Comentários", _fmt(comments))
    r3: tuple[str, str] = (
        "Alcance",
        _fmt(ins.get("reach", ins.get("impressions"))),
    )
    if kind == "carousel":
        r3 = ("Salvos", _fmt(ins.get("saves")))
    return (r1, r2, r3)


async def fetch_ig_user_insights_timeseries(
    access_token: str, ig_id: str, since: str, until: str
) -> Optional[dict]:
    a = datetime.strptime(since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    b = datetime.strptime(until, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    try:
        return await _graph_get(
            f"{ig_id}/insights",
            access_token,
            {
                "metric": "impressions,reach,profile_views",
                "metric_type": "time_series",
                "period": "day",
                "since": str(int(a.timestamp())),
                "until": str(int(b.timestamp())),
            },
        )
    except MetaGraphError:
        return None
