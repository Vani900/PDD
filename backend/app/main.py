"""
CharityAI – Main FastAPI Application
Entry point: middleware, routers, lifespan, error handlers, health check.
"""
from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import logging

import sentry_sdk
import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

try:
    from prometheus_fastapi_instrumentator import Instrumentator
except ImportError:
    Instrumentator = None

from app.core.config import settings
from app.core.exceptions import CharityAIException
from app.infrastructure.database.session import check_db_connection

logger = structlog.get_logger()


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown event handlers."""
    logger.info(f"CharityAI starting up… version={settings.APP_VERSION} env={settings.APP_ENV}")

    # ── Sentry ────────────────────────────────────────────────────────────────
    if settings.SENTRY_DSN and settings.is_production and sentry_sdk is not None:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=0.1,
            environment=settings.APP_ENV,
            release=settings.APP_VERSION,
        )

    # ── DB health check ───────────────────────────────────────────────────────
    if not await check_db_connection():
        logger.error("Database connection failed at startup!")

    logger.info("CharityAI startup complete.")
    yield
    logger.info("CharityAI shutting down…")


# ── App Factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="CharityAI API",
        description=(
            "Enterprise-grade AI-powered donation ecosystem API.\n\n"
            "Connecting Donors, NGOs, Volunteers, and Receivers through AI."
        ),
        version=settings.APP_VERSION,
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    _register_middleware(app)
    _register_routers(app)
    _register_error_handlers(app)
    _register_metrics(app)

    return app


def _register_middleware(app: FastAPI) -> None:
    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
    )

    # ── GZip compression ──────────────────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── Request ID & timing middleware ────────────────────────────────────────
    @app.middleware("http")
    async def request_id_and_timing(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.perf_counter()
        response = await call_next(request)
        duration = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.2f}ms"
        return response

    # ── Structured request logging ────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"request_started method={request.method} path={request.url.path} client={client_host}")
        response = await call_next(request)
        logger.info(f"request_completed method={request.method} path={request.url.path} status_code={response.status_code}")
        return response


def _register_routers(app: FastAPI) -> None:
    from app.presentation.api.v1.routers import (
        admin,
        ai,
        analytics,
        auth,
        corporate,
        donations,
        ngos,
        notifications,
        payments,
        receivers,
        users,
        volunteers,
        websockets,
    )

    prefix = settings.API_V1_PREFIX
    app.include_router(auth.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(donations.router, prefix=prefix)
    app.include_router(ngos.router, prefix=prefix)
    app.include_router(volunteers.router, prefix=prefix)
    app.include_router(receivers.router, prefix=prefix)
    app.include_router(corporate.router, prefix=prefix)
    app.include_router(payments.router, prefix=prefix)
    app.include_router(ai.router, prefix=prefix)
    app.include_router(admin.router, prefix=prefix)
    app.include_router(analytics.router, prefix=prefix)
    app.include_router(notifications.router, prefix=prefix)
    app.include_router(websockets.router, prefix="/ws")


def _register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(CharityAIException)
    async def charityai_exception_handler(request: Request, exc: CharityAIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Our team has been notified.",
            },
        )


def _register_metrics(app: FastAPI) -> None:
    if settings.PROMETHEUS_METRICS_ENABLED and Instrumentator is not None:
        Instrumentator().instrument(app).expose(app, endpoint="/metrics")


# ── Health Check ──────────────────────────────────────────────────────────────
app = create_app()


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    db_ok = await check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "database": "ok" if db_ok else "error",
    }


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "name": "CharityAI API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }
