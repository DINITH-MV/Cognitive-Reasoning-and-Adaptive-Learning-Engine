"""
CRACLE - Simulation routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.simulation import SimulationSession
from app.api.schemas import StartSimulationRequest, SimulationDecisionRequest
from app.api.auth_utils import get_current_user
from app.agents.orchestrator import orchestrator

router = APIRouter()


@router.post("/start")
async def start_simulation(
    data: StartSimulationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new scenario-based simulation."""
    result = await orchestrator.start_simulation(
        user_id=user.id,
        topic=data.topic,
        category=data.category,
        difficulty=data.difficulty,
        db=db,
    )
    return result


@router.post("/decide")
async def make_decision(
    data: SimulationDecisionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Make a decision in an active simulation."""
    result = await orchestrator.make_simulation_decision(
        user_id=user.id,
        session_id=data.session_id,
        decision=data.decision,
        reasoning=data.reasoning,
        db=db,
    )
    return result


@router.get("/sessions")
async def list_simulation_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status: str = None,
):
    """List user's simulation sessions."""
    query = select(SimulationSession).where(SimulationSession.user_id == user.id)
    if status:
        query = query.where(SimulationSession.status == status)
    query = query.order_by(SimulationSession.started_at.desc())

    result = await db.execute(query)
    sessions = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "status": s.status,
            "turn_count": s.turn_count,
            "score": s.score,
            "started_at": s.started_at.isoformat(),
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in sessions
    ]


@router.get("/session/{session_id}")
async def get_simulation_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific simulation session."""
    import uuid

    session = await db.get(SimulationSession, uuid.UUID(session_id))
    if not session or session.user_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "title": session.title,
        "status": session.status,
        "current_state": session.current_state,
        "turn_count": session.turn_count,
        "score": session.score,
        "started_at": session.started_at.isoformat(),
    }
