"""Rotas Meta Ads — espelham os endpoints de app/api/meta/* do Next.js."""
import asyncio
import os
from datetime import date, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query

from execution.meta_ads import (
    MetaGraphError,
    fetch_ad_accounts,
    fetch_account_ad_insights,
    fetch_account_insights,
    fetch_account_insights_breakdown,
    fetch_ad_insights,
    fetch_ad_thumbnail_url,
    parse_number,
    sum_action,
)

router = APIRouter()

# ── helpers ──────────────────────────────────────────────────────────────────

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


def _ymd(d: date) -> str:
    return d.isoformat()


def _build_ranges(since: Optional[str], until: Optional[str]) -> dict:
    """Período atual vs período anterior de mesmo tamanho."""
    if since and until:
        a = date.fromisoformat(since)
        b = date.fromisoformat(until)
        days = (b - a).days + 1
        until_prev = a - timedelta(days=1)
        since_prev = until_prev - timedelta(days=days - 1)
        return {
            "current": {"since": since, "until": until},
            "previous": {"since": _ymd(since_prev), "until": _ymd(until_prev)},
        }
    # default: últimos 30 dias completos vs 30 dias anteriores
    end = date.today() - timedelta(days=1)
    start_current = end - timedelta(days=29)
    end_prev = start_current - timedelta(days=1)
    start_prev = end_prev - timedelta(days=29)
    return {
        "current": {"since": _ymd(start_current), "until": _ymd(end)},
        "previous": {"since": _ymd(start_prev), "until": _ymd(end_prev)},
    }


def _pct_change(cur: float, prev: float) -> Optional[float]:
    if prev == 0:
        return 0.0 if cur == 0 else None
    return ((cur - prev) / prev) * 100


def _roas(row: Optional[dict]) -> float:
    pr = (row or {}).get("purchase_roas") or []
    return sum(parse_number(x.get("value")) or 0 for x in pr)


def _cost_per_action(row: Optional[dict], action_type: str) -> float:
    lst = (row or {}).get("cost_per_action_type") or []
    for x in lst:
        if x.get("action_type") == action_type:
            return parse_number(x.get("value")) or 0.0
    return 0.0


KPI_TEMPLATE = [
    {"id": "spent",                   "group": "core",      "labelKey": "meta.kpi.spent",                   "helpKey": "meta.help.spent",                   "kind": "money",   "goodWhen": "neutral", "showTrend": True},
    {"id": "impressions",             "group": "core",      "labelKey": "meta.kpi.impressions",             "helpKey": "meta.help.impressions",             "kind": "count",   "goodWhen": "higher",  "showTrend": True},
    {"id": "reach",                   "group": "core",      "labelKey": "meta.kpi.reach",                   "helpKey": "meta.help.reach",                   "kind": "count",   "goodWhen": "higher",  "showTrend": True},
    {"id": "linkClicks",              "group": "core",      "labelKey": "meta.kpi.linkClicks",              "helpKey": "meta.help.linkClicks",              "kind": "count",   "goodWhen": "higher",  "showTrend": True},
    {"id": "ctr",                     "group": "core",      "labelKey": "meta.kpi.ctrShort",                "helpKey": "meta.help.ctr",                     "kind": "percent", "goodWhen": "higher",  "showTrend": True},
    {"id": "cpc",                     "group": "core",      "labelKey": "meta.kpi.cpc",                     "helpKey": "meta.help.cpc",                     "kind": "money",   "goodWhen": "lower",   "showTrend": True},
    {"id": "cpm",                     "group": "core",      "labelKey": "meta.kpi.cpm",                     "helpKey": "meta.help.cpm",                     "kind": "money",   "goodWhen": "lower",   "showTrend": True},
    {"id": "frequency",               "group": "delivery",  "labelKey": "meta.kpi.frequency",               "helpKey": "meta.help.frequency",               "kind": "ratio",   "goodWhen": "lower",   "showTrend": True},
    {"id": "purchases",               "group": "purchases", "labelKey": "meta.kpi.purchases",               "helpKey": "meta.help.purchases",               "kind": "count",   "goodWhen": "higher",  "showTrend": True},
    {"id": "costPerPurchase",         "group": "purchases", "labelKey": "meta.kpi.costPerPurchase",         "helpKey": "meta.help.costPerPurchase",         "kind": "money",   "goodWhen": "lower",   "showTrend": True},
    {"id": "purchaseConversionValue", "group": "purchases", "labelKey": "meta.kpi.purchaseConversionValue", "helpKey": "meta.help.purchaseConversionValue", "kind": "money",   "goodWhen": "higher",  "showTrend": False},
    {"id": "sitePurchaseRoas",        "group": "purchases", "labelKey": "meta.kpi.sitePurchaseRoas",        "helpKey": "meta.help.sitePurchaseRoas",        "kind": "plain",   "goodWhen": "higher",  "showTrend": False},
    {"id": "leads",                   "group": "leads",     "labelKey": "meta.kpi.leads",                   "helpKey": "meta.help.leads",                   "kind": "count",   "goodWhen": "higher",  "showTrend": True, "wide": True},
    {"id": "costPerLead",             "group": "leads",     "labelKey": "meta.kpi.costPerLead",             "helpKey": "meta.help.costPerLead",             "kind": "money",   "goodWhen": "lower",   "showTrend": True, "wide": True},
]


