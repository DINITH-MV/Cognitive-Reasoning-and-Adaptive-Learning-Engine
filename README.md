# CRACLE — Cognitive Reasoning and Adaptive Learning Engine

[![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4o-blue?logo=microsoft-azure)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet?logo=railway)](https://railway.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AI-powered adaptive learning platform with 7 specialized agents, real-time reasoning visualization, and personalized cognitive profiling.**

CRACLE transforms education through intelligent multi-agent AI architecture. Seven specialized agents—powered by Azure OpenAI's GPT-4o—work together to create truly personalized learning experiences that adapt to each user's cognitive style, learning pace, and goals.

## 🌟 Key Features

- **🧠 7 Specialized AI Agents**: Memory, Planner, Content Generator, Simulation, Evaluator, Mentor, and Orchestrator working in concert
- **🎬 Live Reasoning Visualization**: Watch AI agents think and collaborate in real-time via WebSocket
- **🎯 Adaptive Learning Paths**: Dynamically generated and adjusted based on your performance and cognitive profile
- **✍️ On-Demand Content**: AI generates custom lessons, quizzes, and exercises tailored to you
- **🎮 Interactive Simulations**: Decision-making scenarios that adapt to your choices
- **👨‍🏫 Personal AI Mentor**: Context-aware guidance and explanations
- **📊 Cognitive Profiling**: Tracks how you learn, not just what you complete

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│  Dashboard │ Learning Path │ Simulation │ Monitoring│
└────────────────────────┬────────────────────────────┘
                         │  REST API
┌────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                    │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │            Agent Orchestrator                   ││
│  │  ┌─────────┬───────────┬──────────┬───────────┐ ││
│  │  │ Planner │ Content   │ Simulate │ Evaluator │ ││
│  │  │  Agent  │ Generator │  Agent   │   Agent   │ ││
│  │  └─────────┴───────────┴──────────┴───────────┘ ││
│  │     │  Mentor Agent  │  Memory Agent  │         ││
│  └─────┴────────────────┴────────────────┴─────────┘│
│                                                     │
│  Azure OpenAI (gpt-4o) │ Azure AI Foundry           │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼────┐ ┌──────▼──────┐
    │  PostgreSQL │ │  Redis   │ │Azure Blob   │
    │   (Neon)    │ │          │ │  Storage    │
    └─────────────┘ └──────────┘ └─────────────┘
```

## Agents

All agents are deployed on **Azure OpenAI (gpt-4o)** via Azure AI Foundry and communicate through a unified orchestrator.

| Agent                 | Role                                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| **Planner Agent**     | Analyzes goals & constraints → personalized learning roadmap with milestones     |
| **Content Generator** | Creates courses, quizzes (Bloom's taxonomy), and micro-challenges                |
| **Simulation Agent**  | Real-world scenario exercises with branching decisions & cognitive tracking      |
| **Evaluator Agent**   | Scores submissions, builds cognitive profiles (8 dimensions), adaptive feedback  |
| **Mentor Agent**      | Conversational AI companion with full learner context for guidance & motivation  |
| **Memory Agent**      | Tracks user progress, cognitive evolution, and provides context to other agents  |
| **Orchestrator**      | Coordinates all agents, manages workflows, and handles inter-agent communication |

**Azure Integration**: All agents use Azure OpenAI via the `BaseAgent` class with built-in monitoring, error handling, and token tracking.

## Tech Stack

| Layer       | Technology                                                     |
| ----------- | -------------------------------------------------------------- |
| Frontend    | React 18, Vite, TailwindCSS, React Router, Zustand, Recharts   |
| Backend     | Python 3.12, FastAPI, SQLAlchemy 2 (async), Pydantic v2        |
| AI          | Azure OpenAI (GPT-4o), Azure AI Foundry, Azure AI Projects SDK |
| Database    | PostgreSQL (asyncpg), Redis                                    |
| Monitoring  | Prometheus, OpenTelemetry, Azure Application Insights          |
| Integration | MCP (Model Context Protocol) for external tool access          |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Azure subscription with OpenAI & AI Foundry resources

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/Cognitive-Reasoning-and-Adaptive-Learning-Engine.git
cd Cognitive-Reasoning-and-Adaptive-Learning-Engine
cp .env.example .env
# Edit .env with your Azure credentials and database settings
```

### 2. Setup Development Environment

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable                             | Description                    |
| ------------------------------------ | ------------------------------ |
| `AZURE_OPENAI_ENDPOINT`              | Azure OpenAI resource endpoint |
| `AZURE_OPENAI_API_KEY`               | Azure OpenAI API key           |
| `AZURE_OPENAI_DEPLOYMENT`            | GPT-4o deployment name         |
| `AZURE_AI_PROJECT_CONNECTION_STRING` | AI Foundry project connection  |
| `DATABASE_URL`                       | PostgreSQL connection string   |
| `JWT_SECRET_KEY`                     | Secret for JWT token signing   |

## API Endpoints

| Method | Endpoint                       | Description                            |
| ------ | ------------------------------ | -------------------------------------- |
| POST   | `/api/auth/register`           | Create account                         |
| POST   | `/api/auth/login`              | Sign in                                |
| POST   | `/api/learning/plan`           | Generate learning path (Planner Agent) |
| POST   | `/api/learning/content`        | Generate content (Content Generator)   |
| POST   | `/api/agents/mentor/chat`      | Chat with Mentor Agent                 |
| POST   | `/api/agents/evaluate/quiz`    | Evaluate quiz (Evaluator Agent)        |
| POST   | `/api/simulations/start`       | Start simulation session               |
| POST   | `/api/simulations/{id}/decide` | Make simulation decision               |
| GET    | `/api/monitoring/dashboard`    | Agent metrics dashboard                |
| GET    | `/api/monitoring/timeline`     | Hourly activity timeline               |

## Monitoring

The monitoring stack provides:

- **Prometheus Metrics** — Agent call counts, latency histograms, token usage, active simulations
- **OpenTelemetry Traces** — Distributed tracing across agent workflows
- **Azure Application Insights** — Cloud-native APM integration
- **Dashboard UI** — Real-time charts for agent performance, cognitive profiles, and learning analytics

## MCP Integration

CRACLE integrates with the [Model Context Protocol](https://modelcontextprotocol.io/) to extend agent capabilities:

- **Web Search** — Agents can search the web for up-to-date content
- **Filesystem** — Access local learning resources and documents
- **Database** — Direct data queries for analytics and reporting

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/          # 7 AI agents (all on Azure OpenAI) + orchestrator
│   │   │   ├── planner.py           # Planner Agent
│   │   │   ├── content_generator.py # Content Generator Agent
│   │   │   ├── simulation.py        # Simulation Agent
│   │   │   ├── evaluator.py         # Evaluator Agent
│   │   │   ├── mentor.py            # Mentor Agent
│   │   │   ├── memory.py            # Memory Agent (NEW)
│   │   │   ├── orchestrator.py      # Agent Coordinator
│   │   │   └── base.py              # Base Agent (Azure OpenAI integration)
│   │   ├── api/             # FastAPI routes & schemas
│   │   ├── db/              # Database engine & session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── services/        # Azure AI, MCP, monitoring
│   ├── requirements.txt
│   └── verify_azure_agents.py  # Azure connectivity verification
├── frontend/
│   ├── src/
│   │   ├── api/             # API client & endpoints
│   │   ├── components/      # Layout, navigation, reusable UI
│   │   ├── pages/           # Dashboard, mentor, simulation pages
│   │   ├── store/           # Zustand state management
│   │   ├── App.jsx          # Main app with routing
│   │   └── main.jsx         # Entry point
│   └── package.json
├── .env.example
├── AZURE_AGENTS_SETUP.md   # Detailed Azure deployment guide
├── azure_agent_config.json # Azure agent configuration manifest
├── QUICKSTART.md
└── README.md
```

## Azure Deployment

All 7 CRACLE agents are deployed on **Azure AI Foundry** with **Azure OpenAI (gpt-4o)**:

### Azure Resources

- **Azure OpenAI**: gpt-4o deployment for all agents
- **Azure AI Foundry**: Project and agent orchestration
- **Azure Blob Storage**: Course content and media storage
- **Azure Application Insights**: Agent monitoring and telemetry
- **Azure Cosmos DB**: Optional NoSQL storage for agent interactions

### Verify Azure Connectivity

```bash
cd backend
python verify_azure_agents.py
```

This script verifies:

- ✅ Azure OpenAI configuration
- ✅ All 7 agents can connect to Azure
- ✅ Orchestrator setup
- ✅ Token usage tracking

For detailed Azure setup, see [AZURE_AGENTS_SETUP.md](AZURE_AGENTS_SETUP.md).

## License

MIT
