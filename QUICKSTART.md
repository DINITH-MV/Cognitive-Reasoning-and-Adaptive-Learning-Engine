# Quick Start Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm (for local frontend development)
- Python 3.12+ (for local backend development)
- Azure OpenAI API access

## Setup Steps

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd Cognitive-Reasoning-and-Adaptive-Learning-Engine

# Create environment file
cp .env.example .env

# Edit .env with your Azure AI credentials
# At minimum, set:
# - AZURE_OPENAI_ENDPOINT
# - AZURE_OPENAI_API_KEY
# - AZURE_OPENAI_DEPLOYMENT_NAME
```

### 2. Run with Docker (Recommended)

```bash
# Start all services (frontend, backend, postgres, redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 3. Run Locally (Development)

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (if needed)
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## First Steps

1. Register a new account at http://localhost:3000/register
2. Log in with your credentials
3. Create your first learning plan from the dashboard
4. Chat with the AI mentor
5. Try a simulation
6. View analytics and monitoring

## Troubleshooting

### Backend won't start
- Check that PostgreSQL is running
- Verify database credentials in .env
- Check that Redis is accessible

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check CORS settings in backend/.env
- Check browser console for errors

### Azure AI errors
- Verify your API key and endpoint
- Check deployment name matches your Azure resource
- Ensure you have sufficient quota

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
black .
flake8 .

# Frontend linting
cd frontend
npm run lint
```

## Production Deployment

1. Set `ENVIRONMENT=production` in .env
2. Generate strong `SECRET_KEY` for JWT
3. Use production database credentials
4. Enable HTTPS/SSL
5. Configure proper CORS origins
6. Set up monitoring and logging
7. Use docker-compose for orchestration

## Support

For issues and questions:
- Check API documentation at http://localhost:8000/docs
- Review logs: `docker-compose logs`
- Check the README.md for architecture details