def _merge_kpis(current: Optional[dict], previous: Optional[dict], compare: bool) -> list[dict]:
    has_prev = compare and previous is not None

    def n(row, key):
        return parse_number((row or {}).get(key)) or 0.0

    cs, ps   = n(current, "spend"),              n(previous, "spend")
    ci, pi   = n(current, "impressions"),         n(previous, "impressions")
    cr, pr   = n(current, "reach"),               n(previous, "reach")
    cl, pl   = n(current, "inline_link_clicks"),  n(previous, "inline_link_clicks")
    cc, pc   = parse_number((current or {}).get("ctr")), parse_number((previous or {}).get("ctr"))
    ccpc,pcp = n(current, "cpc"),  n(previous, "cpc")
    ccpm,pcm = n(current, "cpm"),  n(previous, "cpm")
    cf, pf   = n(current, "frequency"), n(previous, "frequency")

    ca = (current or {}).get("actions") or []
    pa = (previous or {}).get("actions") or []
    c_leads = sum_action(ca, "lead")
    p_leads = sum_action(pa, "lead")
    c_purch = sum_action(ca, "purchase") + sum_action(ca, "omni_purchase")
    p_purch = sum_action(pa, "purchase") + sum_action(pa, "omni_purchase")
    c_cpl = _cost_per_action(current, "lead")     or (cs / c_leads if c_leads else 0)
    p_cpl = _cost_per_action(previous, "lead")    or (ps / p_leads if p_leads else 0)
    c_cpp = _cost_per_action(current, "purchase")  or (cs / c_purch if c_purch else 0)
    p_cpp = _cost_per_action(previous, "purchase") or (ps / p_purch if p_purch else 0)

    patches = {
        "spent":                   {"current": cs,  "prev": ps   if has_prev else None, "changePct": _pct_change(cs, ps)     if has_prev else None, "showTrend": has_prev},
        "impressions":             {"current": ci,  "prev": pi   if has_prev else None, "changePct": _pct_change(ci, pi)     if has_prev else None, "showTrend": has_prev},
        "reach":                   {"current": cr,  "prev": pr   if has_prev else None, "changeAbs": cr - pr                 if has_prev else None, "showTrend": has_prev},
        "linkClicks":              {"current": cl,  "prev": pl   if has_prev else None, "changePct": _pct_change(cl, pl)     if has_prev else None, "showTrend": has_prev},
        "ctr":                     {"current": cc or 0, "prev": (pc or 0) if has_prev else None, "changePct": _pct_change(cc, pc) if (has_prev and cc and pc) else None, "showTrend": has_prev},
        "cpc":                     {"current": ccpc,"prev": pcp  if has_prev else None, "changePct": _pct_change(ccpc, pcp)  if has_prev else None, "showTrend": has_prev},
        "cpm":                     {"current": ccpm,"prev": pcm  if has_prev else None, "changePct": _pct_change(ccpm, pcm)  if has_prev else None, "showTrend": has_prev},
        "frequency":               {"current": cf,  "prev": pf   if has_prev else None, "changePct": _pct_change(cf, pf)     if has_prev else None, "showTrend": has_prev},
        "purchases":               {"current": c_purch, "prev": p_purch if has_prev else None, "changePct": _pct_change(c_purch, p_purch) if has_prev else 0, "showTrend": has_prev},
        "costPerPurchase":         {"current": c_cpp,   "prev": p_cpp   if has_prev else None, "changePct": _pct_change(c_cpp, p_cpp)    if has_prev else 0, "showTrend": has_prev},
        "purchaseConversionValue": {"current": 0, "showTrend": False},
        "sitePurchaseRoas":        {"current": _roas(current), "showTrend": False},
        "leads":                   {"current": c_leads, "prev": p_leads if has_prev else None, "changePct": _pct_change(c_leads, p_leads) if has_prev else None, "showTrend": has_prev},
        "costPerLead":             {"current": c_cpl,   "prev": p_cpl   if has_prev else None, "changePct": _pct_change(c_cpl, p_cpl)    if has_prev else None, "showTrend": has_prev},
    }

    import copy
    rows = copy.deepcopy(KPI_TEMPLATE)
    for row in rows:
        patch = patches.get(row["id"])
        if patch:
            row.update(patch)
    return rows


