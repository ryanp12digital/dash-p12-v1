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
