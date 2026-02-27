"""
CRACLE - Evaluation and assessment models
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Float, Integer, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
import enum


class EvaluationType(str, enum.Enum):
    QUIZ = "quiz"
    SIMULATION = "simulation"
    PROJECT = "project"
    PEER_REVIEW = "peer_review"
    SELF_ASSESSMENT = "self_assessment"
    AI_ASSESSMENT = "ai_assessment"


class Evaluation(Base):
    """Evaluation records created by the Evaluator Agent."""
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    evaluation_type: Mapped[EvaluationType] = mapped_column(SQLEnum(EvaluationType))
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)  # Quiz/Simulation/Project ID
    title: Mapped[str] = mapped_column(String(500), nullable=False)

    # Scoring
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=100.0)
    percentage: Mapped[float] = mapped_column(Float, nullable=False)

    # Detailed breakdown
    category_scores: Mapped[dict] = mapped_column(JSON, default=dict)       # {category: score}
    question_results: Mapped[dict] = mapped_column(JSON, default=list)      # [{q, answer, correct, score}]
    cognitive_analysis: Mapped[dict] = mapped_column(JSON, default=dict)    # Analysis from Evaluator Agent
    feedback: Mapped[str] = mapped_column(Text, nullable=True)              # AI-generated feedback
    recommendations: Mapped[dict] = mapped_column(JSON, default=list)       # Next steps

    # Metadata
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="evaluations")


class AgentInteraction(Base):
    """Logs all agent interactions for monitoring and analysis."""
    __tablename__ = "agent_interactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)  # planner, content_generator, etc.
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    input_data: Mapped[dict] = mapped_column(JSON, default=dict)
    output_data: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="success")  # success, error, timeout
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    token_usage: Mapped[dict] = mapped_column(JSON, default=dict)  # {prompt_tokens, completion_tokens, total}
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
