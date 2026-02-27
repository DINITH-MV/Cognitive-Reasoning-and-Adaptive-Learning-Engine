"""
CRACLE - Learning path and content routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.course import LearningPath, Course
from app.api.schemas import (
    CreateLearningPlanRequest,
    GenerateContentRequest,
    ContentResponse,
)
from app.api.auth_utils import get_current_user
from app.agents.orchestrator import orchestrator

router = APIRouter()


@router.post("/plan")
async def create_learning_plan(
    data: CreateLearningPlanRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a personalized learning plan using the Planner + Content Generator agents."""
    result = await orchestrator.create_learning_plan(
        user_id=user.id,
        goal=data.goal,
        skill_level=data.skill_level,
        time_available_hours=data.time_available_hours,
        target_outcome=data.target_outcome,
        db=db,
    )
    return result


@router.get("/plan/{path_id}/next")
async def get_next_activity(
    path_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the next recommended learning activity."""
    return await orchestrator.get_next_activity(user.id, path_id, db)


@router.get("/paths")
async def list_learning_paths(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all learning paths for the current user."""
    result = await db.execute(
        select(LearningPath)
        .where(LearningPath.user_id == user.id)
        .order_by(LearningPath.updated_at.desc())
    )
    paths = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "goal": p.goal,
            "status": p.status,
            "progress_pct": p.progress_pct,
            "skill_level": p.skill_level.value,
            "created_at": p.created_at.isoformat(),
        }
        for p in paths
    ]


@router.post("/content/generate", response_model=ContentResponse)
async def generate_content(
    data: GenerateContentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate learning content on demand."""
    return await orchestrator.generate_content(
        topic=data.topic,
        content_type=data.content_type,
        difficulty=data.difficulty,
        db=db,
        user_id=user.id,
        learning_objectives=data.learning_objectives,
        duration_minutes=data.duration_minutes,
        instructions=data.instructions,
    )


@router.get("/courses")
async def list_courses(
    db: AsyncSession = Depends(get_db),
    category: str = None,
    difficulty: str = None,
):
    """List available courses with optional filtering."""
    query = select(Course)
    if category:
        query = query.where(Course.category == category)
    if difficulty:
        query = query.where(Course.difficulty == difficulty)
    query = query.order_by(Course.created_at.desc())

    result = await db.execute(query)
    courses = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "difficulty": c.difficulty.value,
            "estimated_hours": c.estimated_hours,
            "tags": c.tags,
            "is_ai_generated": c.is_ai_generated,
        }
        for c in courses
    ]
