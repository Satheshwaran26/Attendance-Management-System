#!/bin/bash

echo "🚀 Deploying Attendance System Backend to Render..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first."
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    git status --short
    echo ""
    echo "Run: git add . && git commit -m 'Your commit message'"
    exit 1
fi

# Push to remote if not already pushed
echo "📤 Pushing latest changes to remote repository..."
git push origin main

echo ""
echo "✅ Code pushed to repository!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to https://render.com"
echo "2. Create new Web Service"
echo "3. Connect your repository"
echo "4. Select the 'attendances_system/backend' directory"
echo "5. Set environment variables:"
echo "   - DATABASE_URL=your_neon_connection_string"
echo "   - NODE_ENV=production"
echo "   - PORT=5000"
echo "6. Deploy!"
echo ""
echo "🌐 Your backend will be available at:"
echo "   https://attendance-system-backend.onrender.com"
echo ""
echo "📱 Frontend is already configured to use this URL in production"
