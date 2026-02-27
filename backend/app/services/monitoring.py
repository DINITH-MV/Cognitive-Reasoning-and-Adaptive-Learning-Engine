"""
CRACLE - Monitoring and Telemetry Service
Integrates with Azure Application Insights, OpenTelemetry, and Prometheus
for comprehensive agent performance tracking.
"""

import structlog
from typing import Optional

from prometheus_client import Counter, Histogram, Gauge

from app.config import settings

logger = structlog.get_logger(__name__)

# ── Prometheus Metrics ──────────────────────────

# Agent call metrics
AGENT_CALLS_TOTAL = Counter(
    "cracle_agent_calls_total",
    "Total number of agent calls",
    ["agent_name", "action", "status"],
)

AGENT_LATENCY = Histogram(
    "cracle_agent_latency_seconds",
    "Agent call latency in seconds",
    ["agent_name", "action"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

AGENT_TOKENS_USED = Counter(
    "cracle_agent_tokens_total",
    "Total tokens consumed by agents",
    ["agent_name", "token_type"],
)

# User metrics
ACTIVE_USERS = Gauge(
    "cracle_active_users",
    "Number of currently active users",
)

ACTIVE_SIMULATIONS = Gauge(
    "cracle_active_simulations",
    "Number of currently active simulations",
)

# Learning metrics
EVALUATIONS_TOTAL = Counter(
    "cracle_evaluations_total",
    "Total evaluations completed",
    ["evaluation_type"],
)

EVALUATION_SCORES = Histogram(
    "cracle_evaluation_scores",
    "Distribution of evaluation scores",
    ["evaluation_type"],
    buckets=[10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
)

LEARNING_PATHS_CREATED = Counter(
    "cracle_learning_paths_created_total",
    "Total learning paths created",
)


def setup_telemetry():
    """Configure OpenTelemetry with Azure Monitor export."""
    if not settings.appinsights_connection_string:
        logger.warning("Application Insights connection string not set, telemetry disabled")
        return

    try:
        from azure.monitor.opentelemetry import configure_azure_monitor

        configure_azure_monitor(
            connection_string=settings.appinsights_connection_string,
            enable_live_metrics=True,
        )
        logger.info("Azure Monitor telemetry configured")
    except ImportError:
        logger.warning("azure-monitor-opentelemetry not installed, using local telemetry only")
    except Exception as e:
        logger.error("Failed to configure Azure Monitor", error=str(e))


def record_agent_call(
    agent_name: str,
    action: str,
    status: str,
    latency_seconds: float,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
):
    """Record metrics for an agent call."""
    AGENT_CALLS_TOTAL.labels(agent_name=agent_name, action=action, status=status).inc()
    AGENT_LATENCY.labels(agent_name=agent_name, action=action).observe(latency_seconds)

    if prompt_tokens:
        AGENT_TOKENS_USED.labels(agent_name=agent_name, token_type="prompt").inc(prompt_tokens)
    if completion_tokens:
        AGENT_TOKENS_USED.labels(agent_name=agent_name, token_type="completion").inc(completion_tokens)


def record_evaluation(eval_type: str, score: float):
    """Record evaluation metrics."""
    EVALUATIONS_TOTAL.labels(evaluation_type=eval_type).inc()
    EVALUATION_SCORES.labels(evaluation_type=eval_type).observe(score)
