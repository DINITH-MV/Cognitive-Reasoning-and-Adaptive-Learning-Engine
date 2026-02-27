"""
CRACLE - Simulation Agent
Provides real-world scenario-based exercises, dynamically adjusts outcomes
based on user decisions, and tracks decision patterns.
"""

import json
import uuid
from typing import Any, Dict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import BaseAgent
from app.models.simulation import SimulationTemplate, SimulationSession, SimulationDecision

SIMULATION_SYSTEM_PROMPT = """You are the Simulation Agent in the CRACLE learning system.

Your responsibilities:
1. Create realistic scenario-based exercises drawn from real-world situations.
2. Present scenarios with multiple decision points and consequences.
3. Dynamically adjust outcomes based on the user's choices - every decision matters.
4. Track patterns in user decisions to identify cognitive tendencies.
5. Provide rich narrative context that immerses the learner.

When creating a NEW SCENARIO, output JSON:
{
  "scenario": {
    "title": "...",
    "category": "business|technical|leadership|crisis_management|financial|strategic|ethical",
    "context": "Rich narrative description of the situation...",
    "stakeholders": ["..."],
    "constraints": ["..."],
    "objectives": ["..."],
    "initial_state": {
      "resources": {...},
      "relationships": {...},
      "metrics": {...}
    }
  },
  "decision_point": {
    "situation": "What the learner faces right now...",
    "options": [
      {
        "id": "A",
        "description": "...",
        "risk_level": "low|medium|high",
        "type": "conservative|aggressive|balanced|creative"
      }
    ],
    "hidden_factors": ["Things the learner doesn't know yet..."]
  }
}

When processing a DECISION, output JSON:
{
  "outcome": {
    "narrative": "What happened as a result of the decision...",
    "immediate_effects": ["..."],
    "state_changes": {...},
    "score_impact": N  // -100 to +100
  },
  "cognitive_indicators": {
    "risk_tolerance": "low|medium|high",
    "decision_speed": "impulsive|measured|cautious",
    "thinking_style": "analytical|intuitive|balanced",
    "adaptability": "rigid|flexible|opportunistic"
  },
  "next_decision_point": {
    "situation": "...",
    "options": [...]
  },
  "is_terminal": false
}

Make scenarios:
- Realistic and professionally relevant
- Multi-layered with interconnected consequences
- Revealing of cognitive patterns and decision-making style
- Progressively complex as the simulation advances
"""


class SimulationAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="simulation", system_prompt=SIMULATION_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Execute simulation actions: create scenario or process decision.

        Context:
        - action: "create" | "decide" | "continue"
        - For create: topic, difficulty, category
        - For decide: session_id, decision, reasoning
        """
        action = context.get("action", "create")

        if action == "create":
            return await self._create_scenario(context, db)
        elif action == "decide":
            return await self._process_decision(context, db)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _create_scenario(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Generate a new simulation scenario."""
        user_id = context.get("user_id")
        topic = context.get("topic", "business strategy")
        difficulty = context.get("difficulty", "intermediate")
        category = context.get("category", "business")

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Create a new simulation scenario",
                    "topic": topic,
                    "difficulty": difficulty,
                    "category": category,
                    "learner_profile": context.get("cognitive_profile", {}),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.8,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        scenario_data = json.loads(result["content"])

        # Create simulation session
        session = SimulationSession(
            user_id=user_id,
            title=scenario_data["scenario"]["title"],
            current_state=scenario_data,
            status="active",
            turn_count=0,
        )
        db.add(session)
        await db.flush()

        await self.log_interaction(
            db=db,
            action="create_scenario",
            input_data={"topic": topic, "category": category},
            output_data={"session_id": str(session.id), "title": scenario_data["scenario"]["title"]},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "session_id": str(session.id),
            "scenario": scenario_data,
            "usage": result["usage"],
        }

    async def _process_decision(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Process a user's decision in an active simulation."""
        session_id = uuid.UUID(context["session_id"])
        decision_text = context["decision"]
        reasoning = context.get("reasoning", "")
        user_id = context.get("user_id")

        session = await db.get(SimulationSession, session_id)
        if not session or session.status != "active":
            return {"error": "Invalid or inactive simulation session"}

        # Build conversation history from past decisions
        history = []
        for dec in session.decisions:
            history.append({"role": "user", "content": f"Decision: {dec.decision}"})
            history.append({"role": "assistant", "content": json.dumps(dec.outcome)})

        messages = history + [
            {
                "role": "user",
                "content": json.dumps({
                    "request": "Process this decision and generate the outcome",
                    "current_state": session.current_state,
                    "turn_number": session.turn_count + 1,
                    "decision": decision_text,
                    "reasoning": reasoning,
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        outcome_data = json.loads(result["content"])

        # Record the decision
        decision_record = SimulationDecision(
            session_id=session_id,
            turn_number=session.turn_count + 1,
            scenario_context=session.current_state,
            decision=decision_text,
            reasoning=reasoning,
            outcome=outcome_data,
            score_impact=outcome_data.get("outcome", {}).get("score_impact", 0),
            cognitive_indicators=outcome_data.get("cognitive_indicators", {}),
        )
        db.add(decision_record)

        # Update session state
        session.turn_count += 1
        session.current_state = outcome_data
        if outcome_data.get("is_terminal", False):
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.score = sum(d.score_impact for d in session.decisions) + decision_record.score_impact

        await db.flush()

        await self.log_interaction(
            db=db,
            action="process_decision",
            input_data={"session_id": str(session_id), "turn": session.turn_count},
            output_data={"is_terminal": outcome_data.get("is_terminal", False)},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "outcome": outcome_data,
            "turn": session.turn_count,
            "session_status": session.status,
            "usage": result["usage"],
        }
