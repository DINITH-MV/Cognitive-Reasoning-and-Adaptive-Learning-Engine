"""
CRACLE - User and authentication models
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="learner")  # learner, instructor, admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cognitive_profile: Mapped["CognitiveProfile"] = relationship(back_populates="user", uselist=False)
    learning_paths: Mapped[list["LearningPath"]] = relationship(back_populates="user")
    evaluations: Mapped[list["Evaluation"]] = relationship(back_populates="user")
    simulation_sessions: Mapped[list["SimulationSession"]] = relationship(back_populates="user")


class CognitiveProfile(Base):
    """Tracks user's cognitive characteristics built by the Evaluator Agent."""
    __tablename__ = "cognitive_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), __import__('sqlalchemy').ForeignKey("users.id"), unique=True)

    # Cognitive metrics (0.0 - 1.0 scale)
    risk_tolerance: Mapped[float] = mapped_column(Float, default=0.5)
    planning_skill: Mapped[float] = mapped_column(Float, default=0.5)
    analytical_thinking: Mapped[float] = mapped_column(Float, default=0.5)
    creative_thinking: Mapped[float] = mapped_column(Float, default=0.5)
    attention_to_detail: Mapped[float] = mapped_column(Float, default=0.5)
    collaboration_skill: Mapped[float] = mapped_column(Float, default=0.5)
    learning_speed: Mapped[float] = mapped_column(Float, default=0.5)
    retention_rate: Mapped[float] = mapped_column(Float, default=0.5)

    # Knowledge gaps and strengths (JSON arrays of topic identifiers)
    knowledge_gaps: Mapped[dict] = mapped_column(JSON, default=list)
    strengths: Mapped[dict] = mapped_column(JSON, default=list)

    # Preferred learning style
    preferred_style: Mapped[str] = mapped_column(String(50), default="balanced")  # visual, auditory, kinesthetic, reading, balanced
    difficulty_preference: Mapped[str] = mapped_column(String(50), default="adaptive")  # easy, medium, hard, adaptive

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="cognitive_profile")
