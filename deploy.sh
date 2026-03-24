#!/bin/bash
# Automated deployment script for Dawa Mashinani

set -e

echo "🚀 Dawa Mashinani Deployment Script"
echo "===================================="

# Verify environment
if [ ! -d ".git" ]; then
  echo "❌ Not a git repository. Please run this from project root."
  exit 1
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected. Please commit all changes first."
  git status
  exit 1
fi

echo "✅ Git clean"

# Build the project
echo ""
echo "📦 Building frontend..."
npm run build
echo "✅ Frontend build complete"

# Verify build output
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo ""
echo "📋 Deployment Options:"
echo "1) Deploy Frontend to Vercel"
echo "2) Deploy Backend to Supabase"
echo "3) Deploy All (Frontend + Backend)"
echo ""
read -p "Select option (1-3): " option

case $option in
  1)
    echo ""
    echo "🔵 Frontend Deployment to Vercel"
    echo "================================="
    echo "To deploy to Vercel:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Run: vercel --prod"
    echo "3. Set environment variables in Vercel dashboard:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_PUBLISHABLE_KEY"
    echo "   - VITE_GEMINI_API_KEY"
    ;;
  2)
    echo ""
    echo "🟢 Backend Deployment to Supabase"
    echo "=================================="
    echo "To deploy to Supabase:"
    echo "1. Install Supabase CLI: npm i -g supabase"
    echo "2. Login: supabase login"
    echo "3. Link project: supabase link --project-ref vqckqklspuikiehamoij"
    echo "4. Push migrations: supabase db push"
    echo "5. Deploy functions: supabase functions deploy"
    ;;
  3)
    echo ""
    echo "🌐 Full Deployment (Frontend + Backend)"
    echo "======================================="
    echo ""
    echo "FRONTEND (Vercel):"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Run: vercel --prod"
    echo ""
    echo "BACKEND (Supabase):"
    echo "1. Install Supabase CLI: npm i -g supabase"
    echo "2. Login: supabase login"
    echo "3. Link project: supabase link --project-ref vqckqklspuikiehamoij"
    echo "4. Push migrations: supabase db push"
    echo "5. Deploy functions: supabase functions deploy"
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo ""
echo "📖 Full instructions available in DEPLOYMENT.md"
