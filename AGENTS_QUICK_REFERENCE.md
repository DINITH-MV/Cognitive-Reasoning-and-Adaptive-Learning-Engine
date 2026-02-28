# Quick Reference: CRACLE Agents on Azure

## All 7 Agents Deployed ✅

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE OPENAI (gpt-4o)                         │
│             endpoint: resource-cognitivereasoningsys1             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─► 1. Planner Agent         (planner.py)
                 ├─► 2. Content Generator     (content_generator.py)
                 ├─► 3. Simulation Agent      (simulation.py)
                 ├─► 4. Evaluator Agent       (evaluator.py)
                 ├─► 5. Mentor Agent          (mentor.py)
                 ├─► 6. Memory Agent          (memory.py) [NEW]
                 └─► 7. Orchestrator          (orchestrator.py)
```

## Agent Capabilities

### 1️⃣ Planner Agent
- Analyzes user goals and constraints
- Creates personalized learning paths
- Breaks objectives into milestones
- Memory-aware planning

### 2️⃣ Content Generator Agent
- Generates courses and quizzes
- Creates simulation scenarios
- Produces interactive materials
- Aligns content with objectives

### 3️⃣ Simulation Agent
- Creates real-world scenarios
- Processes user decisions dynamically
- Tracks decision patterns
- Adjusts outcomes based on choices

### 4️⃣ Evaluator Agent
- Scores performance (quizzes, simulations, projects)
- Builds cognitive profiles
- Identifies knowledge gaps
- Provides feedback to Planner

### 5️⃣ Mentor Agent
- Natural language guidance
- Concept explanations
- Motivational support
- Context-aware recommendations

### 6️⃣ Memory Agent [NEW]
- Stores user progress history
- Tracks cognitive evolution
- Provides context to other agents
- Analyzes learning patterns

### 7️⃣ Orchestrator
- Coordinates all 6 agents
- Manages multi-agent workflows
- Handles inter-agent communication
- Resolves conflicts

## Azure Configuration

```env
AZURE_OPENAI_ENDPOINT=https://resource-cognitivereasoningsys1.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_AI_FOUNDRY_ENDPOINT=https://resource-cognitivereasoningsys1.services.ai.azure.com/
```

## Test Azure Connection

```bash
cd backend
python verify_azure_agents.py
```

## Agent Interaction Flow

```
User Request
    │
    ▼
Orchestrator
    │
    ├─► Memory Agent (get context)
    │       │
    │       ▼
    ├─► Planner Agent (with context)
    │       │
    │       ▼
    ├─► Content Generator (create materials)
    │       │
    │       ▼
    ├─► Simulation Agent (run scenarios)
    │       │
    │       ▼
    ├─► Evaluator Agent (score & analyze)
    │       │
    │       ▼
    └─► Mentor Agent (provide guidance)
            │
            ▼
        Response to User
```

## Key Features

✅ All agents use Azure OpenAI (gpt-4o)
✅ Unified BaseAgent class for consistency
✅ Built-in error handling and retries
✅ Token usage tracking
✅ Azure Application Insights monitoring
✅ Memory-aware workflows
✅ Inter-agent communication

## Documentation

- Full deployment guide: [`AZURE_AGENTS_SETUP.md`](AZURE_AGENTS_SETUP.md)
- Deployment summary: [`AGENT_DEPLOYMENT_SUMMARY.md`](AGENT_DEPLOYMENT_SUMMARY.md)
- Azure config: [`backend/azure_agent_config.json`](backend/azure_agent_config.json)

---

**Status**: ✅ All agents operational on Azure  
**Region**: Australia East  
**Model**: gpt-4o  
**Last Updated**: February 28, 2026
