from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.routers import meta, exchange_rate, instagram

app = FastAPI(title="Dashboard P12 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(meta.router, prefix="/meta", tags=["meta"])
app.include_router(exchange_rate.router, tags=["utils"])
app.include_router(instagram.router, prefix="/instagram", tags=["instagram"])


@app.get("/health")
async def health():
    return {"status": "ok"}
