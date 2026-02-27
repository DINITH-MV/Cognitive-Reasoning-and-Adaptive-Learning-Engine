"""
CRACLE - Planner Agent
Analyzes user goals and constraints, breaks objectives into milestones,
and picks the next learning activity.
"""

import json
import uuid
from typing import Any, Dict, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.agents.base import BaseAgent
from app.models.user import CognitiveProfile
from app.models.course import LearningPath, Milestone, DifficultyLevel, ContentType

PLANNER_SYSTEM_PROMPT = """You are the Planner Agent in the CRACLE learning system (Cognitive Reasoning and Adaptive Learning Engine).

Your responsibilities:
1. Analyze the learner's goals, constraints (time, skill level, target outcome), and cognitive profile.
2. Break long-term learning objectives into actionable milestones with clear deliverables.
3. Recommend the next course, scenario, simulation, or micro-challenge.
4. Adapt the plan based on evaluation feedback (knowledge gaps, performance trends).

When creating a learning plan, output valid JSON with this structure:
{
  "learning_path": {
    "title": "...",
    "goal": "...",
    "estimated_weeks": N,
    "difficulty": "beginner|intermediate|advanced|expert"
  },
  "milestones": [
    {
      "title": "...",
      "description": "...",
      "order": 1,
      "content_type": "course|module|lesson|quiz|simulation|micro_challenge|video|project",
      "estimated_hours": N,
      "skills_targeted": ["..."]
    }
  ],
  "next_action": {
    "type": "...",
    "title": "...",
    "rationale": "..."
  }
}

Consider:
- The learner's current knowledge gaps and strengths from their cognitive profile
- Time constraints and preferred difficulty
- A progressive difficulty curve
- Mix of theory (courses/lessons) and practice (simulations/projects/challenges)
- Regular assessment checkpoints
"""


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="planner", system_prompt=PLANNER_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Create or update a learning plan based on user goals and profile.

        Context should include:
        - user_id: UUID
        - goal: str (what the user wants to learn)
        - time_available_hours: int (weekly hours available)
        - skill_level: str
        - target_outcome: str (certification, job role, skill mastery, etc.)
        - cognitive_profile: dict (optional, from Evaluator Agent)
        - evaluation_feedback: dict (optional, recent performance data)
        """
        user_id = context["user_id"]
        goal = context["goal"]

        # Build the prompt with user context
        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Create a personalized learning plan",
                    "learner_goal": goal,
                    "time_available_hours_per_week": context.get("time_available_hours", 10),
                    "current_skill_level": context.get("skill_level", "beginner"),
                    "target_outcome": context.get("target_outcome", "skill mastery"),
                    "cognitive_profile": context.get("cognitive_profile", {}),
                    "evaluation_feedback": context.get("evaluation_feedback", {}),
                    "existing_strengths": context.get("strengths", []),
                    "knowledge_gaps": context.get("knowledge_gaps", []),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        plan_data = json.loads(result["content"])

        # Persist the learning path
        learning_path = LearningPath(
            user_id=user_id,
            title=plan_data["learning_path"]["title"],
            goal=goal,
            skill_level=DifficultyLevel(plan_data["learning_path"].get("difficulty", "beginner")),
            milestones=plan_data["milestones"],
        )
        db.add(learning_path)
        await db.flush()

        # Create milestone records
        for i, ms in enumerate(plan_data.get("milestones", [])):
            milestone = Milestone(
                learning_path_id=learning_path.id,
                title=ms["title"],
                description=ms.get("description", ""),
                order=ms.get("order", i + 1),
                content_type=ContentType(ms.get("content_type", "lesson")),
            )
            db.add(milestone)

        await db.flush()

        # Log interaction
        await self.log_interaction(
            db=db,
            action="create_learning_plan",
            input_data=context,
            output_data=plan_data,
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "learning_path_id": str(learning_path.id),
            "plan": plan_data,
            "next_action": plan_data.get("next_action"),
            "usage": result["usage"],
        }

    async def get_next_activity(self, user_id: uuid.UUID, learning_path_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Determine the next best activity for the user based on progress and evaluations."""

        # Fetch current path and pending milestones
        path = await db.get(LearningPath, learning_path_id)
        if not path:
            return {"error": "Learning path not found"}

        milestones_result = await db.execute(
            select(Milestone)
            .where(Milestone.learning_path_id == learning_path_id)
            .where(Milestone.status == "pending")
            .order_by(Milestone.order)
        )
        pending = milestones_result.scalars().all()

        if not pending:
            return {"status": "completed", "message": "All milestones completed!"}

        # Get cognitive profile for adaptive selection
        profile_result = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Select the next best learning activity",
                    "learning_goal": path.goal,
                    "pending_milestones": [
                        {"title": m.title, "description": m.description, "type": m.content_type.value, "order": m.order}
                        for m in pending[:5]
                    ],
                    "cognitive_profile": {
                        "risk_tolerance": profile.risk_tolerance if profile else 0.5,
                        "learning_speed": profile.learning_speed if profile else 0.5,
                        "knowledge_gaps": profile.knowledge_gaps if profile else [],
                    } if profile else {},
                    "current_progress": path.progress_pct,
                }),
            }
        ]

        result = await self.call_llm(messages=messages, temperature=0.5, response_format={"type": "json_object"})
        recommendation = json.loads(result["content"])

        await self.log_interaction(
            db=db,
            action="get_next_activity",
            input_data={"user_id": str(user_id), "path_id": str(learning_path_id)},
            output_data=recommendation,
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return recommendation
