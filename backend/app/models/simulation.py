"""
CRACLE - Simulation models for scenario-based exercises
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Float, Integer, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
import enum


class ScenarioCategory(str, enum.Enum):
    BUSINESS = "business"
    TECHNICAL = "technical"
    LEADERSHIP = "leadership"
    CRISIS_MANAGEMENT = "crisis_management"
    FINANCIAL = "financial"
    STRATEGIC = "strategic"
    ETHICAL = "ethical"


class SimulationTemplate(Base):
    """Template for reusable simulation scenarios."""
    __tablename__ = "simulation_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ScenarioCategory] = mapped_column(SQLEnum(ScenarioCategory))
    difficulty: Mapped[str] = mapped_column(String(50), default="intermediate")
    initial_scenario: Mapped[dict] = mapped_column(JSON, nullable=False)   # The starting state
    decision_tree: Mapped[dict] = mapped_column(JSON, default=dict)        # Possible branches
    success_criteria: Mapped[dict] = mapped_column(JSON, default=dict)     # What defines success
    max_turns: Mapped[int] = mapped_column(Integer, default=10)
    time_limit_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    tags: Mapped[dict] = mapped_column(JSON, default=list)
    is_ai_generated: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SimulationSession(Base):
    """An active or completed simulation run by a user."""
    __tablename__ = "simulation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("simulation_templates.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, abandoned
    current_state: Mapped[dict] = mapped_column(JSON, default=dict)    # Current scenario state
    turn_count: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[float] = mapped_column(Float, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="simulation_sessions")
    decisions: Mapped[list["SimulationDecision"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class SimulationDecision(Base):
    """Individual decisions made during a simulation."""
    __tablename__ = "simulation_decisions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("simulation_sessions.id"))
    turn_number: Mapped[int] = mapped_column(Integer, nullable=False)
    scenario_context: Mapped[dict] = mapped_column(JSON, nullable=False)    # What the user saw
    decision: Mapped[str] = mapped_column(Text, nullable=False)             # What they chose
    reasoning: Mapped[str] = mapped_column(Text, nullable=True)             # Why (optional)
    outcome: Mapped[dict] = mapped_column(JSON, nullable=False)             # What happened
    score_impact: Mapped[float] = mapped_column(Float, default=0.0)
    cognitive_indicators: Mapped[dict] = mapped_column(JSON, default=dict)  # Risk tolerance, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["SimulationSession"] = relationship(back_populates="decisions")
