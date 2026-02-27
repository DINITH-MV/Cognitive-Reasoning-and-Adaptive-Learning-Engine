"""
CRACLE - Evaluator Agent
Scores user performance, builds cognitive profiles, and provides
feedback loops to the Planner Agent.
"""

import json
import uuid
from typing import Any, Dict, List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.agents.base import BaseAgent
from app.models.user import CognitiveProfile
from app.models.evaluation import Evaluation, EvaluationType
from app.models.simulation import SimulationSession, SimulationDecision

EVALUATOR_SYSTEM_PROMPT = """You are the Evaluator Agent in the CRACLE learning system.

Your responsibilities:
1. Score user performance in quizzes, simulations, and projects with detailed breakdowns.
2. Analyze patterns to build and update the learner's cognitive profile.
3. Identify knowledge gaps and strengths from performance data.
4. Generate actionable feedback and recommendations for the Planner Agent.
5. Track learning velocity and predict areas of struggle.

When evaluating QUIZ RESULTS, output JSON:
{
  "evaluation": {
    "score": N,
    "max_score": N,
    "percentage": N,
    "grade": "A|B|C|D|F",
    "time_efficiency": "fast|average|slow"
  },
  "category_breakdown": {
    "category_name": {"correct": N, "total": N, "percentage": N}
  },
  "cognitive_analysis": {
    "bloom_level_performance": {
      "recall": N, "understanding": N, "application": N,
      "analysis": N, "synthesis": N, "evaluation": N
    },
    "identified_gaps": ["..."],
    "identified_strengths": ["..."],
    "learning_style_indicators": {...}
  },
  "feedback": "Detailed, encouraging, personalized feedback...",
  "recommendations": [
    {"type": "review|practice|advance|challenge", "topic": "...", "reason": "..."}
  ],
  "profile_updates": {
    "risk_tolerance_delta": N,
    "planning_skill_delta": N,
    "analytical_thinking_delta": N,
    "creative_thinking_delta": N,
    "learning_speed_delta": N
  }
}

When evaluating SIMULATION PERFORMANCE, analyze:
- Decision patterns across turns
- Risk tolerance exhibited
- Strategic thinking demonstrated
- Adaptability to changing conditions
- Overall outcome quality

Always be:
- Constructive and encouraging in feedback
- Specific about what to improve
- Data-driven in cognitive assessments
- Actionable in recommendations
"""


class EvaluatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="evaluator", system_prompt=EVALUATOR_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Evaluate user performance.

        Context:
        - eval_type: "quiz" | "simulation" | "project"
        - user_id: UUID
        - For quiz: answers, quiz_data
        - For simulation: session_id
        - For project: submission_data, rubric
        """
        eval_type = context.get("eval_type", "quiz")

        if eval_type == "quiz":
            return await self._evaluate_quiz(context, db)
        elif eval_type == "simulation":
            return await self._evaluate_simulation(context, db)
        elif eval_type == "project":
            return await self._evaluate_project(context, db)
        else:
            return {"error": f"Unknown evaluation type: {eval_type}"}

    async def _evaluate_quiz(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Evaluate quiz answers and update cognitive profile."""
        user_id = context["user_id"]
        answers = context["answers"]
        quiz_data = context["quiz_data"]

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Evaluate these quiz results",
                    "quiz": quiz_data,
                    "user_answers": answers,
                    "time_spent_seconds": context.get("time_spent_seconds"),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        eval_data = json.loads(result["content"])

        # Save evaluation
        evaluation = Evaluation(
            user_id=user_id,
            evaluation_type=EvaluationType.QUIZ,
            title=quiz_data.get("title", "Quiz"),
            score=eval_data["evaluation"]["score"],
            max_score=eval_data["evaluation"]["max_score"],
            percentage=eval_data["evaluation"]["percentage"],
            category_scores=eval_data.get("category_breakdown", {}),
            cognitive_analysis=eval_data.get("cognitive_analysis", {}),
            feedback=eval_data.get("feedback", ""),
            recommendations=eval_data.get("recommendations", []),
            time_spent_seconds=context.get("time_spent_seconds"),
        )
        db.add(evaluation)

        # Update cognitive profile
        if "profile_updates" in eval_data:
            await self._update_cognitive_profile(user_id, eval_data, db)

        await db.flush()

        await self.log_interaction(
            db=db,
            action="evaluate_quiz",
            input_data={"user_id": str(user_id), "quiz_title": quiz_data.get("title")},
            output_data={"score": eval_data["evaluation"]["percentage"]},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "evaluation_id": str(evaluation.id),
            "results": eval_data,
            "usage": result["usage"],
        }

    async def _evaluate_simulation(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Evaluate a completed simulation session."""
        user_id = context["user_id"]
        session_id = uuid.UUID(context["session_id"])

        session = await db.get(SimulationSession, session_id)
        if not session:
            return {"error": "Simulation session not found"}

        # Load all decisions
        decisions_result = await db.execute(
            select(SimulationDecision)
            .where(SimulationDecision.session_id == session_id)
            .order_by(SimulationDecision.turn_number)
        )
        decisions = decisions_result.scalars().all()

        decision_summary = [
            {
                "turn": d.turn_number,
                "decision": d.decision,
                "reasoning": d.reasoning,
                "outcome_score": d.score_impact,
                "cognitive_indicators": d.cognitive_indicators,
            }
            for d in decisions
        ]

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Evaluate this simulation performance",
                    "simulation_title": session.title,
                    "total_turns": session.turn_count,
                    "final_score": session.score,
                    "decisions": decision_summary,
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        eval_data = json.loads(result["content"])

        evaluation = Evaluation(
            user_id=user_id,
            evaluation_type=EvaluationType.SIMULATION,
            source_id=session_id,
            title=f"Simulation: {session.title}",
            score=eval_data.get("evaluation", {}).get("score", session.score or 0),
            max_score=eval_data.get("evaluation", {}).get("max_score", 100),
            percentage=eval_data.get("evaluation", {}).get("percentage", 0),
            cognitive_analysis=eval_data.get("cognitive_analysis", {}),
            feedback=eval_data.get("feedback", ""),
            recommendations=eval_data.get("recommendations", []),
        )
        db.add(evaluation)

        if "profile_updates" in eval_data:
            await self._update_cognitive_profile(user_id, eval_data, db)

        await db.flush()

        await self.log_interaction(
            db=db,
            action="evaluate_simulation",
            input_data={"session_id": str(session_id)},
            output_data={"score": eval_data.get("evaluation", {}).get("percentage", 0)},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "evaluation_id": str(evaluation.id),
            "results": eval_data,
            "usage": result["usage"],
        }

    async def _evaluate_project(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Evaluate a project submission."""
        user_id = context["user_id"]

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Evaluate this project submission",
                    "submission": context.get("submission_data", {}),
                    "rubric": context.get("rubric", {}),
                    "project_description": context.get("description", ""),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        eval_data = json.loads(result["content"])

        evaluation = Evaluation(
            user_id=user_id,
            evaluation_type=EvaluationType.PROJECT,
            title=context.get("title", "Project Evaluation"),
            score=eval_data.get("evaluation", {}).get("score", 0),
            max_score=eval_data.get("evaluation", {}).get("max_score", 100),
            percentage=eval_data.get("evaluation", {}).get("percentage", 0),
            cognitive_analysis=eval_data.get("cognitive_analysis", {}),
            feedback=eval_data.get("feedback", ""),
            recommendations=eval_data.get("recommendations", []),
        )
        db.add(evaluation)
        await db.flush()

        return {
            "evaluation_id": str(evaluation.id),
            "results": eval_data,
            "usage": result["usage"],
        }

    async def _update_cognitive_profile(self, user_id: uuid.UUID, eval_data: dict, db: AsyncSession):
        """Update or create the user's cognitive profile based on evaluation results."""
        profile_result = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

        if not profile:
            profile = CognitiveProfile(user_id=user_id)
            db.add(profile)

        updates = eval_data.get("profile_updates", {})
        cognitive = eval_data.get("cognitive_analysis", {})

        # Apply deltas with clamping to 0.0-1.0
        def clamp(val: float) -> float:
            return max(0.0, min(1.0, val))

        if "risk_tolerance_delta" in updates:
            profile.risk_tolerance = clamp(profile.risk_tolerance + updates["risk_tolerance_delta"])
        if "planning_skill_delta" in updates:
            profile.planning_skill = clamp(profile.planning_skill + updates["planning_skill_delta"])
        if "analytical_thinking_delta" in updates:
            profile.analytical_thinking = clamp(profile.analytical_thinking + updates["analytical_thinking_delta"])
        if "creative_thinking_delta" in updates:
            profile.creative_thinking = clamp(profile.creative_thinking + updates["creative_thinking_delta"])
        if "learning_speed_delta" in updates:
            profile.learning_speed = clamp(profile.learning_speed + updates["learning_speed_delta"])

        # Update knowledge gaps and strengths
        if "identified_gaps" in cognitive:
            existing_gaps = profile.knowledge_gaps or []
            new_gaps = list(set(existing_gaps + cognitive["identified_gaps"]))
            profile.knowledge_gaps = new_gaps

        if "identified_strengths" in cognitive:
            existing_strengths = profile.strengths or []
            new_strengths = list(set(existing_strengths + cognitive["identified_strengths"]))
            # Remove items that were gaps but are now strengths
            profile.strengths = new_strengths
            if profile.knowledge_gaps:
                profile.knowledge_gaps = [g for g in profile.knowledge_gaps if g not in new_strengths]

        profile.updated_at = datetime.utcnow()
