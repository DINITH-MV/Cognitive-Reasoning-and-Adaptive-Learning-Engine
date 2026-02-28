#!/bin/bash
# Railway Deployment Script for CRACLE

echo "🚂 CRACLE Railway Deployment Helper"
echo "===================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "📦 Install it: npm install -g @railway/cli"
    echo "🔗 Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login
echo ""

# Create new project or link existing
echo "📁 Project Setup"
echo "Choose an option:"
echo "1) Create new Railway project"
echo "2) Link existing Railway project"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo "🆕 Creating new Railway project..."
    railway init
elif [ "$choice" == "2" ]; then
    echo "🔗 Linking to existing project..."
    railway link
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "✅ Project configured"
echo ""

# Add PostgreSQL
echo "🗄️  Adding PostgreSQL database..."
railway add --plugin postgresql
echo "✅ PostgreSQL added (DATABASE_URL will be auto-set)"
echo ""

# Add Redis
echo "📦 Adding Redis cache..."
railway add --plugin redis
echo "✅ Redis added (REDIS_URL will be auto-set)"
echo ""

# Set environment variables
echo "⚙️  Setting environment variables..."
echo ""
echo "Please provide the following values:"
echo ""

read -p "Azure OpenAI Endpoint: " AZURE_ENDPOINT
read -p "Azure OpenAI API Key: " AZURE_KEY
read -p "JWT Secret (32+ chars): " JWT_SECRET

echo ""
echo "Setting variables..."

railway variables set AZURE_OPENAI_ENDPOINT="$AZURE_ENDPOINT"
railway variables set AZURE_OPENAI_API_KEY="$AZURE_KEY"
railway variables set AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
railway variables set AZURE_OPENAI_API_VERSION="2024-12-01-preview"
railway variables set AZURE_OPENAI_MODEL="gpt-4o"
railway variables set JWT_SECRET_KEY="$JWT_SECRET"
railway variables set JWT_ALGORITHM="HS256"
railway variables set JWT_ACCESS_TOKEN_EXPIRE_MINUTES="1440"
railway variables set ENVIRONMENT="production"
railway variables set LOG_LEVEL="INFO"

echo ""
echo "✅ Environment variables set"
echo ""

# Deploy
echo "🚀 Ready to deploy!"
echo ""
read -p "Deploy now? (y/n): " deploy

if [ "$deploy" == "y" ]; then
    echo "🚀 Deploying to Railway..."
    railway up
    echo ""
    echo "✅ Deployment initiated!"
    echo ""
    echo "📊 Monitor deployment:"
    echo "   railway logs"
    echo ""
    echo "🌐 Get deployment URL:"
    echo "   railway domain"
    echo ""
else
    echo "⏸️  Deployment skipped"
    echo ""
    echo "To deploy later, run:"
    echo "   railway up"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Get your backend URL: railway domain"
echo "2. Update ALLOWED_ORIGINS with your frontend URL"
echo "3. Deploy frontend service with VITE_API_BASE_URL"
echo "4. Test at: https://your-app.railway.app"
echo ""
echo "📚 Full guide: See RAILWAY_DEPLOYMENT.md"
