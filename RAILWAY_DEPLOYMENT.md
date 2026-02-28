# 🚂 Deploy CRACLE to Railway

Complete guide to deploy your Cognitive Reasoning and Adaptive Learning Engine to Railway.

---

## 📋 Prerequisites

1. **Railway Account**: Sign up at https://railway.app/
2. **GitHub Account**: Connect your repo to Railway
3. **Azure OpenAI**: Your existing Azure OpenAI credentials (already configured)

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your `Cognitive-Reasoning-and-Adaptive-Learning-Engine` repository
4. Railway will detect the project structure

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates:
   - Database name: `railway`
   - Username: `postgres`
   - Password: Auto-generated
   - Connection URL: Auto-generated as `DATABASE_URL`

**Note:** Railway automatically injects `DATABASE_URL` environment variable. No manual configuration needed!

### Step 3: Add Redis

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway automatically creates `REDIS_URL` environment variable

### Step 4: Configure Backend Service

1. Click **"+ New"** → **"Empty Service"**
2. Name it **"CRACLE-Backend"**
3. Click **"Settings"** tab
4. Under **"Source"**, connect to your GitHub repo
5. Set **"Root Directory"**: `backend`
6. Set **"Start Command"**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 5: Configure Environment Variables

Click **"Variables"** tab and add:

```env
# Azure OpenAI (copy from your existing .env)
AZURE_OPENAI_ENDPOINT=https://resource-cognitivereasoningsys1.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_MODEL=gpt-4o

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App Configuration
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app,https://cracle.com
LOG_LEVEL=INFO

# Database (automatically set by Railway PostgreSQL plugin)
# DATABASE_URL=postgresql://... (Railway sets this automatically)

# Redis (automatically set by Railway Redis plugin)
# REDIS_URL=redis://... (Railway sets this automatically)

# Azure Monitoring (optional but recommended)
AZURE_APP_INSIGHTS_CONNECTION_STRING=your_connection_string
ENABLE_TELEMETRY=true
```

**Important:** Railway automatically provides:
- `DATABASE_URL` (from PostgreSQL plugin)
- `REDIS_URL` (from Redis plugin)
- `PORT` (assigned by Railway, usually 8000)

You **don't need to set these manually**.

### Step 6: Configure Frontend Service

1. Click **"+ New"** → **"Empty Service"**
2. Name it **"CRACLE-Frontend"**
3. Click **"Settings"** tab
4. Set **"Root Directory"**: `frontend`
5. Set **"Build Command"**: `npm install && npm run build`
6. Set **"Start Command"**: `npx serve -s dist -l $PORT`

**Frontend Environment Variables:**

```env
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api/v1
VITE_WS_BASE_URL=wss://your-backend-domain.railway.app/api/v1
```

### Step 7: Update CORS Settings

After getting your frontend URL from Railway:

1. Go to backend service → **"Variables"**
2. Update `ALLOWED_ORIGINS`:
   ```env
   ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
   ```

---

## 🔧 Advanced Configuration

### Custom Domains (Optional)

1. Go to backend service → **"Settings"** → **"Domains"**
2. Click **"+ Custom Domain"**
3. Add your domain: `api.cracle.com`
4. Add DNS CNAME record pointing to Railway domain
5. Repeat for frontend: `app.cracle.com`

### Database Migrations

Railway runs migrations automatically on deployment. Ensure your Dockerfile includes:

```dockerfile
# Already in your backend/Dockerfile
RUN alembic upgrade head
```

### Monitoring & Logs

1. **View Logs**: Click service → **"Deployments"** → Select deployment → **"View Logs"**
2. **Metrics**: Railway provides CPU, Memory, Network metrics in dashboard
3. **Azure Insights**: Your existing Azure Application Insights still works

### Scaling

1. Go to service → **"Settings"** → **"Resources"**
2. Upgrade plan for:
   - More memory (default: 512MB → upgrade to 2GB)
   - More CPU (default: 1 vCPU → upgrade to 2 vCPU)
   - Autoscaling (available on Pro plan)

---

## 💰 Pricing Estimate

### Hobby Plan ($5/month)
- ✅ Good for development/testing
- 512MB RAM, 1 vCPU per service
- 500 hours execution time
- PostgreSQL & Redis included

### Pro Plan ($20/month)
- ✅ **Recommended for production**
- 8GB RAM, 8 vCPU available
- Unlimited execution time
- Priority support
- Custom domains
- Autoscaling

**Estimated Monthly Cost for CRACLE:**
- Backend service: ~$10-15
- Frontend service: ~$5-10
- PostgreSQL: Included
- Redis: Included
- **Total: $15-25/month** (Pro plan)

**Plus Azure OpenAI costs:**
- ~$0.03 per 1K input tokens
- ~$0.06 per 1K output tokens
- Estimate: $20-50/month for moderate usage

---

## 🔍 Troubleshooting

### Issue: Backend deployment fails

**Solution:**
1. Check logs: Service → Deployments → View Logs
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is available (PostgreSQL plugin added)
4. Check build command: `pip install -r requirements.txt`

### Issue: Database connection error

**Solution:**
1. Verify PostgreSQL plugin is added
2. Check `DATABASE_URL` is in environment variables (auto-set by Railway)
3. Your code uses `settings.database_url` from env vars
4. Test connection: `railway run python -c "from app.db.database import engine; print('Connected!')"`

### Issue: Frontend can't connect to backend

