"""
CRACLE - Monitoring and metrics routes for agent performance visualization
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.evaluation import AgentInteraction, Evaluation
from app.models.simulation import SimulationSession
from app.api.auth_utils import get_current_user

router = APIRouter()


@router.get("/dashboard")
async def monitoring_dashboard(
    db: AsyncSession = Depends(get_db),
    days: int = 7,
):
    """Get comprehensive monitoring dashboard data for all agents."""
    since = datetime.utcnow() - timedelta(days=days)

    # Agent-level metrics
    agent_metrics_query = (
        select(
            AgentInteraction.agent_name,
            func.count().label("total_calls"),
            func.avg(AgentInteraction.latency_ms).label("avg_latency"),
            func.sum(case((AgentInteraction.status == "success", 1), else_=0)).label("success_count"),
            func.sum(case((AgentInteraction.status == "error", 1), else_=0)).label("error_count"),
        )
        .where(AgentInteraction.created_at >= since)
        .group_by(AgentInteraction.agent_name)
    )
    agent_results = await db.execute(agent_metrics_query)
    agents = []
    for row in agent_results:
        total = row.total_calls or 1
        agents.append({
            "agent_name": row.agent_name,
            "total_calls": row.total_calls,
            "avg_latency_ms": round(float(row.avg_latency or 0), 1),
            "success_rate": round(float(row.success_count or 0) / total * 100, 1),
            "error_count": row.error_count or 0,
        })

    # Total interactions
    total_query = select(func.count()).select_from(AgentInteraction).where(AgentInteraction.created_at >= since)
    total_result = await db.execute(total_query)
    total_interactions = total_result.scalar() or 0

    # Active users (distinct user_ids in interactions)
    active_users_query = (
        select(func.count(func.distinct(AgentInteraction.user_id)))
        .where(AgentInteraction.created_at >= since)
        .where(AgentInteraction.user_id.is_not(None))
    )
    active_result = await db.execute(active_users_query)
    active_users = active_result.scalar() or 0

    # Active simulations
    active_sims_query = select(func.count()).select_from(SimulationSession).where(SimulationSession.status == "active")
    sims_result = await db.execute(active_sims_query)
    active_sims = sims_result.scalar() or 0

    # Avg evaluation score
    avg_score_query = select(func.avg(Evaluation.percentage)).where(Evaluation.created_at >= since)
    avg_result = await db.execute(avg_score_query)
    avg_score = round(float(avg_result.scalar() or 0), 1)

    return {
        "agents": agents,
        "total_interactions": total_interactions,
        "active_users": active_users,
        "active_simulations": active_sims,
        "avg_evaluation_score": avg_score,
        "period_days": days,
    }


@router.get("/agents/{agent_name}/history")
async def agent_interaction_history(
    agent_name: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    """Get recent interaction history for a specific agent."""
    result = await db.execute(
        select(AgentInteraction)
        .where(AgentInteraction.agent_name == agent_name)
        .order_by(AgentInteraction.created_at.desc())
        .limit(limit)
    )
    interactions = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "action": i.action,
            "status": i.status,
            "latency_ms": i.latency_ms,
            "token_usage": i.token_usage,
            "error_message": i.error_message,
            "created_at": i.created_at.isoformat(),
        }
        for i in interactions
    ]


@router.get("/timeline")
async def interaction_timeline(
    db: AsyncSession = Depends(get_db),
    hours: int = 24,
):
    """Get a timeline of agent interactions bucketed by hour."""
    since = datetime.utcnow() - timedelta(hours=hours)

    result = await db.execute(
        select(
            func.date_trunc("hour", AgentInteraction.created_at).label("bucket"),
            AgentInteraction.agent_name,
            func.count().label("count"),
            func.avg(AgentInteraction.latency_ms).label("avg_latency"),
        )
        .where(AgentInteraction.created_at >= since)
        .group_by("bucket", AgentInteraction.agent_name)
        .order_by("bucket")
    )

    timeline = []
    for row in result:
        timeline.append({
            "timestamp": row.bucket.isoformat(),
            "agent": row.agent_name,
            "count": row.count,
            "avg_latency_ms": round(float(row.avg_latency or 0), 1),
        })
    return timeline


@router.get("/user/{user_id}/progress")
async def user_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed learning progress analytics for a user."""
    import uuid
    uid = uuid.UUID(user_id)

    # Evaluations over time
    eval_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == uid)
        .order_by(Evaluation.created_at)
    )
    evaluations = eval_result.scalars().all()

    return {
        "evaluation_history": [
            {
                "id": str(e.id),
                "type": e.evaluation_type.value,
                "title": e.title,
                "percentage": e.percentage,
                "created_at": e.created_at.isoformat(),
            }
            for e in evaluations
        ],
        "total_evaluations": len(evaluations),
        "avg_score": round(sum(e.percentage for e in evaluations) / max(len(evaluations), 1), 1),
    }
