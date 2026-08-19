import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, ads, auth, orders, search
from app.core.config import get_settings

logger = logging.getLogger("lessmarket")

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Without this, an unhandled exception (e.g. the LLM call failing) is
    # caught by Starlette's ServerErrorMiddleware, which sits *above*
    # CORSMiddleware in the stack and responds with the server's raw send,
    # bypassing the CORS layer entirely. The browser then reports a
    # confusing "blocked by CORS policy" error that hides the real 500.
    # Registering a handler here means ExceptionMiddleware (which sits
    # *below* CORSMiddleware) handles it instead, so CORS headers are
    # still attached and the frontend gets a real, readable error.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    detail = str(exc) if settings.ENVIRONMENT != "production" else "Internal server error"
    return JSONResponse(status_code=500, content={"detail": detail})


@app.get("/health")
def health():
    return {"status": "ok"}
