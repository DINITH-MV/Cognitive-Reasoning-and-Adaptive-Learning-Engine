"""
CRACLE - Agent interaction routes (Mentor chat, evaluations)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.api.schemas import MentorChatRequest, SubmitQuizRequest
from app.api.auth_utils import get_current_user
from app.agents.orchestrator import orchestrator

router = APIRouter()


@router.post("/mentor/chat")
async def chat_with_mentor(
    data: MentorChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chat with the AI mentor for guidance, explanations, and support."""
    result = await orchestrator.chat_with_mentor(
        user_id=user.id,
        message=data.message,
        conversation_history=data.conversation_history,
        db=db,
    )
    return result


@router.post("/evaluate/quiz")
async def evaluate_quiz(
    data: SubmitQuizRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit quiz answers for AI evaluation and cognitive profiling."""
    result = await orchestrator.evaluate_and_adapt(
        user_id=user.id,
        eval_type="quiz",
        eval_data={
            "quiz_data": data.quiz_data,
            "answers": data.answers,
            "time_spent_seconds": data.time_spent_seconds,
        },
        db=db,
    )
    return result


@router.post("/evaluate/simulation/{session_id}")
async def evaluate_simulation(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate a completed simulation session."""
    result = await orchestrator.evaluate_and_adapt(
        user_id=user.id,
        eval_type="simulation",
        eval_data={"session_id": session_id},
        db=db,
    )
    return result


@router.get("/profile/cognitive")
async def get_cognitive_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's cognitive profile built by the Evaluator Agent."""
    from sqlalchemy import select
    from app.models.user import CognitiveProfile

    result = await db.execute(
        select(CognitiveProfile).where(CognitiveProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return {"message": "No cognitive profile yet. Complete some activities to build your profile."}

    return {
        "risk_tolerance": profile.risk_tolerance,
        "planning_skill": profile.planning_skill,
        "analytical_thinking": profile.analytical_thinking,
        "creative_thinking": profile.creative_thinking,
        "attention_to_detail": profile.attention_to_detail,
        "collaboration_skill": profile.collaboration_skill,
        "learning_speed": profile.learning_speed,
        "retention_rate": profile.retention_rate,
        "knowledge_gaps": profile.knowledge_gaps,
        "strengths": profile.strengths,
        "preferred_style": profile.preferred_style,
        "difficulty_preference": profile.difficulty_preference,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }
