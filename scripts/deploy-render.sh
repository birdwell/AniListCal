#!/bin/bash

# AniListCal Render Deployment Setup Script
# This script helps you prepare your app for Render deployment (100% FREE)

set -e

echo "🆓 AniListCal Render Deployment Setup (FREE TIER)"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of your AniListCal project"
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production from template..."
    cp .env.production.example .env.production
    echo "⚠️  IMPORTANT: Edit .env.production with your actual values before deploying!"
else
    echo "✅ .env.production already exists"
fi

# Generate a strong session secret
if ! grep -q "generate_a_strong_random_secret_here" .env.production 2>/dev/null; then
    echo "✅ Session secret appears to be configured"
else
    echo "🔐 Generating strong session secret..."
    SESSION_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/generate_a_strong_random_secret_here/$SESSION_SECRET/" .env.production
    rm .env.production.bak
    echo "✅ Generated and set strong session secret"
fi

# Update PORT for Render (uses 10000)
if grep -q "PORT=5001" .env.production; then
    echo "🔧 Updating PORT for Render..."
    sed -i.bak "s/PORT=5001/PORT=10000/" .env.production
    rm .env.production.bak
    echo "✅ Set PORT=10000 for Render"
fi

# Create render.yaml for infrastructure as code
echo "📄 Creating render.yaml configuration..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: anilistcal
    env: node
    buildCommand: yarn build
    startCommand: yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000

databases:
  - name: anilistcal-db
    databaseName: anilistcal
    user: anilistcal
EOF

echo "✅ Created render.yaml"

# Test build locally
echo "🔨 Testing local build..."
if yarn build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo ""
echo "🎉 Setup complete! Next steps for FREE deployment:"
echo ""
echo "1. 🌐 Go to render.com and sign up (FREE, no credit card needed)"
echo ""
echo "2. 📝 Edit .env.production with:"
echo "   - ANILIST_CLIENT_ID and ANILIST_CLIENT_SECRET"
echo "   - OPENAI_API_KEY (if using AI features)"
echo ""
echo "3. 🚀 Deploy Web Service:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repo"
echo "   - Build Command: yarn build"
echo "   - Start Command: yarn start"
echo "   - Add environment variables from .env.production"
echo ""
echo "5. 🔑 Set up AniList OAuth:"
echo "   - Go to: https://anilist.co/settings/developer"
echo "   - Set redirect URI to: https://your-app-name.onrender.com/api/auth/callback"
echo ""
echo "6. 🗄️ Initialize database with session table (see RENDER_DEPLOYMENT.md)"
echo ""
echo "💰 COST: $0/month (FREE TIER)"
echo "📚 Full guide: See RENDER_DEPLOYMENT.md for detailed instructions"
echo ""
echo "🆓 Your app will be live at: https://your-app-name.onrender.com"