**Solution:**
1. Copy backend Railway URL (e.g., `https://cracle-backend-production.up.railway.app`)
2. Update frontend env var:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api/v1
   ```
3. Update backend CORS:
   ```env
   ALLOWED_ORIGINS=https://your-frontend-url.railway.app
   ```
4. Redeploy both services

### Issue: WebSocket connection fails

**Solution:**
1. Ensure backend URL uses `wss://` (not `ws://`) in production
2. Update frontend:
   ```env
   VITE_WS_BASE_URL=wss://your-backend-url.railway.app/api/v1
   ```
3. Railway automatically handles WebSocket upgrades

### Issue: High memory usage

**Solution:**
1. Increase memory: Service → Settings → Resources → Increase memory
2. Add worker limits in backend:
   ```python
   # app/main.py
   uvicorn.run(app, host="0.0.0.0", port=PORT, workers=2)
   ```

---

## 📦 Deployment Checklist

Before going live:

- [ ] PostgreSQL database added
- [ ] Redis cache added
- [ ] All environment variables configured
- [ ] `ALLOWED_ORIGINS` includes frontend URL
- [ ] Frontend `VITE_API_BASE_URL` points to backend
- [ ] Database migrations run successfully
- [ ] Test user registration: `POST /api/v1/auth/register`
- [ ] Test user login: `POST /api/v1/auth/login`
- [ ] Test learning plan creation: `POST /api/v1/agents/learning-plan`
- [ ] Test mentor chat: `POST /api/v1/agents/mentor/chat`
- [ ] Test WebSocket: Connect to `/api/v1/ws/reasoning/{session_id}`
- [ ] Verify live reasoning visualization works
- [ ] Check Azure OpenAI costs in Azure Portal
- [ ] Set up cost alerts in Azure Portal
- [ ] Enable Railway notifications for deployments
- [ ] Test on mobile devices

---

## 🔄 CI/CD with GitHub

Railway automatically deploys on every push to `main` branch.

**To customize:**

1. Go to service → **"Settings"** → **"Deploy Triggers"**
2. Options:
   - **Deploy on push**: Automatic deployment (default)
   - **Deploy on PR**: Deploy preview environments
   - **Manual deployment**: Require manual trigger

**Recommended setup:**
- `main` branch → Production deployment
- `develop` branch → Staging environment
- Pull requests → Preview deployments

---

## 🎯 Post-Deployment Steps

### 1. Verify Deployment

```bash
# Test backend health
curl https://your-backend-url.railway.app/api/v1/health

# Expected response:
# {"status": "healthy", "version": "2.0", "agents": 7}
```

### 2. Create First User

```bash
curl -X POST https://your-backend-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cracle.com",
    "password": "SecurePassword123!",
    "full_name": "CRACLE Admin"
  }'
```

### 3. Test Learning Plan

```bash
# Login first to get token
TOKEN=$(curl -X POST https://your-backend-url.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cracle.com", "password": "SecurePassword123!"}' \
  | jq -r '.access_token')

# Create learning plan
curl -X POST https://your-backend-url.railway.app/api/v1/agents/learning-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Learn Python programming",
    "current_level": "beginner",
    "time_commitment": "5 hours per week"
  }'
```

### 4. Monitor Performance

- **Railway Dashboard**: Service metrics, logs, deployments
- **Azure Portal**: OpenAI API usage, costs, latency
- **Application Insights**: Error tracking, performance monitoring

---

## 🌟 Production Best Practices

### 1. Environment Separation

Create separate Railway projects:
- **CRACLE-Production**: Main app
- **CRACLE-Staging**: Testing environment

### 2. Database Backups

Railway automatically backs up PostgreSQL:
- Point-in-time recovery (7 days)
- Manual snapshots available

**To enable automated backups:**
1. Go to PostgreSQL service → **"Data"** → **"Backups"**
2. Enable **"Automatic Backups"**

### 3. Security

```env
# Use strong secrets
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>

# Restrict CORS
ALLOWED_ORIGINS=https://app.cracle.com

# Enable security headers
SECURE_HEADERS=true
```

### 4. Monitoring Alerts

**Railway:**
- Service → Settings → Notifications
- Enable: Deployment failed, Service crashed, High memory usage

**Azure:**
- Set cost alerts in Azure Portal
- Monitor token usage daily
- Set up Application Insights alerts for errors

### 5. Rate Limiting

Already configured in your backend:
```python
# app/main.py
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # 100 requests per minute per IP
    ...
```

---

## 📊 Optimization Tips

### 1. Reduce Azure OpenAI Costs

- Cache common responses in Redis
- Use shorter max_tokens for simpler queries
- Implement request debouncing in frontend
- Monitor token usage via Azure Portal

### 2. Improve Response Times

- Enable Redis caching for user context
- Use connection pooling (already configured)
- Optimize database queries with indexes
- Consider CDN for frontend assets (Railway CDN included)

### 3. Scale Smart

Start small and scale based on metrics:
- **< 100 users**: Hobby plan ($5/month)
- **100-1000 users**: Pro plan with 1GB RAM ($20/month)
- **1000+ users**: Pro plan with autoscaling ($50+/month)

---

## 🆘 Support Resources

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **CRACLE GitHub**: Your repository issues
- **Azure Support**: https://portal.azure.com/ → Support

---

## 🎉 You're Live!

Once deployed, share your app:
- Production URL: `https://cracle-frontend-production.up.railway.app`
- Custom Domain: `https://app.cracle.com` (if configured)
- API Docs: `https://your-backend-url.railway.app/docs`

**Next Steps:**
1. Test all features end-to-end
2. Invite beta users
3. Monitor Azure OpenAI costs
4. Collect user feedback
5. Iterate and improve!

---

**Last Updated:** February 28, 2026  
**CRACLE Version:** 2.0 with Live Reasoning  
**Railway Support:** Full Docker + PostgreSQL + Redis
