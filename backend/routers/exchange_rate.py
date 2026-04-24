from fastapi import APIRouter
from execution.exchange_rate import fetch_exchange_rate

router = APIRouter()


@router.get("/exchange-rate")
async def get_exchange_rate():
    return await fetch_exchange_rate()
