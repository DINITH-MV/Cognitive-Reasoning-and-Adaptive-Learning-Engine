import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/v1/auth/register", data),
  login: (data) => api.post("/v1/auth/login", data),
  getMe: () => api.get("/v1/auth/me"),
};

// Learning API
export const learningAPI = {
  createPlan: (data) => api.post("/v1/learning/plan", data),
  getNextActivity: (pathId) => api.get(`/v1/learning/plan/${pathId}/next`),
};

// Agent API
export const agentAPI = {
  chatWithMentor: (data) => api.post("/v1/agents/mentor/chat", data),
  evaluateQuiz: (data) => api.post("/v1/agents/evaluate/quiz", data),
};

// Simulation API
export const simulationAPI = {
  start: (data) => api.post("/v1/simulations/start", data),
  makeDecision: (data) => api.post("/v1/simulations/decide", data),
};

// Monitoring API
export const monitoringAPI = {
  getDashboard: (days = 7) => api.get(`/v1/monitoring/dashboard?days=${days}`),
};

export default api;
