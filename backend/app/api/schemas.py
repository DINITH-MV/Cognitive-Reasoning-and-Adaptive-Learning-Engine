"""
CRACLE - Pydantic schemas for API request/response validation
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Learning Path ──────────────────────────

class CreateLearningPlanRequest(BaseModel):
    goal: str = Field(min_length=5, description="What the learner wants to achieve")
    skill_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced|expert)$")
    time_available_hours: int = Field(default=10, ge=1, le=80, description="Weekly hours available")
    target_outcome: str = Field(default="skill mastery", description="Desired end result")


class LearningPathResponse(BaseModel):
    learning_path_id: str
    plan: Dict[str, Any]
    next_action: Optional[Dict[str, Any]] = None


# ── Content ──────────────────────────

class GenerateContentRequest(BaseModel):
    topic: str = Field(min_length=2)
    content_type: str = Field(default="course", pattern="^(course|quiz|simulation|micro_challenge|lesson)$")
    difficulty: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced|expert)$")
    learning_objectives: List[str] = Field(default=[])
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    instructions: Optional[str] = None


class ContentResponse(BaseModel):
    content: Dict[str, Any]
    usage: Dict[str, int]


# ── Simulation ──────────────────────────

class StartSimulationRequest(BaseModel):
    topic: str = Field(min_length=2)
    category: str = Field(default="business")
    difficulty: str = Field(default="intermediate")


class SimulationDecisionRequest(BaseModel):
    session_id: str
    decision: str = Field(min_length=1)
    reasoning: Optional[str] = ""


class SimulationResponse(BaseModel):
    session_id: Optional[str] = None
    scenario: Optional[Dict[str, Any]] = None
    outcome: Optional[Dict[str, Any]] = None
    turn: Optional[int] = None
    session_status: Optional[str] = None


# ── Evaluation ──────────────────────────

class SubmitQuizRequest(BaseModel):
    quiz_data: Dict[str, Any]
    answers: List[Dict[str, Any]]
    time_spent_seconds: Optional[int] = None


class EvaluationResponse(BaseModel):
    evaluation_id: str
    results: Dict[str, Any]


# ── Mentor ──────────────────────────

class MentorChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_history: Optional[List[Dict[str, str]]] = []
    session_id: Optional[str] = None


class MentorResponse(BaseModel):
    response: Dict[str, Any]


# ── Monitoring ──────────────────────────

class AgentMetrics(BaseModel):
    agent_name: str
    total_calls: int
    avg_latency_ms: float
    success_rate: float
    total_tokens: int
    error_count: int


class MonitoringDashboard(BaseModel):
    agents: List[AgentMetrics]
    total_interactions: int
    active_users: int
    active_simulations: int
    avg_evaluation_score: float
