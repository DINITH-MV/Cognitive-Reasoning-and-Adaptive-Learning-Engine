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
from app.agents.memory import MemoryAgent
from app.api.routes.reasoning import emit_reasoning_step

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
        self.memory = MemoryAgent()
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
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full workflow: Memory provides context → Planner creates a plan → 
        Content Generator prepares the first module.
        """
        self.logger.info("Creating learning plan", user_id=str(user_id), goal=goal)

        # Step 0: Get memory context for the planner
        if session_id:
            await emit_reasoning_step(
                session_id,
                "orchestrator",
                "thinking",
                "Analyzing user's learning history and cognitive profile...",
            )
        
        memory_context = await self.memory.get_learning_context_for_planner(user_id, db)
        
        if session_id:
            await emit_reasoning_step(
                session_id,
                "memory",
                "completed",
                f"Retrieved context: {len(memory_context.get('recent_evaluations', []))} recent evaluations, cognitive traits analyzed.",
                {"progress": 20},
            )

        # Step 1: Planner creates the learning path with memory context
        if session_id:
            await emit_reasoning_step(
                session_id,
                "planner",
                "thinking",
                f"Designing personalized learning path for '{goal}' at {skill_level} level...",
            )
        
        plan_result = await self.planner.execute(
            context={
                "user_id": user_id,
                "goal": goal,
                "skill_level": skill_level,
                "time_available_hours": time_available_hours,
                "target_outcome": target_outcome,
                "memory_context": memory_context.get("contextual_memory", {}),
            },
            db=db,
        )
        
        if session_id:
            await emit_reasoning_step(
                session_id,
                "planner",
                "completed",
                f"Learning path created with {len(plan_result.get('plan', {}).get('learning_path', {}).get('modules', []))} modules.",
                {"progress": 60},
            )

        # Step 2: Generate content for the first milestone
        next_action = plan_result.get("next_action", {})
        first_content = None
        if next_action:
            if session_id:
                await emit_reasoning_step(
                    session_id,
                    "content_generator",
                    "executing",
                    f"Generating first lesson: '{next_action.get('title', goal)}'...",
                )
            
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
            
            if session_id:
                await emit_reasoning_step(
                    session_id,
                    "content_generator",
                    "completed",
                    "First lesson content generated successfully!",
                    {"progress": 100},
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
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Chat with the mentor agent with memory context."""
        # Get memory context for personalized guidance
        if session_id:
            await emit_reasoning_step(
                session_id,
                "memory",
                "thinking",
                "Retrieving your learning history and preferences...",
            )
        
        memory_context = await self.memory.get_guidance_context_for_mentor(user_id, db)
        
        if session_id:
            await emit_reasoning_step(
                session_id,
                "memory",
                "completed",
                "Context loaded: analyzing your strengths and learning patterns.",
                {"progress": 30},
            )
            await emit_reasoning_step(
                session_id,
                "mentor",
                "thinking",
                "Crafting personalized guidance based on your profile...",
            )
        
        result = await self.mentor.execute(
            context={
                "user_id": user_id,
                "message": message,
                "conversation_history": conversation_history or [],
                "memory_context": memory_context.get("contextual_memory", {}),
            },
            db=db,
        )
        
        if session_id:
            await emit_reasoning_step(
                session_id,
                "mentor",
                "completed",
                "Response generated with personalized insights.",
                {"progress": 100},
            )
        
        return result

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

    # ── Memory Operations ──────────────────────────

    async def get_user_memory_summary(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Get comprehensive memory summary for a user."""
        return await self.memory.execute(
            context={"action": "summary", "user_id": user_id},
            db=db,
        )

    async def retrieve_user_memories(
        self,
        user_id: uuid.UUID,
        query_type: str,
        db: AsyncSession,
        filters: dict = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """Retrieve specific user memories."""
        return await self.memory.execute(
            context={
                "action": "retrieve",
                "user_id": user_id,
                "query_type": query_type,
                "filters": filters or {},
                "limit": limit,
            },
            db=db,
        )

    async def track_user_evolution(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Track cognitive evolution over time."""
        return await self.memory.execute(
            context={"action": "track_evolution", "user_id": user_id},
            db=db,
        )


# Singleton instance
orchestrator = AgentOrchestrator()
