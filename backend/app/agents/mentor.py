"""
CRACLE - Mentor Agent
Provides natural language guidance, suggests next steps, explanations,
or deeper study. Uses insights from Evaluator and Planner Agents.
"""

import json
import uuid
from typing import Any, Dict, List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.agents.base import BaseAgent
from app.models.user import CognitiveProfile
from app.models.evaluation import Evaluation
from app.models.course import LearningPath

MENTOR_SYSTEM_PROMPT = """You are the Mentor Agent in the CRACLE learning system - a supportive, knowledgeable guide.

Your responsibilities:
1. Provide clear, encouraging guidance in natural conversational language.
2. Explain concepts the learner is struggling with using analogies and examples.
3. Suggest next steps based on learning progress and evaluation results.
4. Motivate learners through difficulties and celebrate achievements.
5. Synthesize insights from the Evaluator Agent (cognitive profile) and Planner Agent (learning path).

Communication style:
- Warm but professional
- Use analogies and real-world examples
- Break complex topics into digestible parts
- Ask reflective questions to deepen understanding
- Adapt language complexity to learner level
- Be specific in recommendations - avoid generic advice

When giving guidance, consider:
- The learner's current position in their learning path
- Recent evaluation results and identified gaps
- Cognitive profile (learning speed, preferred style, strengths)
- Emotional context (frustration, confusion, excitement)

Always structure your response as JSON:
{
  "message": "Your natural language response to the learner...",
  "suggestions": [
    {"type": "review|practice|explore|rest|challenge", "description": "...", "priority": "high|medium|low"}
  ],
  "encouragement": "A brief motivational note...",
  "concepts_explained": ["List of concepts you explained"],
  "follow_up_questions": ["Reflective questions for the learner"]
}
"""


class MentorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="mentor", system_prompt=MENTOR_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Provide mentoring guidance.

        Context:
        - user_id: UUID
        - message: str (the learner's question or concern)
        - conversation_history: list (optional, previous messages)
        - include_profile: bool (whether to fetch cognitive profile)
        - include_progress: bool (whether to fetch learning progress)
        """
        user_id = context["user_id"]
        user_message = context["message"]

        # Gather learner context
        learner_context = await self._gather_learner_context(user_id, db)

        # Build conversation
        conversation = context.get("conversation_history", [])
        conversation.append({
            "role": "user",
            "content": json.dumps({
                "learner_message": user_message,
                "learner_context": learner_context,
            }),
        })

        result = await self.call_llm(
            messages=conversation,
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        response_data = json.loads(result["content"])

        await self.log_interaction(
            db=db,
            action="mentor_guidance",
            input_data={"message_preview": user_message[:100]},
            output_data={"suggestions_count": len(response_data.get("suggestions", []))},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "response": response_data,
            "usage": result["usage"],
        }

    async def _gather_learner_context(self, user_id: uuid.UUID, db: AsyncSession) -> dict:
        """Collect relevant learner information for contextualized mentoring."""
        context = {}

        # Cognitive profile
        profile_result = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            context["cognitive_profile"] = {
                "risk_tolerance": profile.risk_tolerance,
                "planning_skill": profile.planning_skill,
                "analytical_thinking": profile.analytical_thinking,
                "creative_thinking": profile.creative_thinking,
                "learning_speed": profile.learning_speed,
                "retention_rate": profile.retention_rate,
                "knowledge_gaps": profile.knowledge_gaps or [],
                "strengths": profile.strengths or [],
                "preferred_style": profile.preferred_style,
            }

        # Recent evaluations
        eval_result = await db.execute(
            select(Evaluation)
            .where(Evaluation.user_id == user_id)
            .order_by(desc(Evaluation.created_at))
            .limit(5)
        )
        recent_evals = eval_result.scalars().all()
        if recent_evals:
            context["recent_performance"] = [
                {
                    "type": e.evaluation_type.value,
                    "title": e.title,
                    "percentage": e.percentage,
                    "feedback": e.feedback[:200] if e.feedback else None,
                    "date": e.created_at.isoformat(),
                }
                for e in recent_evals
            ]

        # Active learning path
        path_result = await db.execute(
            select(LearningPath)
            .where(LearningPath.user_id == user_id)
            .where(LearningPath.status == "active")
            .order_by(desc(LearningPath.updated_at))
            .limit(1)
        )
        path = path_result.scalar_one_or_none()
        if path:
            context["learning_path"] = {
                "title": path.title,
                "goal": path.goal,
                "progress": path.progress_pct,
                "skill_level": path.skill_level.value,
            }

        return context

    async def explain_concept(self, concept: str, user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Ask the mentor to explain a specific concept."""
        return await self.execute(
            context={
                "user_id": user_id,
                "message": f"Can you explain this concept to me: {concept}",
            },
            db=db,
        )

    async def get_encouragement(self, user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Get motivational guidance based on recent progress."""
        return await self.execute(
            context={
                "user_id": user_id,
                "message": "I need some encouragement and guidance on what to do next.",
            },
            db=db,
        )
