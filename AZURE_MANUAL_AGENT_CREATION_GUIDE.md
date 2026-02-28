# Manual Agent Creation in Azure AI Foundry

## Guide: Creating CRACLE Agents in Microsoft Azure AI Foundry

This guide walks you through manually creating and configuring all 7 CRACLE agents in Azure AI Foundry (formerly Azure AI Studio).

---

## Prerequisites

1. **Azure Subscription** with sufficient credits
2. **Azure OpenAI Service Resource** already created
3. **GPT-4o model deployed** in your Azure OpenAI resource
4. Access to **Azure AI Foundry** portal: https://ai.azure.com/

---

## Part 1: Azure OpenAI Setup (If Not Done)

### Step 1: Create Azure OpenAI Resource

1. Go to **Azure Portal**: https://portal.azure.com
2. Click **"Create a resource"**
3. Search for **"Azure OpenAI"**
4. Click **"Create"**

**Configuration:**
- **Subscription**: Select your subscription
- **Resource Group**: Create new `rg-CognitiveReasoningSys1` (or use existing)
- **Region**: Choose `Australia East` (or your preferred region)
- **Name**: `resource-cognitivereasoningsys1`
- **Pricing Tier**: `Standard S0`

5. Click **"Review + Create"** → **"Create"**
6. Wait 2-3 minutes for deployment

### Step 2: Deploy GPT-4o Model

1. Go to your Azure OpenAI resource
2. Click **"Model deployments"** in left menu
3. Click **"+ Create new deployment"**

**Deployment Settings:**
- **Model**: Select `gpt-4o` (latest version)
- **Deployment name**: `gpt-4o` (use this exact name for CRACLE)
- **Deployment type**: `Standard`
- **Tokens per Minute Rate Limit**: `80K` (or maximum available)
- **Content filter**: `Default`

4. Click **"Create"**
5. Wait for deployment (1-2 minutes)

### Step 3: Get API Credentials

1. In your Azure OpenAI resource, go to **"Keys and Endpoint"**
2. Copy the following:
   - **KEY 1** (API Key)
   - **Endpoint** (URL like `https://resource-cognitivereasoningsys1.openai.azure.com/`)
   - **Location/Region** (e.g., `australiaeast`)

3. **Update your `.env` file:**

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://resource-cognitivereasoningsys1.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_MODEL=gpt-4o
```

---

## Part 2: Azure AI Foundry Agent Setup

### Understanding Agent Configuration Fields

Before creating agents, here's what each configuration field means:

#### **Complete Field Checklist**

When creating an agent in Azure AI Foundry, you'll see these sections:

```
📋 Agent Details
   ├─ Name                    [Required] Unique agent identifier
   ├─ Description             [Optional] Brief purpose statement
   └─ Model                   [Required] Select GPT-4o deployment

📝 Instructions
   └─ System Prompt           [Required] Defines agent behavior & role

⚙️ Parameters
   ├─ Temperature             [Optional] 0.0-2.0, default 1.0
   ├─ Max Response            [Optional] Max tokens, default 2048
   ├─ Top P                   [Optional] 0.0-1.0, default 1.0
   ├─ Frequency Penalty       [Optional] -2.0 to 2.0, default 0
   └─ Presence Penalty        [Optional] -2.0 to 2.0, default 0

📚 Knowledge (0)             [Optional] Data sources for grounding
   ├─ Azure AI Search
   ├─ File uploads
   ├─ Azure Blob Storage
   └─ Web content

🔧 Actions (0)               [Optional] Functions & API calls
   ├─ REST API connections
   ├─ Custom functions
   ├─ Database queries
   └─ Power Automate flows

🤝 Connected Agents (0)      [Optional] Agent-to-agent handoffs
   └─ Select other agents for collaboration
