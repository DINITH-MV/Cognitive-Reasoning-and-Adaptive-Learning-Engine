# CRACLE — Cognitive Reasoning and Adaptive Learning Engine

An AI-powered Learning Management System built on a **multi-agent architecture** with Azure AI Foundry, designed to deliver personalized, cognitively-aware learning experiences.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  Dashboard │ Learning Path │ Simulation │ Monitoring │
└────────────────────────┬────────────────────────────┘
                         │  REST API
┌────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                      │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │            Agent Orchestrator                    │ │
│  │  ┌─────────┬───────────┬──────────┬───────────┐ │ │
│  │  │ Planner │ Content   │ Simulate │ Evaluator │ │ │
│  │  │  Agent  │ Generator │  Agent   │   Agent   │ │ │
│  │  └─────────┴───────────┴──────────┴───────────┘ │ │
│  │                  │  Mentor Agent  │              │ │
│  └──────────────────┴────────────────┴─────────────┘ │
│                                                      │
│  Azure AI Foundry │ MCP Tools │ Prometheus/OTel      │
└──────────┬──────────────┬──────────────┬─────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼────┐ ┌──────▼──────┐
    │  PostgreSQL  │ │  Redis   │ │   Azure AI  │
    └─────────────┘ └──────────┘ └─────────────┘
```

## Agents

| Agent                 | Role                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| **Planner Agent**     | Analyzes goals & constraints → personalized learning roadmap with milestones    |
| **Content Generator** | Creates courses, quizzes (Bloom's taxonomy), and micro-challenges               |
| **Simulation Agent**  | Real-world scenario exercises with branching decisions & cognitive tracking     |
| **Evaluator Agent**   | Scores submissions, builds cognitive profiles (8 dimensions), adaptive feedback |
| **Mentor Agent**      | Conversational AI companion with full learner context for guidance & motivation |

## Tech Stack

| Layer       | Technology                                                     |
| ----------- | -------------------------------------------------------------- |
| Frontend    | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Recharts    |
| Backend     | Python 3.12, FastAPI, SQLAlchemy 2 (async), Pydantic v2        |
| AI          | Azure OpenAI (GPT-4o), Azure AI Foundry, Azure AI Projects SDK |
| Database    | PostgreSQL (asyncpg), Redis                                    |
| Monitoring  | Prometheus, OpenTelemetry, Azure Application Insights          |
| Integration | MCP (Model Context Protocol) for external tool access          |
| Infra       | Docker, Docker Compose                                         |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- Azure subscription with OpenAI & AI Foundry resources

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/Cognitive-Reasoning-and-Adaptive-Learning-Engine.git
cd Cognitive-Reasoning-and-Adaptive-Learning-Engine
cp .env.example .env
# Edit .env with your Azure credentials and database settings
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Metrics:** http://localhost:8000/metrics

### 3. Manual Setup (Development)

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
│   │   ├── agents/          # 5 AI agents + orchestrator
│   │   ├── api/             # FastAPI routes & schemas
│   │   ├── db/              # Database engine & session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── services/        # Azure AI, MCP, monitoring
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (dashboard, simulation, etc.)
│   │   ├── components/      # Sidebar, charts, UI components
│   │   └── lib/             # API client, utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT
