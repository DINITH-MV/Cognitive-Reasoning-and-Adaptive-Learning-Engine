/**
 * CRACLE - API Client
 * Handles all communication with the Python backend.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("cracle_token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("cracle_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("cracle_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ── Auth ──────────────────────────

  async register(email: string, password: string, fullName: string) {
    const res = await this.request<{ access_token: string; user: UserProfile }>(
      "/auth/register",
      {
        method: "POST",
        body: { email, password, full_name: fullName },
      },
    );
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: UserProfile }>(
      "/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
    );
    this.setToken(res.access_token);
    return res;
  }

  async getMe() {
    return this.request<UserProfile>("/auth/me");
  }

  // ── Learning ──────────────────────────

  async createLearningPlan(data: CreatePlanRequest) {
    return this.request<LearningPlanResponse>("/learning/plan", {
      method: "POST",
      body: data,
    });
  }

  async getNextActivity(pathId: string) {
    return this.request<NextActivityResponse>(`/learning/plan/${pathId}/next`);
  }

  async getLearningPaths() {
    return this.request<LearningPathSummary[]>("/learning/paths");
  }

  async generateContent(data: GenerateContentRequest) {
    return this.request<ContentResponse>("/learning/content/generate", {
      method: "POST",
      body: data,
    });
  }

  async getCourses(category?: string, difficulty?: string) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    const qs = params.toString();
    return this.request<CourseSummary[]>(
      `/learning/courses${qs ? `?${qs}` : ""}`,
    );
  }

  // ── Agents ──────────────────────────

  async chatWithMentor(
    message: string,
    conversationHistory: ChatMessage[] = [],
  ) {
    return this.request<MentorChatResponse>("/agents/mentor/chat", {
      method: "POST",
      body: { message, conversation_history: conversationHistory },
    });
  }

  async submitQuiz(
    quizData: QuizData,
    answers: QuizAnswer[],
    timeSpent?: number,
  ) {
    return this.request<EvaluationResponse>("/agents/evaluate/quiz", {
      method: "POST",
      body: { quiz_data: quizData, answers, time_spent_seconds: timeSpent },
    });
  }

  async getCognitiveProfile() {
    return this.request<CognitiveProfile>("/agents/profile/cognitive");
  }

  // ── Simulations ──────────────────────────

  async startSimulation(topic: string, category: string, difficulty: string) {
    return this.request<SimulationStartResponse>("/simulations/start", {
      method: "POST",
      body: { topic, category, difficulty },
    });
  }

  async makeSimulationDecision(
    sessionId: string,
    decision: string,
    reasoning?: string,
  ) {
    return this.request<SimulationDecisionResponse>("/simulations/decide", {
      method: "POST",
      body: { session_id: sessionId, decision, reasoning },
    });
  }

  async getSimulationSessions(status?: string) {
    const qs = status ? `?status=${status}` : "";
    return this.request<SimulationSessionSummary[]>(
      `/simulations/sessions${qs}`,
    );
  }

  async getSimulationSession(sessionId: string) {
    return this.request<SimulationSessionDetail>(
      `/simulations/session/${sessionId}`,
    );
  }

  // ── Monitoring ──────────────────────────

  async getMonitoringDashboard(days: number = 7) {
    return this.request<MonitoringDashboard>(
      `/monitoring/dashboard?days=${days}`,
    );
  }

  async getAgentHistory(agentName: string, limit: number = 50) {
    return this.request<AgentInteraction[]>(
      `/monitoring/agents/${agentName}/history?limit=${limit}`,
    );
  }

  async getInteractionTimeline(hours: number = 24) {
    return this.request<TimelineEntry[]>(`/monitoring/timeline?hours=${hours}`);
  }
}

export const api = new ApiClient();

// ── Type Definitions ──────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface CreatePlanRequest {
  goal: string;
  skill_level: string;
  time_available_hours: number;
  target_outcome: string;
}

export interface LearningPlanResponse {
  learning_path: {
    learning_path_id: string;
    plan: Record<string, unknown>;
    next_action?: Record<string, unknown>;
  };
  first_content?: Record<string, unknown>;
}

export interface NextActivityResponse {
  [key: string]: unknown;
}

export interface LearningPathSummary {
  id: string;
  title: string;
  goal: string;
  status: string;
  progress_pct: number;
  skill_level: string;
  created_at: string;
}

export interface GenerateContentRequest {
  topic: string;
  content_type: string;
  difficulty: string;
  learning_objectives?: string[];
  duration_minutes?: number;
  instructions?: string;
}

export interface ContentResponse {
  content: Record<string, unknown>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_hours: number;
  tags: string[];
  is_ai_generated: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MentorChatResponse {
  response: {
    message: string;
    suggestions: { type: string; description: string; priority: string }[];
    encouragement: string;
    concepts_explained: string[];
    follow_up_questions: string[];
  };
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
  [key: string]: unknown;
}

export interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  difficulty: string;
  points: number;
}

export interface QuizAnswer {
  question_index: number;
  answer: string;
}

export interface EvaluationResponse {
  evaluation: {
    evaluation_id: string;
    results: Record<string, unknown>;
  };
  mentor_feedback: MentorChatResponse;
}

export interface CognitiveProfile {
  risk_tolerance: number;
  planning_skill: number;
  analytical_thinking: number;
  creative_thinking: number;
  attention_to_detail: number;
  collaboration_skill: number;
  learning_speed: number;
  retention_rate: number;
  knowledge_gaps: string[];
  strengths: string[];
  preferred_style: string;
  difficulty_preference: string;
  updated_at: string | null;
}

export interface SimulationStartResponse {
  session_id: string;
  scenario: Record<string, unknown>;
}

export interface SimulationDecisionResponse {
  outcome: Record<string, unknown>;
  turn: number;
  session_status: string;
  evaluation?: Record<string, unknown>;
}

export interface SimulationSessionSummary {
  id: string;
  title: string;
  status: string;
  turn_count: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface SimulationSessionDetail extends SimulationSessionSummary {
  current_state: Record<string, unknown>;
}

export interface MonitoringDashboard {
  agents: AgentMetric[];
  total_interactions: number;
  active_users: number;
  active_simulations: number;
  avg_evaluation_score: number;
  period_days: number;
}

export interface AgentMetric {
  agent_name: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
  error_count: number;
}

export interface AgentInteraction {
  id: string;
  action: string;
  status: string;
  latency_ms: number;
  token_usage: Record<string, number>;
  error_message: string | null;
  created_at: string;
}

export interface TimelineEntry {
  timestamp: string;
  agent: string;
  count: number;
  avg_latency_ms: number;
}
