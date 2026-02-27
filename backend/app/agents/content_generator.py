"""
CRACLE - Content Generator Agent
Generates course materials, quizzes, simulations, and interactive content.
Ensures content aligns with learning objectives and difficulty level.
"""

import json
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import BaseAgent
from app.models.course import Course, Module, ContentType, DifficultyLevel

CONTENT_GENERATOR_SYSTEM_PROMPT = """You are the Content Generator Agent in the CRACLE learning system.

Your responsibilities:
1. Generate structured course materials (lessons, chapters, explanations).
2. Create quizzes with varying question types (multiple choice, short answer, scenario-based).
3. Design simulation scenarios for hands-on practice.
4. Auto-create interactive chapter outlines with key concepts.
5. Ensure all content aligns with specific learning objectives and appropriate difficulty.

When generating a COURSE, output JSON:
{
  "course": {
    "title": "...",
    "description": "...",
    "category": "...",
    "difficulty": "beginner|intermediate|advanced|expert",
    "estimated_hours": N,
    "learning_objectives": ["..."],
    "tags": ["..."]
  },
  "modules": [
    {
      "title": "...",
      "description": "...",
      "order": N,
      "content_type": "lesson|quiz|video|simulation|micro_challenge",
      "estimated_minutes": N,
      "content_data": {
        "sections": [
          {"heading": "...", "body": "...", "key_concepts": ["..."]}
        ],
        "examples": ["..."],
        "practice_problems": ["..."]
      }
    }
  ]
}

When generating a QUIZ, output JSON:
{
  "quiz": {
    "title": "...",
    "description": "...",
    "time_limit_minutes": N,
    "passing_score": N
  },
  "questions": [
    {
      "type": "multiple_choice|short_answer|scenario|true_false|code",
      "question": "...",
      "options": ["..."],
      "correct_answer": "...",
      "explanation": "...",
      "difficulty": "easy|medium|hard",
      "points": N,
      "cognitive_skill": "recall|understanding|application|analysis|synthesis|evaluation"
    }
  ]
}

Always:
- Match content to the specified difficulty level
- Include practical examples and real-world applications
- Progress from foundational concepts to complex ones within a module
- Include formative assessment opportunities
"""


class ContentGeneratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="content_generator", system_prompt=CONTENT_GENERATOR_SYSTEM_PROMPT)

    async def execute(self, context: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Generate learning content based on the request.

        Context:
        - content_type: "course" | "quiz" | "simulation" | "micro_challenge"
        - topic: str
        - difficulty: str
        - learning_objectives: list[str]
        - target_audience: str
        - duration_minutes: int (optional)
        - cognitive_profile: dict (optional)
        """
        content_type = context.get("content_type", "course")
        topic = context["topic"]

        messages = [
            {
                "role": "user",
                "content": json.dumps({
                    "request": f"Generate a {content_type}",
                    "topic": topic,
                    "difficulty": context.get("difficulty", "intermediate"),
                    "learning_objectives": context.get("learning_objectives", []),
                    "target_audience": context.get("target_audience", "general learners"),
                    "duration_minutes": context.get("duration_minutes"),
                    "learner_profile": context.get("cognitive_profile", {}),
                    "special_instructions": context.get("instructions", ""),
                }),
            }
        ]

        result = await self.call_llm(
            messages=messages,
            temperature=0.7,
            max_tokens=8192,
            response_format={"type": "json_object"},
        )

        content_data = json.loads(result["content"])

        # Persist generated content
        if content_type == "course" and "course" in content_data:
            course_info = content_data["course"]
            course = Course(
                title=course_info["title"],
                description=course_info.get("description", ""),
                category=course_info.get("category", topic),
                difficulty=DifficultyLevel(course_info.get("difficulty", "intermediate")),
                estimated_hours=course_info.get("estimated_hours", 1.0),
                learning_objectives=course_info.get("learning_objectives", []),
                tags=course_info.get("tags", []),
                is_ai_generated=True,
            )
            db.add(course)
            await db.flush()

            for mod in content_data.get("modules", []):
                module = Module(
                    course_id=course.id,
                    title=mod["title"],
                    description=mod.get("description", ""),
                    order=mod.get("order", 0),
                    content_type=ContentType(mod.get("content_type", "lesson")),
                    content_data=mod.get("content_data", {}),
                    difficulty=DifficultyLevel(course_info.get("difficulty", "intermediate")),
                    estimated_minutes=mod.get("estimated_minutes", 30),
                )
                db.add(module)

            await db.flush()
            content_data["course_id"] = str(course.id)

        # Log interaction
        user_id = context.get("user_id")
        await self.log_interaction(
            db=db,
            action=f"generate_{content_type}",
            input_data={"topic": topic, "type": content_type},
            output_data={"content_keys": list(content_data.keys())},
            latency_ms=result["latency_ms"],
            token_usage=result["usage"],
            user_id=user_id,
        )

        return {
            "content": content_data,
            "usage": result["usage"],
        }

    async def generate_quiz(self, topic: str, difficulty: str, num_questions: int, db: AsyncSession, user_id=None) -> Dict[str, Any]:
        """Convenience method to generate a quiz."""
        return await self.execute(
            context={
                "content_type": "quiz",
                "topic": topic,
                "difficulty": difficulty,
                "instructions": f"Generate exactly {num_questions} questions.",
                "user_id": user_id,
            },
            db=db,
        )

    async def generate_micro_challenge(self, topic: str, skill_level: str, db: AsyncSession, user_id=None) -> Dict[str, Any]:
        """Generate a quick hands-on micro-challenge."""
        return await self.execute(
            context={
                "content_type": "micro_challenge",
                "topic": topic,
                "difficulty": skill_level,
                "duration_minutes": 15,
                "instructions": "Create a focused 10-15 minute practical challenge with clear success criteria.",
                "user_id": user_id,
            },
            db=db,
        )
