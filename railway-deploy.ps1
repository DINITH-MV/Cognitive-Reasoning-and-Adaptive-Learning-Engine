# Railway Deployment Script for CRACLE (Windows PowerShell)

Write-Host "🚂 CRACLE Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayExists) {
    Write-Host "❌ Railway CLI not found" -ForegroundColor Red
    Write-Host "📦 Install it: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "🔗 Or visit: https://docs.railway.app/develop/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Railway CLI found" -ForegroundColor Green
Write-Host ""

# Login to Railway
Write-Host "🔐 Logging in to Railway..." -ForegroundColor Cyan
railway login
Write-Host ""

# Create new project or link existing
Write-Host "📁 Project Setup" -ForegroundColor Cyan
Write-Host "Choose an option:"
Write-Host "1) Create new Railway project"
Write-Host "2) Link existing Railway project"
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host "🆕 Creating new Railway project..." -ForegroundColor Cyan
    railway init
} elseif ($choice -eq "2") {
    Write-Host "🔗 Linking to existing project..." -ForegroundColor Cyan
    railway link
} else {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Project configured" -ForegroundColor Green
Write-Host ""

# Add PostgreSQL
Write-Host "🗄️  Adding PostgreSQL database..." -ForegroundColor Cyan
railway add --plugin postgresql
Write-Host "✅ PostgreSQL added (DATABASE_URL will be auto-set)" -ForegroundColor Green
Write-Host ""

# Add Redis
Write-Host "📦 Adding Redis cache..." -ForegroundColor Cyan
railway add --plugin redis
Write-Host "✅ Redis added (REDIS_URL will be auto-set)" -ForegroundColor Green
Write-Host ""

# Set environment variables
Write-Host "⚙️  Setting environment variables..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please provide the following values:" -ForegroundColor Yellow
Write-Host ""

$AZURE_ENDPOINT = Read-Host "Azure OpenAI Endpoint"
$AZURE_KEY = Read-Host "Azure OpenAI API Key" -AsSecureString
$AZURE_KEY_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($AZURE_KEY))
$JWT_SECRET = Read-Host "JWT Secret (32+ chars)" -AsSecureString
$JWT_SECRET_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($JWT_SECRET))

Write-Host ""
Write-Host "Setting variables..." -ForegroundColor Cyan

railway variables set AZURE_OPENAI_ENDPOINT="$AZURE_ENDPOINT"
railway variables set AZURE_OPENAI_API_KEY="$AZURE_KEY_Plain"
railway variables set AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
railway variables set AZURE_OPENAI_API_VERSION="2024-12-01-preview"
railway variables set AZURE_OPENAI_MODEL="gpt-4o"
railway variables set JWT_SECRET_KEY="$JWT_SECRET_Plain"
railway variables set JWT_ALGORITHM="HS256"
railway variables set JWT_ACCESS_TOKEN_EXPIRE_MINUTES="1440"
railway variables set ENVIRONMENT="production"
railway variables set LOG_LEVEL="INFO"

Write-Host ""
Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🚀 Ready to deploy!" -ForegroundColor Cyan
Write-Host ""
$deploy = Read-Host "Deploy now? (y/n)"

if ($deploy -eq "y") {
    Write-Host "🚀 Deploying to Railway..." -ForegroundColor Cyan
    railway up
    Write-Host ""
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Monitor deployment:" -ForegroundColor Cyan
    Write-Host "   railway logs"
    Write-Host ""
    Write-Host "🌐 Get deployment URL:" -ForegroundColor Cyan
    Write-Host "   railway domain"
    Write-Host ""
} else {
    Write-Host "⏸️  Deployment skipped" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy later, run:" -ForegroundColor Cyan
    Write-Host "   railway up"
    Write-Host ""
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your backend URL: railway domain"
Write-Host "2. Update ALLOWED_ORIGINS with your frontend URL"
Write-Host "3. Deploy frontend service with VITE_API_BASE_URL"
Write-Host "4. Test at: https://your-app.railway.app"
Write-Host ""
Write-Host "📚 Full guide: See RAILWAY_DEPLOYMENT.md" -ForegroundColor Cyan