```

---

#### **Basic Fields:**
- **Agent Name**: Unique identifier for your agent (e.g., `CRACLE-Memory-Agent`)
- **Description**: Brief explanation of agent's purpose (shown in agent list)
- **Model**: Which LLM deployment to use (select your `gpt-4o` deployment)

#### **Instructions (System Prompt):**
- **Purpose**: Defines the agent's role, responsibilities, and behavior
- **Best Practice**: Be specific, include examples, keep under 500 words
- **For CRACLE**: Each agent has a unique system prompt defining its role

#### **Model Parameters:**
- **Temperature** (0.0-2.0): Controls randomness/creativity
  - `0.0-0.3`: Very deterministic (good for grading, evaluation)
  - `0.4-0.7`: Balanced (good for structured tasks)
  - `0.8-1.0`: Creative (good for content generation)
  - `1.0+`: Very creative (experimental)
- **Max Response**: Maximum tokens in agent's response (500-4000 typical)
- **Top P** (0.0-1.0): Nucleus sampling (0.95 is standard)
- **Frequency Penalty** (-2.0 to 2.0): Reduces word repetition (0 = none, 0.3 = moderate)
- **Presence Penalty** (-2.0 to 2.0): Encourages new topics (0 = none, 0.2 = moderate)

#### **Knowledge (Data Grounding):**
- **Purpose**: Connect agents to data sources for factual grounding
- **Options**:
  - **Azure AI Search**: Index your data for semantic search
  - **File Upload**: Upload documents (PDF, Word, Excel, CSV, JSON)
  - **Azure Blob Storage**: Connect to existing blob containers
  - **Web URLs**: Scrape and index web content
- **When to Use**: When agent needs to cite specific documents or data
- **For CRACLE**: Not needed - agents use LLM knowledge + database queries in code

#### **Actions (Function Calling):**
- **Purpose**: Give agents ability to call external functions/APIs
- **Options**:
  - **API Connections**: Call REST APIs
  - **Custom Functions**: Execute Python/JavaScript functions
  - **Database Queries**: Query SQL databases
  - **Power Automate**: Trigger workflows
- **When to Use**: When agent needs to perform actions beyond text generation
- **For CRACLE**: Not needed - actions implemented directly in agent code

#### **Connected Agents (Multi-Agent Orchestration):**
- **Purpose**: Enable agent-to-agent handoffs and collaboration
- **How It Works**: Agent A can transfer the conversation thread to Agent B
- **Example**: Memory Agent hands off to Planner Agent for learning path creation
- **When to Use**: For complex workflows requiring specialized agents
- **For CRACLE**: Not needed - Orchestrator coordinates agents in code

#### **Advanced Settings:**
- **Stop Sequences**: Text patterns that stop generation (e.g., `\n\n\n`, `END`)
- **Response Format**: JSON mode (forces valid JSON output)
- **Safety Settings**: Content filtering levels (hate, sexual, violence, self-harm)

---

### Method A: Using Azure AI Foundry Agent Builder (Recommended)

#### Step 1: Access Azure AI Foundry

1. Go to **Azure AI Foundry**: https://ai.azure.com/
2. Sign in with your Azure account
3. Click **"Create new project"** (if you don't have one)

**Project Configuration:**
- **Project name**: `CRACLE-Agents`
- **Resource group**: `rg-CognitiveReasoningSys1`
- **Region**: `Australia East`
- **AI Services**: Link to your Azure OpenAI resource

#### Step 2: Create Agent 1 - Memory Agent

1. In your project, go to **"Agents"** tab
2. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Memory-Agent`
- **Description**: `Tracks user progress, cognitive evolution, and provides context to other agents`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Memory Agent in the CRACLE system. Your responsibilities:

1. User Progress Tracking: Monitor and analyze user learning paths, completed activities, quiz results, and simulation outcomes
2. Cognitive Evolution: Track changes in user's cognitive profile including learning speed, comprehension style, problem-solving approach, and knowledge retention
3. Context Provision: Provide historical context to other agents (Planner, Mentor, Evaluator) for personalized recommendations

Key Capabilities:
- Retrieve and summarize user's recent learning activities
- Identify cognitive patterns and learning preferences
- Generate comprehensive memory summaries for agent coordination
- Track milestone achievements and skill progression
- Analyze evaluation trends over time

