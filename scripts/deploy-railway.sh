#!/bin/bash

# AniListCal Railway Deployment Setup Script
# This script helps you prepare your app for Railway deployment

set -e

echo "🚂 AniListCal Railway Deployment Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of your AniListCal project"
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI is already installed"
fi

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

# Test build locally
echo "🔨 Testing local build..."
if yarn build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📝 Edit .env.production with your actual values:"
echo "   - ANILIST_CLIENT_ID and ANILIST_CLIENT_SECRET"
echo "   - OPENAI_API_KEY (if using AI features)"
echo ""
echo "2. 🌐 Create AniList OAuth app:"
echo "   - Go to: https://anilist.co/settings/developer"
echo "   - Set redirect URI to: https://your-app-name.railway.app/api/auth/callback"
echo ""
echo "3. 🚂 Deploy to Railway:"
echo "   - Go to: https://railway.app"
echo "   - Create new project"
echo "   - Deploy from GitHub repo"
echo "   - Set environment variables from .env.production"
echo ""
echo "📚 Full guide: See DEPLOYMENT_GUIDE.md for detailed instructions"
