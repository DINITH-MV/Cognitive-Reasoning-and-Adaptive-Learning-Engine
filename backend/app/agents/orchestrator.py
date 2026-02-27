"""
CRACLE - Agent Orchestrator
Coordinates interactions between all agents, manages agent lifecycle,
and provides a unified interface for the API layer.
"""

import uuid
from typing import Any, Dict, Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.planner import PlannerAgent
from app.agents.content_generator import ContentGeneratorAgent
from app.agents.simulation import SimulationAgent
from app.agents.evaluator import EvaluatorAgent
from app.agents.mentor import MentorAgent

logger = structlog.get_logger(__name__)


class AgentOrchestrator:
    """
    Central coordinator for all CRACLE agents.
    Manages agent-to-agent communication and workflow orchestration.
    """

    def __init__(self):
        self.planner = PlannerAgent()
        self.content_generator = ContentGeneratorAgent()
        self.simulation = SimulationAgent()
        self.evaluator = EvaluatorAgent()
        self.mentor = MentorAgent()
        self.logger = logger.bind(component="orchestrator")

    # ── Learning Path Workflows ──────────────────────────

    async def create_learning_plan(
        self,
        user_id: uuid.UUID,
        goal: str,
        skill_level: str,
        time_available_hours: int,
        target_outcome: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Full workflow: Planner creates a plan, then Content Generator
        prepares the first module.
        """
        self.logger.info("Creating learning plan", user_id=str(user_id), goal=goal)

        # Step 1: Planner creates the learning path
        plan_result = await self.planner.execute(
            context={
                "user_id": user_id,
                "goal": goal,
                "skill_level": skill_level,
                "time_available_hours": time_available_hours,
                "target_outcome": target_outcome,
            },
            db=db,
        )

        # Step 2: Generate content for the first milestone
        next_action = plan_result.get("next_action", {})
        first_content = None
        if next_action:
            first_content = await self.content_generator.execute(
                context={
                    "content_type": next_action.get("type", "lesson"),
                    "topic": next_action.get("title", goal),
                    "difficulty": skill_level,
                    "learning_objectives": plan_result["plan"].get("learning_path", {}).get("learning_objectives", []),
                    "user_id": user_id,
                },
                db=db,
            )

        return {
            "learning_path": plan_result,
            "first_content": first_content,
        }

    async def get_next_activity(
        self,
        user_id: uuid.UUID,
        learning_path_id: uuid.UUID,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Get and prepare the next learning activity."""
        recommendation = await self.planner.get_next_activity(user_id, learning_path_id, db)

        # Auto-generate content if needed
        if recommendation.get("generate_content"):
            content = await self.content_generator.execute(
                context={
                    "content_type": recommendation.get("content_type", "lesson"),
                    "topic": recommendation.get("topic", ""),
                    "difficulty": recommendation.get("difficulty", "intermediate"),
                    "user_id": user_id,
                },
                db=db,
            )
            recommendation["generated_content"] = content

        return recommendation

    # ── Evaluation Workflows ──────────────────────────

    async def evaluate_and_adapt(
        self,
        user_id: uuid.UUID,
        eval_type: str,
        eval_data: dict,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Full workflow: Evaluator scores → Mentor provides feedback →
        Planner adapts the learning path.
        """
        self.logger.info("Evaluating and adapting", user_id=str(user_id), eval_type=eval_type)

        # Step 1: Evaluate performance
        eval_result = await self.evaluator.execute(
            context={"eval_type": eval_type, "user_id": user_id, **eval_data},
            db=db,
        )

        # Step 2: Mentor generates personalized feedback
        mentor_response = await self.mentor.execute(
            context={
                "user_id": user_id,
                "message": f"I just completed a {eval_type}. My score was {eval_result['results'].get('evaluation', {}).get('percentage', 'N/A')}%. Can you help me understand my results and what to focus on next?",
            },
            db=db,
        )

        return {
            "evaluation": eval_result,
            "mentor_feedback": mentor_response,
        }

    # ── Simulation Workflows ──────────────────────────

    async def start_simulation(
        self,
        user_id: uuid.UUID,
        topic: str,
        category: str,
        difficulty: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Start a new simulation scenario."""
        return await self.simulation.execute(
            context={
                "action": "create",
                "user_id": user_id,
                "topic": topic,
                "category": category,
                "difficulty": difficulty,
            },
            db=db,
        )

    async def make_simulation_decision(
        self,
        user_id: uuid.UUID,
        session_id: str,
        decision: str,
        reasoning: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Process a decision in an active simulation."""
        result = await self.simulation.execute(
            context={
                "action": "decide",
                "user_id": user_id,
                "session_id": session_id,
                "decision": decision,
                "reasoning": reasoning,
            },
            db=db,
        )

        # If simulation completed, auto-evaluate
        if result.get("session_status") == "completed":
            eval_result = await self.evaluator.execute(
                context={
                    "eval_type": "simulation",
                    "user_id": user_id,
                    "session_id": session_id,
                },
                db=db,
            )
            result["evaluation"] = eval_result

        return result

    # ── Mentor Workflows ──────────────────────────

    async def chat_with_mentor(
        self,
        user_id: uuid.UUID,
        message: str,
        conversation_history: list = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """Chat with the mentor agent."""
        return await self.mentor.execute(
            context={
                "user_id": user_id,
                "message": message,
                "conversation_history": conversation_history or [],
            },
            db=db,
        )

    # ── Content Generation ──────────────────────────

    async def generate_content(
        self,
        topic: str,
        content_type: str,
        difficulty: str,
        db: AsyncSession,
        user_id: uuid.UUID = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate learning content on demand."""
        return await self.content_generator.execute(
            context={
                "content_type": content_type,
                "topic": topic,
                "difficulty": difficulty,
                "user_id": user_id,
                **kwargs,
            },
            db=db,
        )


# Singleton instance
orchestrator = AgentOrchestrator()
