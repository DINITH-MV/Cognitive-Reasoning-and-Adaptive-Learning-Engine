"""
CRACLE Backend - FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.config import settings
from app.db.database import engine, Base
from app.api.routes import auth, learning, agents, monitoring, simulations
from app.services.monitoring import setup_telemetry

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Starting CRACLE backend", version=settings.app_version)

    # Initialize telemetry
    setup_telemetry()

    # Create database tables (use Alembic migrations in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("CRACLE backend started successfully")
    yield

    # Shutdown
    logger.info("Shutting down CRACLE backend")
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="Cognitive Reasoning and Adaptive Learning Engine - AI-Powered LMS",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# API Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(learning.router, prefix="/api/v1/learning", tags=["Learning"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(simulations.router, prefix="/api/v1/simulations", tags=["Simulations"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["Monitoring"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version, "service": "CRACLE"}
