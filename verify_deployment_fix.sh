#!/bin/bash

# Quick verification script to check deployment configuration
# Run this after deployment to verify the fix worked

echo "🔍 Verifying Deployment Configuration..."
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
    
    # Check POSTGRES_URI
    POSTGRES_URI=$(grep "^POSTGRES_URI=" .env | cut -d'=' -f2)
    
    if [[ $POSTGRES_URI == *"postgres:5432"* ]]; then
        echo -e "${GREEN}✓${NC} POSTGRES_URI correctly uses 'postgres:5432'"
        echo "   Current value: $POSTGRES_URI"
    elif [[ $POSTGRES_URI == *"localhost:5432"* ]]; then
        echo -e "${RED}✗${NC} POSTGRES_URI incorrectly uses 'localhost:5432'"
        echo "   Current value: $POSTGRES_URI"
        echo -e "${YELLOW}⚠️${NC}  This will cause database connection failures!"
        exit 1
    else
        echo -e "${YELLOW}?${NC} POSTGRES_URI has unexpected format"
        echo "   Current value: $POSTGRES_URI"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    exit 1
fi

# Check if containers are running
echo ""
echo "🐳 Checking Docker containers..."
echo "================================"

if command -v docker-compose &> /dev/null; then
    echo "Container status:"
    docker-compose ps
    
    echo ""
    echo "🔗 Checking backend database connection..."
    
    # Try to get a response from backend
    if curl -f --max-time 10 http://localhost:4000/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend is responding"
    else
        echo -e "${YELLOW}⚠️${NC}  Backend may not be ready yet (this is normal right after deployment)"
    fi
else
    echo -e "${YELLOW}?${NC} docker-compose not found"
fi

echo ""
echo "🎉 Configuration verification completed!"
echo ""
echo "If POSTGRES_URI shows 'postgres:5432', the fix is working correctly."
echo "If it shows 'localhost:5432', there may still be an issue."
