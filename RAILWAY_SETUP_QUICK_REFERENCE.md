# Railway Project Setup - Quick Reference

## 📝 Project Name
```
CRACLE
```

## 📖 Project Description (Use This in Railway)
```
AI-powered adaptive learning platform with 7 specialized agents. Creates personalized learning paths, generates custom content, and adapts to your cognitive style in real-time. Built with FastAPI, React, and Azure OpenAI GPT-4o.
```

## 🏷️ Tags (Add in Railway Project Settings)
```
ai, education, learning, adaptive-learning, openai, gpt4, fastapi, react, python, machine-learning
```

## 🌐 Repository URL
```
https://github.com/yourusername/Cognitive-Reasoning-and-Adaptive-Learning-Engine
```

## 📦 Services to Create

### Service 1: Backend
- **Name**: `cracle-backend`
- **Description**: FastAPI backend with 7 AI agents
- **Root Directory**: `backend`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/api/v1/health`

### Service 2: Frontend  
- **Name**: `cracle-frontend`
- **Description**: React frontend with live reasoning visualization
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l $PORT`

### Service 3: Database
- **Type**: PostgreSQL
- **Name**: `cracle-database`
- **Plugin**: Railway PostgreSQL (auto-configured)

### Service 4: Cache
- **Type**: Redis
- **Name**: `cracle-redis`
- **Plugin**: Railway Redis (auto-configured)

---

## 🔑 Environment Variables

### Backend Service

Copy and paste these into Railway Dashboard → Backend Service → Variables:

```env
# Azure OpenAI (REQUIRED - Copy from your .env)
AZURE_OPENAI_ENDPOINT=https://resource-cognitivereasoningsys1.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_MODEL=gpt-4o

# JWT Authentication (REQUIRED - Generate new secret)
JWT_SECRET_KEY=generate-with-openssl-rand-hex-32
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Application (REQUIRED)
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS (UPDATE after deploying frontend)
ALLOWED_ORIGINS=https://your-frontend-url.railway.app

# Azure Monitoring (OPTIONAL)
AZURE_APP_INSIGHTS_CONNECTION_STRING=your_connection_string
ENABLE_TELEMETRY=true
```

**⚠️ IMPORTANT:** After deploying frontend, update `ALLOWED_ORIGINS` with your frontend URL!

### Frontend Service

Copy and paste these into Railway Dashboard → Frontend Service → Variables:

```env
# API Configuration (UPDATE after deploying backend)
VITE_API_BASE_URL=https://your-backend-url.railway.app/api/v1
VITE_WS_BASE_URL=wss://your-backend-url.railway.app/api/v1

# Application
VITE_APP_NAME=CRACLE
VITE_APP_VERSION=2.0
```

**⚠️ IMPORTANT:** Update these URLs after your backend deploys!

---

## 🚀 Deployment Steps (In Order)

### Step 1: Create Project
1. Go to https://railway.app/new
2. Click **"Empty Project"**
3. Name it: `CRACLE`
4. Add description from above

### Step 2: Add Database & Cache
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Click **"+ New"** → **"Database"** → **"Add Redis"**
3. Wait for provisioning (1-2 minutes)

### Step 3: Deploy Backend
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Name service: `cracle-backend`
4. Go to **Settings**:
   - Set Root Directory: `backend`
   - Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Go to **Variables**: Add all backend environment variables (except DATABASE_URL, REDIS_URL, PORT)
6. Click **"Deploy"**
7. Wait for deployment (3-5 minutes)
8. Copy the backend URL from **Settings → Domains**

### Step 4: Deploy Frontend
1. Click **"+ New"** → **"GitHub Repo"**  
2. Select your repository again
3. Name service: `cracle-frontend`
4. Go to **Settings**:
   - Set Root Directory: `frontend`
   - Set Build Command: `npm install && npm run build`
   - Set Start Command: `npx serve -s dist -l $PORT`
5. Go to **Variables**: Add frontend environment variables with your backend URL
6. Click **"Deploy"**
7. Wait for deployment (2-4 minutes)
8. Copy the frontend URL from **Settings → Domains**

### Step 5: Update CORS
1. Go to Backend Service → **Variables**
2. Update `ALLOWED_ORIGINS` with your frontend URL
3. Redeploy backend (it will auto-redeploy)

### Step 6: Test Deployment
1. Visit your frontend URL: `https://your-frontend-url.railway.app`
2. Register a new account
3. Try creating a learning plan
4. Check live reasoning visualization in Mentor chat

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend health check: `https://your-backend-url.railway.app/api/v1/health`
- [ ] API docs accessible: `https://your-backend-url.railway.app/docs`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Learning plan creation works
- [ ] Mentor chat works
- [ ] WebSocket connects (green indicator in live reasoning)
- [ ] No CORS errors in browser console
- [ ] Database migrations completed (check backend logs)

---

## 🐛 Common Issues & Fixes

### Issue: "Database connection failed"
**Fix:** Ensure PostgreSQL plugin is added. Railway auto-sets `DATABASE_URL`.

### Issue: "CORS error in browser"
**Fix:** Update backend `ALLOWED_ORIGINS` with exact frontend URL (no trailing slash).

### Issue: "Frontend can't reach backend"
**Fix:** Check `VITE_API_BASE_URL` in frontend variables matches backend URL exactly.

### Issue: "WebSocket connection failed"
**Fix:** Ensure `VITE_WS_BASE_URL` uses `wss://` (not `ws://`) and matches backend domain.

### Issue: "502 Bad Gateway"
**Fix:** Check backend logs for errors. Ensure all required environment variables are set.

---

## 📊 Cost Estimate

**Hobby Plan** ($5/month):
- Good for testing
- 512MB RAM per service
- 500 execution hours

**Pro Plan** ($20/month) - **Recommended**:
- Production-ready
- 8GB RAM available
- Unlimited execution hours
- Custom domains included

**Estimated Total**:
- Backend + Frontend + PostgreSQL + Redis: **$15-25/month**
- Azure OpenAI API: **$20-50/month** (usage-based)
- **Total: $35-75/month**

---

## 🔗 Helpful Railway CLI Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to existing project
railway link

# View logs
railway logs

# Get deployment URL
railway domain

# Run command with Railway env vars
railway run python manage.py migrate

# Deploy manually
railway up
```

---

## 📞 Support

- **Full Guide**: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- **Project Docs**: See [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)
- **Azure Setup**: See [AZURE_MANUAL_AGENT_CREATION_GUIDE.md](AZURE_MANUAL_AGENT_CREATION_GUIDE.md)
- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway

---

**Ready to deploy? Follow the steps above!** 🚀

*Last Updated: February 28, 2026*