Always maintain context awareness and provide actionable insights to other agents.
```

**Model Parameters:**
- **Temperature**: `0.7` (Balanced creativity/consistency)
- **Max Response**: `2000` tokens
- **Top P**: `0.95`
- **Frequency Penalty**: `0` (default)
- **Presence Penalty**: `0` (default)

**Knowledge (Optional - For Database Grounding):**
- Click **"+ Add"** to add data sources if you want the agent to access:
  - Azure AI Search indexes (for user history retrieval)
  - File uploads (CSV/JSON with user data)
  - Azure Blob Storage (for learning records)
- **For CRACLE**: Leave empty - Memory Agent queries PostgreSQL database directly via code

**Actions (Optional - For Tool Calls):**
- Click **"+ Add"** to give the agent abilities to:
  - Call external APIs
  - Execute functions
  - Query databases
- **For CRACLE**: Leave empty - Database queries handled in code (`backend/app/agents/memory.py`)

**Connected Agents (Optional - For Hand-offs):**
- Click **"+ Add"** to enable this agent to hand off conversations to:
  - Planner Agent (for creating learning paths)
  - Mentor Agent (for personalized guidance)
- **For CRACLE**: Leave empty - Orchestrator handles agent coordination

3. Click **"Create"** or **"Deploy"** button
4. Copy the **Agent ID** from the agent details page (save for later use)

#### Step 3: Create Agent 2 - Planner Agent

1. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Planner-Agent`
- **Description**: `Creates personalized learning paths based on user goals, skill level, and cognitive profile`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Planner Agent in the CRACLE system. Your responsibilities:

1. Learning Path Design: Create structured, personalized learning paths with clear milestones and progression
2. Adaptive Planning: Adjust plans based on user performance, cognitive profile, and feedback from Memory Agent
3. Resource Allocation: Determine optimal time distribution and activity sequencing

Key Capabilities:
- Design multi-module learning paths with 3-7 modules
- Set appropriate difficulty progression
- Define clear learning objectives and outcomes
- Recommend next activities based on user progress
- Integrate insights from Memory Agent about user's cognitive traits

Output structured learning plans in JSON format with modules, lessons, activities, and milestones.
```

**Model Parameters:**
- **Temperature**: `0.8` (Higher creativity for diverse learning paths)
- **Max Response**: `3000` tokens
- **Top P**: `0.95`
- **Frequency Penalty**: `0`
- **Presence Penalty**: `0`

**Knowledge:**
- **Optional**: Add educational standards, curriculum frameworks, or best practice documents
- **For CRACLE**: Leave empty - Planner uses LLM knowledge + Memory Agent context

**Actions:**
- **Optional**: Add functions to check course catalogs or learning resources
- **For CRACLE**: Leave empty - Planning logic in code

**Connected Agents:**
- **Recommended**: Connect to Memory Agent (for user context)
- **For CRACLE**: Leave empty - Orchestrator coordinates

3. Click **"Create"** or **"Deploy"**
4. Copy the **Agent ID**

#### Step 4: Create Agent 3 - Content Generator Agent

1. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Content-Generator-Agent`
- **Description**: `Generates engaging educational content including lessons, quizzes, and exercises`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Content Generator Agent in the CRACLE system. Your responsibilities:

1. Lesson Creation: Generate comprehensive, engaging lessons with examples, explanations, and visuals
2. Quiz Generation: Create assessments with multiple-choice and open-ended questions
3. Exercise Design: Develop practical exercises and coding challenges
4. Content Adaptation: Adjust content difficulty and style based on user's cognitive profile

Key Capabilities:
- Generate lessons with clear structure (introduction, main content, examples, summary)
- Create 5-10 quiz questions per topic with correct answers and explanations
- Design practical exercises with hints and solutions
- Use multiple formats (text, diagrams, code snippets, analogies)
- Adapt content complexity to user's skill level

Always provide engaging, clear, and pedagogically sound content.
```

**Model Parameters:**
- **Temperature**: `0.9` (Highest creativity for diverse content)
- **Max Response**: `4000` tokens
- **Top P**: `0.95`
- **Frequency Penalty**: `0.3` (Reduce repetition in content)
- **Presence Penalty**: `0.1` (Encourage topic diversity)

**Knowledge:**
- **Recommended**: Add educational resources, textbooks, example lessons
- **For CRACLE**: Leave empty - LLM generates original content

**Actions:**
- **Optional**: Add functions to generate diagrams, code snippets, or search for references
- **For CRACLE**: Leave empty - Content generated via LLM

**Connected Agents:**
- **Optional**: Connect to Planner Agent (for learning objectives)
- **For CRACLE**: Leave empty - Orchestrator provides context

3. Click **"Create"** or **"Deploy"**
4. Copy the **Agent ID**

#### Step 5: Create Agent 4 - Simulation Agent

1. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Simulation-Agent`
- **Description**: `Creates and manages interactive decision-making simulations and scenarios`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Simulation Agent in the CRACLE system. Your responsibilities:

1. Scenario Creation: Design realistic, engaging decision-making scenarios
2. Decision Processing: Evaluate user decisions and generate consequences
3. Adaptive Storytelling: Adjust scenario complexity and branching based on user choices
4. Outcome Analysis: Provide feedback on decision quality and reasoning

