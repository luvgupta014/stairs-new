#!/bin/bash

# STAIRS Project - Quick Deployment Script for Railway
# Run this script to prepare your project for Railway deployment

echo "🚀 Preparing STAIRS Project for Railway Deployment..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git branch -M main"
    echo "   git remote add origin https://github.com/luvgupta014/stairs-new.git"
    echo "   git push -u origin main"
    exit 1
fi

# Add and commit deployment files
echo "📁 Adding deployment files..."
git add .
git commit -m "Add Railway deployment configuration"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Project prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app and sign up"
echo "2. Click 'Start a New Project'"
echo "3. Select 'Deploy from GitHub repo'"
echo "4. Choose your stairs-new repository"
echo "5. Follow the RAILWAY_DEPLOYMENT.md guide"
echo ""
echo "📖 Detailed instructions: See RAILWAY_DEPLOYMENT.md"
echo ""
echo "🎉 Your event result upload system will work perfectly on Railway!"