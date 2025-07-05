#!/bin/bash

# Fast Deploy Script for StuddyBuddy
# This script provides a quick deployment option with minimal checks

set -e

echo "⚡ Starting fast deployment..."

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and deploy with optimizations
echo "🔨 Building with optimizations..."
docker-compose build --no-cache

echo "🚀 Deploying services..."
docker-compose up -d --remove-orphans

echo "⏳ Quick health check..."
sleep 10

# Basic health check
if curl -f --max-time 5 http://localhost:4000/ > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️ Backend may still be starting"
fi

if curl -f --max-time 5 http://localhost/ > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️ Frontend may still be starting"
fi

echo "🎉 Fast deployment completed!"
echo "📱 Check your application at:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:4000"
