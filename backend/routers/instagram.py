"""Instagram Graph API — perfil, feed, stories e insights por mídia."""
from __future__ import annotations

import asyncio
import os
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from execution.meta_ads import MetaGraphError
from execution.instagram_graph import (
    classify_media,
    fetch_connected_instagram_business_accounts,
    fetch_ig_media,
    fetch_ig_profile,
    fetch_ig_stories,
    fetch_ig_user_insights_timeseries,
    fetch_media_insight_metrics,
    filter_media_by_range,
    get_ig_user_id,
    normalize_insights,
    pick_three_metrics,
)

router = APIRouter()


def _get_token() -> str:
    token = (os.getenv("META_USER_ACCESS_TOKEN") or os.getenv("META_ACCESS_TOKEN") or "").strip()
    if not token:
        raise HTTPException(
            status_code=501,
            detail={"error": "META_USER_ACCESS_TOKEN ou META_ACCESS_TOKEN não configurado", "code": "missing_token"},
        )
    return token


def resolve_ig_id(ig_id: Optional[str]) -> str:
    """
    Prioridade: query `ig_id` (troca de conta no app) > env INSTAGRAM_BUSINESS_ACCOUNT_ID.
    Com várias contas no portfólio, o front pode listar /connected-accounts e enviar o id escolhido.
    """
    q = (ig_id or "").strip()
    if q:
        return q
    env_id = get_ig_user_id()
    if env_id:
        return env_id
    raise HTTPException(
        status_code=501,
        detail={
            "error": "Defina INSTAGRAM_BUSINESS_ACCOUNT_ID no .env ou passe ?ig_id= na requisição (conta selecionada).",
            "code": "missing_ig_id",
        },
    )


@router.get("/connected-accounts")
async def connected_accounts():
    """Contas Instagram profissionais acessíveis com o token (via Páginas vinculadas)."""
    token = _get_token()
    try:
        accounts = await fetch_connected_instagram_business_accounts(token)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code, "raw": e.raw})
    return {"accounts": accounts, "defaultFromEnv": get_ig_user_id() or None}


@router.get("/profile")
async def profile(ig_id: Optional[str] = Query(None, description="Instagram Business Account ID (opcional se houver no .env)")):
    token = _get_token()
    rid = resolve_ig_id(ig_id)
    try:
        return await fetch_ig_profile(token, rid)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code, "raw": e.raw})


@router.get("/summary")
async def summary(
    since: str = Query(..., description="Data inicial (YYYY-MM-DD)"),
    until: str = Query(..., description="Data final (YYYY-MM-DD)"),
    ig_id: Optional[str] = Query(None, description="Instagram Business Account ID"),
):
    """Resumo: seguidores + time series (se a API devolver) do período."""
    token = _get_token()
    rid = resolve_ig_id(ig_id)
    try:
        prof = await fetch_ig_profile(token, rid)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code})

    series = await fetch_ig_user_insights_timeseries(token, rid, since, until)
    return {
        "igUserId": rid,
        "username": prof.get("username"),
        "followers": prof.get("followers_count"),
        "mediaCount": prof.get("media_count"),
        "profilePicture": prof.get("profile_picture_url"),
        "rawProfile": prof,
        "userInsights": series,
    }


async def _media_with_insight(
    token: str, row: dict, is_story: bool, sem: asyncio.Semaphore
) -> dict[str, Any]:
    async with sem:
        mid = row.get("id")
        if not mid:
            z = "—"
            return {
                "media": row,
                "insights": {},
                "metrics3": [
                    {"label": "—", "value": z},
                    {"label": "—", "value": z},
                    {"label": "—", "value": z},
                ],
            }
        try:
            raw = await fetch_media_insight_metrics(token, str(mid), is_story=is_story)
            n = normalize_insights(raw)
        except MetaGraphError:
            n = {}
        t3 = pick_three_metrics(row, n)
        metrics3 = [{"label": t3[0][0], "value": t3[0][1]}, {"label": t3[1][0], "value": t3[1][1]}, {"label": t3[2][0], "value": t3[2][1]}]
        return {
            "media": row,
            "insights": n,
            "metrics3": metrics3,
            "rawInsights": raw.get("data", []) if isinstance(raw, dict) else [],
        }


@router.get("/stories")
async def stories_in_period(
    since: str = Query(...),
    until: str = Query(...),
    limit: int = Query(24, ge=1, le=60),
    ig_id: Optional[str] = Query(None, description="Instagram Business Account ID"),
):
    token = _get_token()
    rid = resolve_ig_id(ig_id)
    try:
        all_st = await fetch_ig_stories(token, rid)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code})

    filtered = filter_media_by_range(all_st, since, until)[:limit]
    sem = asyncio.Semaphore(4)
    tasks = [_media_with_insight(token, s, True, sem) for s in filtered]
    items = await asyncio.gather(*tasks) if tasks else []
    return {"igUserId": rid, "count": len(items), "items": list(items)}


@router.get("/feed")
async def feed_in_period(
    since: str = Query(...),
    until: str = Query(...),
    limit: int = Query(24, ge=1, le=60),
    ig_id: Optional[str] = Query(None, description="Instagram Business Account ID"),
):
    token = _get_token()
    rid = resolve_ig_id(ig_id)
    try:
        all_m = await fetch_ig_media(token, rid)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code})

    filtered = filter_media_by_range(all_m, since, until)[: max(limit, 1)]
    # Remove stories de feed se vierem
    non_story = [m for m in filtered if classify_media(m) != "story"][:limit]
    sem = asyncio.Semaphore(4)
    tasks = [_media_with_insight(token, m, False, sem) for m in non_story]
    items = await asyncio.gather(*tasks) if tasks else []
    return {"igUserId": rid, "count": len(items), "items": list(items)}


@router.get("/media/{media_id}/insights")
async def media_insights(
    media_id: str,
    is_story: bool = Query(False),
):
    token = _get_token()
    try:
        raw = await fetch_media_insight_metrics(token, media_id, is_story=is_story)
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code})
    return {
        "mediaId": media_id,
        "normalized": normalize_insights(raw),
        "raw": raw,
    }
