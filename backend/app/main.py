from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, ads, auth, orders, search
from app.core.config import get_settings

app = FastAPI(title="lessmarket API", version="0.1.0")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ads.router)
app.include_router(search.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