# ── conversion helpers shared by featured-ads and ad-compare ─────────────────

def _calc_conversions(actions: list | None, result_type: str, objective: str) -> tuple[float, str]:
    obj = objective.upper()
    acts = actions or []
    purchases     = sum_action(acts, "purchase") + sum_action(acts, "omni_purchase") + sum_action(acts, "offsite_conversion.fb_pixel_purchase")
    leads         = sum_action(acts, "lead") + sum_action(acts, "onsite_conversion.lead") + sum_action(acts, "offsite_conversion.fb_pixel_lead") + sum_action(acts, "leadgen_grouped")
    conversations = sum_action(acts, "onsite_conversion.messaging_conversation_started_7d") + sum_action(acts, "onsite_conversion.messaging_first_reply")
    registrations = sum_action(acts, "complete_registration") + sum_action(acts, "offsite_conversion.fb_pixel_complete_registration")

    if result_type == "purchases":     return purchases,     "meta.metric.purchases"
    if result_type == "leads":         return leads,         "meta.metric.leadsOnMeta"
    if result_type == "conversations": return conversations, "meta.metric.conversationsStarted"
    if result_type == "registrations": return registrations, "meta.metric.registrations"

    # auto
    if "PURCHASE" in obj and purchases > 0:      return purchases,     "meta.metric.purchases"
    if "LEAD" in obj and leads > 0:              return leads,         "meta.metric.leadsOnMeta"
    if "MESSAGE" in obj and conversations > 0:   return conversations, "meta.metric.conversationsStarted"
    if "REGISTRATION" in obj and registrations > 0: return registrations, "meta.metric.registrations"
    if purchases > 0:      return purchases,     "meta.metric.purchases"
    if leads > 0:          return leads,         "meta.metric.leadsOnMeta"
    if conversations > 0:  return conversations, "meta.metric.conversationsStarted"
    if registrations > 0:  return registrations, "meta.metric.registrations"
    return 0.0, ""


def _build_ad_metrics(row: Optional[dict]) -> Optional[dict]:
    if not row:
        return None
    spent       = parse_number(row.get("spend")) or 0
    impressions = parse_number(row.get("impressions")) or 0
    reach       = parse_number(row.get("reach")) or 0
    link_clicks = parse_number(row.get("inline_link_clicks")) or 0
    result_value, result_label = _calc_conversions(row.get("actions"), "auto", row.get("objective") or "")
    cost_per    = spent / result_value if result_value > 0 else 0
    ctr = (link_clicks / impressions * 100) if impressions else (parse_number(row.get("ctr")) or 0)
    cpc = (spent / link_clicks) if link_clicks else (parse_number(row.get("cpc")) or 0)
    cpm = (spent / impressions * 1000) if impressions else (parse_number(row.get("cpm")) or 0)
    return {
        "spent": spent, "impressions": impressions, "reach": reach, "linkClicks": link_clicks,
        "resultValue": result_value, "resultLabelKey": result_label,
        "costPerResult": cost_per, "ctr": ctr, "cpc": cpc, "cpm": cpm,
        "frequency": parse_number(row.get("frequency")) or 0,
    }


# ── endpoints ─────────────────────────────────────────────────────────────────

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


@router.get("/insights")
async def get_insights(
    accountId: str = Query(...),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    compare: Optional[str] = Query(None),
):
    token = _get_token()
    compare_with_previous = compare not in ("0", "false")
    ranges = _build_ranges(since, until)
    try:
        current = await fetch_account_insights(token, accountId, ranges["current"])
        previous = await fetch_account_insights(token, accountId, ranges["previous"]) if compare_with_previous else None
        kpi_rows = _merge_kpis(current, previous, compare_with_previous)
        return {
            "accountId": _to_act(accountId),
            "ranges": ranges,
            "kpiRows": kpi_rows,
            "raw": {"current": current, "previous": previous},
            "compareWithPrevious": compare_with_previous,
        }
    except MetaGraphError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "code": e.code, "details": e.raw})


