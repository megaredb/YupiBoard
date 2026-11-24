from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import async_engine
from app.core.exceptions import AppException
from app.core.media_url import extract_request_origin, request_origin_var
from app.core.realtime import realtime_broker
from app.modules.router import api_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
    # Startup actions
    yield
    # Shutdown actions: cleanly dispose database engine and realtime broker connections
    await realtime_broker.close()
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def bind_request_origin(request: Request, call_next):  # type: ignore[no-untyped-def]
    token = request_origin_var.set(extract_request_origin(request))
    try:
        return await call_next(request)
    finally:
        request_origin_var.reset(token)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    content = {"detail": exc.detail}
    if exc.extra:
        content["extra"] = exc.extra
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=exc.headers,
    )


# Mount media storage for local development
media_path = Path(settings.MEDIA_DIR)
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

# Include API routers
app.include_router(api_router)