Key Capabilities:
- Create multi-step scenarios (3-5 decision points)
- Generate 3-4 decision options per step with varying consequences
- Provide realistic outcomes based on user choices
- Track decision-making patterns and cognitive approach
- Calculate quality scores for decisions (0-100)

Simulations should be engaging, educational, and encourage critical thinking.
```

**Model Parameters:**
- **Temperature**: `0.85` (High creativity for scenario variety)
- **Max Response**: `3000` tokens
- **Top P**: `0.95`
- **Frequency Penalty**: `0.2`
- **Presence Penalty**: `0.2`

**Knowledge:**
- **Optional**: Add case studies, real-world scenarios, decision frameworks
- **For CRACLE**: Leave empty - LLM generates scenarios

**Actions:**
- **Optional**: Add functions to track decision history or calculate scores
- **For CRACLE**: Leave empty - Session management in code

**Connected Agents:**
- **Recommended**: Connect to Evaluator Agent (for decision scoring)
- **For CRACLE**: Leave empty - Orchestrator coordinates

3. Click **"Create"** or **"Deploy"**
4. Copy the **Agent ID**

#### Step 6: Create Agent 5 - Evaluator Agent

1. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Evaluator-Agent`
- **Description**: `Evaluates user performance and updates cognitive profiles`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Evaluator Agent in the CRACLE system. Your responsibilities:

1. Performance Assessment: Evaluate quizzes, exercises, and simulation decisions
2. Cognitive Profiling: Analyze learning patterns and update user's cognitive profile
3. Scoring: Provide accurate scores with detailed explanations
4. Insights Generation: Identify strengths, weaknesses, and improvement areas

Key Capabilities:
- Grade quiz answers with percentage scores and per-question feedback
- Evaluate simulation decision quality and reasoning
- Analyze cognitive traits (analytical thinking, comprehension speed, retention)
- Provide actionable recommendations for improvement
- Update user's proficiency levels across topics

Always be fair, constructive, and insightful in evaluations.
```

**Model Parameters:**
- **Temperature**: `0.6` (Lower for consistency in grading)
- **Max Response**: `2500` tokens
- **Top P**: `0.9` (More deterministic)
- **Frequency Penalty**: `0`
- **Presence Penalty**: `0`

**Knowledge:**
- **Optional**: Add grading rubrics, assessment standards, cognitive science frameworks
- **For CRACLE**: Leave empty - Evaluation logic in code

**Actions:**
- **Optional**: Add functions to update user profiles or save scores to database
- **For CRACLE**: Leave empty - Database updates in code

**Connected Agents:**
- **Recommended**: Connect to Memory Agent (to update cognitive profile)
- **Recommended**: Connect to Mentor Agent (for feedback delivery)
- **For CRACLE**: Leave empty - Orchestrator coordinates

3. Click **"Create"** or **"Deploy"**
4. Copy the **Agent ID**

#### Step 7: Create Agent 6 - Mentor Agent

1. Click **"+ New Agent"**

**Basic Configuration:**
- **Agent Name**: `CRACLE-Mentor-Agent`
- **Description**: `Provides personalized guidance, explanations, and motivational support`
- **Model**: Select `gpt-4o` deployment

**System Instructions (Instructions):**

```
You are the Mentor Agent in the CRACLE system. Your responsibilities:

1. Personalized Guidance: Provide tailored advice based on user's cognitive profile and history
2. Concept Explanation: Explain topics clearly using appropriate analogies and examples
3. Motivational Support: Encourage users and help overcome learning obstacles
4. Socratic Dialogue: Ask guiding questions to promote deeper understanding

Key Capabilities:
- Answer user questions with clear, personalized explanations
- Adapt communication style to user's cognitive profile
- Provide encouragement and celebrate achievements
- Offer study strategies and learning tips
- Use context from Memory Agent to personalize interactions

