"""
CRACLE - Memory Agent
Stores user progress, scenario history, and skill profile.
Tracks evolution over time and supports adaptive decision-making
and personalized learning paths.
"""

import json
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_

from app.agents.base import BaseAgent
from app.models.user import User, CognitiveProfile
from app.models.evaluation import Evaluation, AgentInteraction
from app.models.course import LearningPath, Milestone
from app.models.simulation import SimulationSession, SimulationDecision

MEMORY_SYSTEM_PROMPT = """You are the Memory Agent in the CRACLE learning system.

Your responsibilities:
1. Store and retrieve user progress, learning history, and skill profiles.
2. Track cognitive evolution over time and identify trends.
3. Provide intelligent memory retrieval for other agents (context-aware summaries).
4. Support adaptive decision-making by surfacing relevant past experiences.
5. Manage both short-term (recent activities) and long-term (overall patterns) memory.
6. Identify significant learning milestones and turning points.

When providing MEMORY SUMMARY, output JSON:
{
  "user_profile": {
    "user_id": "...",
    "total_learning_hours": N,
    "days_active": N,
    "current_level": "...",
    "recent_activity": "..."
  },
  "cognitive_evolution": {
    "initial_state": {...},
    "current_state": {...},
    "improvements": ["..."],
    "areas_needing_focus": ["..."],
    "trend_analysis": "..."
  },
  "learning_history": {
    "completed_courses": N,
    "completed_milestones": N,
    "total_evaluations": N,
    "average_performance": N,
    "simulation_sessions": N,
    "decision_patterns": [...]
  },
  "relevant_past_experiences": [
    {
      "type": "quiz|simulation|milestone",
      "title": "...",
      "date": "...",
      "outcome": "...",
      "relevance": "Why this is relevant now..."
    }
  ],
  "recommendations_for_agents": {
    "planner": ["..."],
    "content_generator": ["..."],
    "evaluator": ["..."],
    "mentor": ["..."]
  },
  "learning_velocity": {
    "recent_pace": "fast|steady|slow",
    "consistency": "high|medium|low",
    "engagement_trend": "increasing|stable|decreasing"
  }
}

When providing CONTEXT for other agents, be concise but comprehensive.
Focus on information that directly impacts the current learning objective.

Always:
- Prioritize recent data for short-term context
- Use aggregated patterns for long-term insights
- Identify anomalies and significant changes
- Provide actionable insights rather than raw data
"""


class MemoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="memory", system_prompt=MEMORY_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Execute memory operations.

        Context:
        - action: "summary" | "retrieve" | "track_evolution" | "get_context"
        - user_id: UUID
        - For retrieve: query_type, filters, limit
        - For get_context: purpose, target_agent
        """
        action = context.get("action", "summary")
        user_id = context["user_id"]

        if action == "summary":
            return await self._generate_comprehensive_summary(user_id, db)
        elif action == "retrieve":
            return await self._retrieve_memories(user_id, context, db)
        elif action == "track_evolution":
            return await self._track_cognitive_evolution(user_id, db)
        elif action == "get_context":
            return await self._get_contextual_memory(user_id, context, db)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _generate_comprehensive_summary(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Generate a comprehensive memory summary for the user."""
        
        # Gather all user data
        user_data = await self._collect_user_data(user_id, db)
        
        # Build AI prompt
        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Generate a comprehensive memory summary",
                    "user_data": user_data,
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        memory_summary = json.loads(result["content"])

        await self.log_interaction(
            db=db,
            user_id=user_id,
            action="generate_summary",
            input_data={"user_id": str(user_id)},
            output_data={"summary_keys": list(memory_summary.keys())},
        )

        return {
            "status": "success",
            "memory_summary": memory_summary,
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def _retrieve_memories(
        self, user_id: uuid.UUID, context: Dict[str, Any], db: AsyncSession
    ) -> Dict[str, Any]:
        """Retrieve specific memories based on query parameters."""
        
        query_type = context.get("query_type", "recent")
        limit = context.get("limit", 10)
        filters = context.get("filters", {})

        memories = {}

        if query_type in ["recent", "all"]:
            memories["recent_evaluations"] = await self._get_recent_evaluations(user_id, db, limit)
            memories["recent_simulations"] = await self._get_recent_simulations(user_id, db, limit)
            memories["recent_milestones"] = await self._get_recent_milestones(user_id, db, limit)

        if query_type in ["patterns", "all"]:
            memories["decision_patterns"] = await self._analyze_decision_patterns(user_id, db)
            memories["performance_trends"] = await self._analyze_performance_trends(user_id, db)

        if query_type in ["cognitive", "all"]:
            memories["cognitive_profile"] = await self._get_cognitive_profile(user_id, db)
            memories["skill_evolution"] = await self._track_skill_evolution(user_id, db)

        await self.log_interaction(
            db=db,
            user_id=user_id,
            action="retrieve_memories",
            input_data={"query_type": query_type, "filters": filters},
            output_data={"memory_types": list(memories.keys())},
        )

        return {
            "status": "success",
            "memories": memories,
            "query_type": query_type,
        }

    async def _track_cognitive_evolution(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Track how the user's cognitive profile has evolved over time."""
        
        # Get historical cognitive profile snapshots from evaluations
        stmt = select(Evaluation).where(
            Evaluation.user_id == user_id
        ).order_by(Evaluation.created_at)
        
        result = await db.execute(stmt)
        evaluations = result.scalars().all()

        # Extract cognitive metrics over time
        evolution_timeline = []
        for eval in evaluations:
            if eval.cognitive_analysis:
                evolution_timeline.append({
                    "date": eval.created_at.isoformat(),
                    "type": eval.evaluation_type.value,
                    "metrics": eval.cognitive_analysis,
                    "score": eval.percentage,
                })

        # Get current cognitive profile
        current_profile = await self._get_cognitive_profile(user_id, db)

        # Use AI to analyze evolution
        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Analyze cognitive evolution",
                    "evolution_timeline": evolution_timeline[-20:],  # Last 20 evaluations
                    "current_profile": current_profile,
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        evolution_analysis = json.loads(result["content"])

        await self.log_interaction(
            db=db,
            user_id=user_id,
            action="track_evolution",
            input_data={"timeline_size": len(evolution_timeline)},
            output_data={"analysis_keys": list(evolution_analysis.keys())},
        )

        return {
            "status": "success",
            "evolution_analysis": evolution_analysis,
            "data_points": len(evolution_timeline),
        }

    async def _get_contextual_memory(
        self, user_id: uuid.UUID, context: Dict[str, Any], db: AsyncSession
    ) -> Dict[str, Any]:
        """Get memory context tailored for a specific agent's needs."""
        
        purpose = context.get("purpose", "general")
        target_agent = context.get("target_agent", "unknown")

        # Collect relevant data based on purpose
        user_data = await self._collect_user_data(user_id, db)

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": f"Provide memory context for {target_agent} agent",
                    "purpose": purpose,
                    "user_data": user_data,
                    "focus": context.get("focus", "recent_performance"),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        contextual_memory = json.loads(result["content"])

        await self.log_interaction(
            db=db,
            user_id=user_id,
            action="get_contextual_memory",
            input_data={"target_agent": target_agent, "purpose": purpose},
            output_data={"context_keys": list(contextual_memory.keys())},
        )

        return {
            "status": "success",
            "contextual_memory": contextual_memory,
            "target_agent": target_agent,
        }

    # ── Helper Methods ──────────────────────────────────────

    async def _collect_user_data(self, user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Collect comprehensive user data from database."""
        
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            return {"error": "User not found"}

        # Get cognitive profile
        cognitive_profile = await self._get_cognitive_profile(user_id, db)

        # Get learning paths
        paths_stmt = select(LearningPath).where(LearningPath.user_id == user_id)
        paths_result = await db.execute(paths_stmt)
        learning_paths = paths_result.scalars().all()

        # Get evaluations summary
        eval_stmt = select(
            func.count(Evaluation.id).label("total"),
            func.avg(Evaluation.percentage).label("avg_score")
        ).where(Evaluation.user_id == user_id)
        eval_result = await db.execute(eval_stmt)
        eval_stats = eval_result.one()

        # Get recent evaluations
        recent_evals = await self._get_recent_evaluations(user_id, db, 5)

        # Get simulation stats
        sim_stmt = select(func.count(SimulationSession.id)).where(
            SimulationSession.user_id == user_id
        )
        sim_result = await db.execute(sim_stmt)
        sim_count = sim_result.scalar()

        # Get recent agent interactions
        interactions_stmt = select(AgentInteraction).where(
            AgentInteraction.user_id == user_id
        ).order_by(desc(AgentInteraction.created_at)).limit(10)
        interactions_result = await db.execute(interactions_stmt)
        recent_interactions = interactions_result.scalars().all()

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "created_at": user.created_at.isoformat(),
            },
            "cognitive_profile": cognitive_profile,
            "learning_paths": [
                {
                    "id": str(path.id),
                    "title": path.title,
                    "goal": path.goal,
                    "status": path.status,
                    "progress_pct": path.progress_pct,
                    "created_at": path.created_at.isoformat(),
                }
                for path in learning_paths
            ],
            "evaluation_stats": {
                "total_evaluations": eval_stats.total or 0,
                "average_score": float(eval_stats.avg_score) if eval_stats.avg_score else 0.0,
            },
            "recent_evaluations": recent_evals,
            "simulation_count": sim_count or 0,
            "recent_interactions": [
                {
                    "agent": interaction.agent_name,
                    "action": interaction.action,
                    "status": interaction.status,
                    "created_at": interaction.created_at.isoformat(),
                }
                for interaction in recent_interactions
            ],
        }

    async def _get_cognitive_profile(self, user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Retrieve cognitive profile."""
        stmt = select(CognitiveProfile).where(CognitiveProfile.user_id == user_id)
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            return {}

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
            "updated_at": profile.updated_at.isoformat(),
        }

    async def _get_recent_evaluations(
        self, user_id: uuid.UUID, db: AsyncSession, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent evaluations."""
        stmt = select(Evaluation).where(
            Evaluation.user_id == user_id
        ).order_by(desc(Evaluation.created_at)).limit(limit)
        
        result = await db.execute(stmt)
        evaluations = result.scalars().all()

        return [
            {
                "id": str(eval.id),
                "type": eval.evaluation_type.value,
                "title": eval.title,
                "score": eval.score,
                "percentage": eval.percentage,
                "created_at": eval.created_at.isoformat(),
            }
            for eval in evaluations
        ]

    async def _get_recent_simulations(
        self, user_id: uuid.UUID, db: AsyncSession, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent simulation sessions."""
        stmt = select(SimulationSession).where(
            SimulationSession.user_id == user_id
        ).order_by(desc(SimulationSession.created_at)).limit(limit)
        
        result = await db.execute(stmt)
        sessions = result.scalars().all()

        return [
            {
                "id": str(session.id),
                "category": session.category,
                "status": session.status,
                "score": session.score,
                "created_at": session.created_at.isoformat(),
            }
            for session in sessions
        ]

    async def _get_recent_milestones(
        self, user_id: uuid.UUID, db: AsyncSession, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent completed milestones."""
        stmt = select(Milestone).join(LearningPath).where(
            and_(
                LearningPath.user_id == user_id,
                Milestone.status == "completed"
            )
        ).order_by(desc(Milestone.completed_at)).limit(limit)
        
        result = await db.execute(stmt)
        milestones = result.scalars().all()

        return [
            {
                "id": str(milestone.id),
                "title": milestone.title,
                "content_type": milestone.content_type.value,
                "completed_at": milestone.completed_at.isoformat() if milestone.completed_at else None,
            }
            for milestone in milestones
        ]

    async def _analyze_decision_patterns(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Analyze patterns in simulation decisions."""
        stmt = select(SimulationDecision).join(SimulationSession).where(
            SimulationSession.user_id == user_id
        ).order_by(desc(SimulationDecision.created_at)).limit(50)
        
        result = await db.execute(stmt)
        decisions = result.scalars().all()

        if not decisions:
            return {"no_data": True}

        # Calculate patterns
        risk_levels = [d.data.get("risk_level") for d in decisions if d.data.get("risk_level")]
        decision_speeds = [d.data.get("decision_speed") for d in decisions if d.data.get("decision_speed")]

        return {
            "total_decisions": len(decisions),
            "risk_distribution": {
                "low": risk_levels.count("low"),
                "medium": risk_levels.count("medium"),
                "high": risk_levels.count("high"),
            },
            "speed_distribution": {
                "impulsive": decision_speeds.count("impulsive"),
                "measured": decision_speeds.count("measured"),
                "cautious": decision_speeds.count("cautious"),
            },
        }

    async def _analyze_performance_trends(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Analyze performance trends over time."""
        # Get evaluations from last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        stmt = select(Evaluation).where(
            and_(
                Evaluation.user_id == user_id,
                Evaluation.created_at >= thirty_days_ago
            )
        ).order_by(Evaluation.created_at)
        
        result = await db.execute(stmt)
        evaluations = result.scalars().all()

        if not evaluations:
            return {"no_data": True}

        scores = [e.percentage for e in evaluations]
        
        return {
            "total_evaluations": len(evaluations),
            "average_score": sum(scores) / len(scores),
            "min_score": min(scores),
            "max_score": max(scores),
            "trend": "improving" if len(scores) > 1 and scores[-1] > scores[0] else "stable",
            "recent_scores": scores[-5:],
        }

    async def _track_skill_evolution(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Track how skills have evolved based on cognitive profile changes."""
        # Get current profile
        current = await self._get_cognitive_profile(user_id, db)
        
        if not current:
            return {"no_data": True}

        # In a real implementation, you would track historical snapshots
        # For now, return current state
        return {
            "current_skills": current,
            "note": "Historical tracking requires cognitive profile snapshots",
        }

    async def get_learning_context_for_planner(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Get memory context specifically for the Planner Agent."""
        return await self._get_contextual_memory(
            user_id,
            {
                "purpose": "learning_path_creation",
                "target_agent": "planner",
                "focus": "knowledge_gaps_and_strengths",
            },
            db,
        )

    async def get_performance_context_for_evaluator(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Get memory context specifically for the Evaluator Agent."""
        return await self._get_contextual_memory(
            user_id,
            {
                "purpose": "performance_evaluation",
                "target_agent": "evaluator",
                "focus": "historical_performance_patterns",
            },
            db,
        )

    async def get_guidance_context_for_mentor(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Get memory context specifically for the Mentor Agent."""
        return await self._get_contextual_memory(
            user_id,
            {
                "purpose": "personalized_guidance",
                "target_agent": "mentor",
                "focus": "learning_journey_and_struggles",
            },
            db,
        )
