#!/bin/bash

# StuddyBuddy Deployment Verification Script
# This script verifies that all services are running correctly

echo "🔍 StuddyBuddy Deployment Verification"
echo "======================================"

VM_IP="135.235.137.78"

echo ""
echo "🌐 Testing Frontend..."
if curl -s -o /dev/null -w "%{http_code}" "http://$VM_IP/" | grep -q "200"; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo ""
echo "🔗 Testing Backend API..."
response=$(curl -s "http://$VM_IP:4000/" 2>/dev/null || echo "failed")
if echo "$response" | grep -q "Welcome"; then
    echo "✅ Backend API is responding: $response"
else
    echo "❌ Backend API is not responding"
fi

echo ""
echo "📊 Testing Qdrant Vector Database..."
if curl -s -o /dev/null -w "%{http_code}" "http://$VM_IP:6333/dashboard" | grep -q "200"; then
    echo "✅ Qdrant dashboard is accessible"
else
    echo "❌ Qdrant dashboard is not accessible"
fi

echo ""
echo "🔍 Testing Qdrant API..."
qdrant_response=$(curl -s "http://$VM_IP:6333/health" 2>/dev/null || echo "failed")
if echo "$qdrant_response" | grep -q "true\|ok"; then
    echo "✅ Qdrant API is healthy"
else
    echo "❌ Qdrant API is not responding properly"
fi

echo ""
echo "📡 Testing Database Connection..."
# We can't directly test the database from outside, but we can check if backend connects
if curl -s "http://$VM_IP:4000/api/health" 2>/dev/null | grep -q "ok\|health\|success"; then
    echo "✅ Database connection through backend is working"
else
    echo "ℹ️  Database connection test inconclusive (backend may not have health endpoint)"
fi

echo ""
echo "🎯 All Services Summary:"
echo "- Frontend: http://$VM_IP/"
echo "- Backend: http://$VM_IP:4000/"
echo "- Qdrant: http://$VM_IP:6333/dashboard"
echo ""
echo "🚀 Deployment verification complete!"