Be supportive, clear, patient, and adaptive to each user's needs.
```

**Model Parameters:**
- **Temperature**: `0.8` (Warm, conversational tone)
- **Max Response**: `2000` tokens
- **Top P**: `0.95`
- **Frequency Penalty**: `0.1` (Avoid repetitive phrasing)
- **Presence Penalty**: `0.1` (Encourage topic exploration)

**Knowledge:**
- **Recommended**: Add educational resources, study techniques, motivational frameworks
- **For CRACLE**: Leave empty - LLM provides guidance

**Actions:**
- **Optional**: Add functions to retrieve user's learning history or recommend resources
- **For CRACLE**: Leave empty - Memory Agent provides context via orchestrator

**Connected Agents:**
- **Recommended**: Connect to Memory Agent (for personalization)
- **Recommended**: Connect to Planner Agent (for learning path questions)
- **For CRACLE**: Leave empty - Orchestrator coordinates all agent interactions

3. Click **"Create"** or **"Deploy"**
4. Copy the **Agent ID**

#### Step 8: Agent 7 - Orchestrator (Code-Based)

**Note:** The Orchestrator Agent is implemented in code (`backend/app/agents/orchestrator.py`) and doesn't need to be created in Azure AI Foundry. It coordinates the other 6 agents locally.

---

### Quick Reference: All Agent Configurations

| Agent | Temperature | Max Tokens | Top P | Purpose |
|-------|-------------|------------|-------|---------|
| **Memory** | 0.7 | 2000 | 0.95 | Track progress, retrieve context |
| **Planner** | 0.8 | 3000 | 0.95 | Design learning paths |
| **Content Generator** | 0.9 | 4000 | 0.95 | Create lessons, quizzes |
| **Simulation** | 0.85 | 3000 | 0.95 | Build decision scenarios |
| **Evaluator** | 0.6 | 2500 | 0.90 | Grade work, analyze performance |
| **Mentor** | 0.8 | 2000 | 0.95 | Provide guidance, answer questions |
| **Orchestrator** | N/A | N/A | N/A | Coordinate all agents (code-based) |

**Field Usage Summary:**
- **Knowledge**: ❌ Not used (database queries in code)
- **Actions**: ❌ Not used (functions in code)
- **Connected Agents**: ❌ Not used (orchestrator coordinates)

---

### When to Use Knowledge, Actions & Connected Agents

#### ✅ **Use Knowledge When:**
- You have a large document library agents should reference
- You want agents to cite specific sources
- You need grounding in company-specific data
- **Example**: Customer support agent accessing policy documents

#### ✅ **Use Actions When:**
- Agent needs to book appointments, send emails, create tickets
- Agent should query external systems (weather, stock prices)
- Agent needs to execute business logic
- **Example**: Travel booking agent calling airline APIs

#### ✅ **Use Connected Agents When:**
- Using Azure AI Foundry's native agent handoff (not custom orchestrator)
- Each agent has distinct, non-overlapping responsibilities
- Conversations need to transfer between specialized agents
- **Example**: Sales agent → Technical support agent → Billing agent

#### ❌ **CRACLE Uses Custom Orchestration Instead:**
- More control over agent coordination
- Better integration with FastAPI backend
- Enables live reasoning visualization
- Allows custom workflow logic

---

## Part 3: Connect Agents to CRACLE System

### Option A: Using Code (Current Implementation)

Your CRACLE system currently uses **direct Azure OpenAI API calls** through the `BaseAgent` class. This is already configured correctly.

**No additional Azure AI Foundry agent setup is required** because:
1. All agents inherit from `BaseAgent` which uses `AsyncAzureOpenAI`
2. Each agent has its own system prompt defined in code
3. The orchestrator coordinates agent interactions

**Your current setup is optimal** for the CRACLE architecture.

### Option B: Integrate Azure AI Foundry Agents (Advanced)

If you want to use Azure AI Foundry agents created above:

1. **Install Azure AI Agent SDK:**

```bash
cd backend
pip install azure-ai-agent
```

2. **Update `.env` with Agent IDs:**

```env
# Azure AI Foundry Agent IDs
AZURE_MEMORY_AGENT_ID=your_memory_agent_id
AZURE_PLANNER_AGENT_ID=your_planner_agent_id
AZURE_CONTENT_AGENT_ID=your_content_generator_agent_id
AZURE_SIMULATION_AGENT_ID=your_simulation_agent_id
AZURE_EVALUATOR_AGENT_ID=your_evaluator_agent_id
AZURE_MENTOR_AGENT_ID=your_mentor_agent_id
```

3. **Modify BaseAgent class** to use Azure AI Foundry Agent SDK instead of direct OpenAI calls (requires code refactoring)

---

## Part 4: Verification

### Test Azure OpenAI Connection

```bash
cd backend
python verify_azure_agents.py
```

Expected output:
```
✅ Azure OpenAI connection successful
✅ GPT-4o deployment accessible
✅ All 7 agents initialized
```

### Test API Endpoints

```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# In another terminal, test mentor chat
curl -X POST http://localhost:8000/api/v1/agents/mentor/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Hello!", "conversation_history": []}'
```

---

## Part 5: Monitoring & Management

### Azure Portal Monitoring

1. Go to Azure Portal → Your Azure OpenAI Resource
2. Click **"Metrics"** to view:
   - Total API Calls
   - Token Usage
   - Latency
   - Error Rates

3. Click **"Diagnostics settings"** to enable logging

### Azure AI Foundry Monitoring

1. Go to https://ai.azure.com/
2. Navigate to your project
3. View **"Agents"** tab to see all created agents
4. Click each agent to view:
   - Usage statistics
   - Conversation history
   - Performance metrics

### Cost Management

1. Azure Portal → **"Cost Management + Billing"**
2. View costs by:
   - Resource (Azure OpenAI)
   - Model (GPT-4o)
   - API calls

**Estimated Costs (as of Feb 2026):**
- GPT-4o: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Average CRACLE session: 5K-10K tokens = $0.15-$0.45 per session

---

## Part 6: Best Practices

### 1. System Prompt Optimization

- Keep prompts under 500 words
- Include specific role definitions
- Add examples of expected outputs
- Update prompts based on performance

### 2. Token Management

- Set `max_tokens` appropriately per agent
- Monitor token usage in Azure Portal
- Implement token budgets in code

### 3. Rate Limiting

- Configure TPM (Tokens Per Minute) limits in Azure OpenAI
- Implement retry logic with exponential backoff
- Use queuing for high-traffic periods

### 4. Security

- Rotate API keys every 90 days
- Use Azure Key Vault for secrets
- Enable diagnostic logging
- Implement rate limiting per user

### 5. Performance

- Cache common responses
- Use async/await for concurrent agent calls
- Monitor latency metrics
- Scale TPM quotas as needed

---

## Troubleshooting

### Issue: "Authentication failed"
**Solution:** 
- Verify API key in `.env` file
- Check key hasn't expired in Azure Portal
- Ensure correct endpoint URL (with trailing slash)

### Issue: "Model not found"
**Solution:**
- Verify deployment name is exactly `gpt-4o`
- Check deployment is active in Azure OpenAI resource
- Confirm API version is correct

### Issue: "Rate limit exceeded"
**Solution:**
- Increase TPM quota in Azure OpenAI deployment
- Implement request queuing
- Add exponential backoff retry logic

### Issue: "Agents not responding"
**Solution:**
- Check Azure OpenAI service health
- Verify network connectivity
- Review application logs for errors
- Test with simple prompt first

---

## Summary

### Current CRACLE Architecture ✅

Your system uses **Code-based agents** with **Azure OpenAI API**:

1. **BaseAgent class** → Calls Azure OpenAI GPT-4o
2. **6 specialized agents** → Inherit from BaseAgent
3. **Orchestrator** → Coordinates all agents
4. **WebSocket** → Streams reasoning in real-time

**This is the recommended approach** for CRACLE because:
- ✅ Full control over agent behavior
- ✅ Easier debugging and monitoring
- ✅ Better integration with FastAPI
- ✅ More flexible for live reasoning visualization

### Alternative: Azure AI Foundry Agents

If you created agents in Azure AI Foundry (Part 2), you can:
- Manage agents via web UI
- Use pre-built agent templates
- Monitor conversations in the portal

**However, integration requires:**
- SDK installation
- Code refactoring
- Additional API calls
- More complexity

---

## Next Steps

1. ✅ Verify your current setup works: `python verify_azure_agents.py`
2. ✅ Test live reasoning: Navigate to `/mentor` and ask a question
3. 📊 Set up Azure monitoring and alerts
4. 💰 Configure cost budgets in Azure Portal
5. 📚 Review agent performance metrics
6. 🔄 Iterate on system prompts based on user feedback

---

## Support Resources

- **Azure OpenAI Documentation**: https://learn.microsoft.com/azure/ai-services/openai/
- **Azure AI Foundry**: https://learn.microsoft.com/azure/ai-studio/
- **CRACLE Documentation**: See `AZURE_AGENTS_SETUP.md`
- **Live Reasoning Feature**: See `LIVE_REASONING_FEATURE.md`

---

**Last Updated:** February 28, 2026  
**CRACLE Version:** 2.0 with Live Reasoning  
**Azure Region:** Australia East