@router.get("/audience-insights")
async def get_audience_insights(
    accountId: str = Query(...),
    since: str = Query(...),
    until: str = Query(...),
):
    token = _get_token()
    time_range = {"since": since, "until": until}
    gender, regions, errors = [], [], {}

    def _normalize_gender(rows: list[dict]) -> list[dict]:
        keys = ["meta.gender.female", "meta.gender.male", "meta.gender.unknown"]
        acc = {k: {"imp": 0.0, "reach": 0.0} for k in keys}
        for row in rows:
            g = (row.get("gender") or "").lower()
            key = "meta.gender.female" if g == "female" else "meta.gender.male" if g == "male" else "meta.gender.unknown"
            acc[key]["imp"]   += parse_number(row.get("impressions")) or 0
            acc[key]["reach"] += parse_number(row.get("reach")) or 0
        return [{"generoKey": k, "impressoes": round(v["imp"]), "alcance": round(v["reach"])} for k, v in acc.items()]

    def _normalize_regions(rows: list[dict]) -> list[dict]:
        out = []
        for row in rows:
            label      = (row.get("region") or "").strip() or "—"
            alcance    = round(parse_number(row.get("reach")) or 0)
            impressoes = round(parse_number(row.get("impressions")) or 0)
            spend      = parse_number(row.get("spend")) or 0
            cpm        = parse_number(row.get("cpm")) or 0
            freq       = parse_number(row.get("frequency")) or 0
            if impressoes > 0 and spend > 0 and cpm == 0:
                cpm = (spend / impressoes) * 1000
            if impressoes > 0 and alcance > 0 and freq == 0:
                freq = impressoes / alcance
            if label != "—" and (alcance > 0 or impressoes > 0 or spend > 0):
                out.append({"regionLabel": label, "alcance": alcance, "impressoes": impressoes,
                            "frequencia": freq, "valorInvestido": spend, "cpm": cpm})
        out.sort(key=lambda r: r["alcance"], reverse=True)
        return out[:40]

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


@router.get("/featured-ads")
async def get_featured_ads(
    accountId: str = Query(...),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    limit: int = Query(8),
    resultType: str = Query("auto"),
):
    token = _get_token()
    ranges = _build_ranges(since, until)
    try:
        ad_rows = await fetch_account_ad_insights(token, accountId, ranges["current"], max(limit * 2, 20))
        scored = []
        for r in ad_rows:
            impressions = parse_number(r.get("impressions")) or 0
            if impressions == 0:
                continue
            spend       = parse_number(r.get("spend")) or 0
            reach       = parse_number(r.get("reach")) or 0
            link_clicks = parse_number(r.get("inline_link_clicks")) or 0
            result_value, result_label = _calc_conversions(r.get("actions"), resultType, r.get("objective") or "")
            scored.append({"r": r, "spend": spend, "impressions": impressions, "reach": reach,
                           "link_clicks": link_clicks, "result_value": result_value, "result_label": result_label})

        scored.sort(key=lambda x: x["result_value"], reverse=True)
        top = scored[:max(1, limit)]

        cache: dict[str, Optional[str]] = {}
        featured = []
        for x in top:
            ad = x["r"]
            ad_id = ad.get("ad_id")
            thumbnail_url = None
            if ad_id:
                if ad_id not in cache:
                    try:
                        cache[ad_id] = await fetch_ad_thumbnail_url(token, ad_id)
                    except Exception:
                        cache[ad_id] = None
                thumbnail_url = cache[ad_id]

            spend  = x["spend"]
            result = x["result_value"]
            ctr = (x["link_clicks"] / x["impressions"] * 100) if x["impressions"] else (parse_number(ad.get("ctr")) or 0)
            cpc = (spend / x["link_clicks"]) if x["link_clicks"] else (parse_number(ad.get("cpc")) or 0)
            cpm = (spend / x["impressions"] * 1000) if x["impressions"] else (parse_number(ad.get("cpm")) or 0)

            featured.append({
                "id": ad_id or f"{ad.get('adset_id', '')}-{ad.get('ad_name', '')}",
                "name": ad.get("ad_name") or "Ad",
                "campaignName": ad.get("campaign_name") or "Campaign",
                "adsetName": ad.get("adset_name") or "Ad set",
                "thumbLetter": (ad.get("ad_name") or "A")[0].upper(),
                "thumbnailUrl": thumbnail_url,
                "resultValue": str(round(result * 1000) / 1000),
                "resultLabelKey": x["result_label"],
                "costPerResultBrl": spend / result if result > 0 else 0,
                "spent": spend,
                "reach": x["reach"],
                "impressions": x["impressions"],
                "linkClicks": x["link_clicks"],
                "ctr": ctr,
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
        row1, row2 = await asyncio.gather(
            fetch_ad_insights(token, adId, {"since": since1, "until": until1}),
            fetch_ad_insights(token, adId, {"since": since2, "until": until2}),
        )
        return {
            "adId": adId,
            "period1": {"since": since1, "until": until1, "metrics": _build_ad_metrics(row1)},
            "period2": {"since": since2, "until": until2, "metrics": _build_ad_metrics(row2)},
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})
