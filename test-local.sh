#!/bin/bash

# Local test script to verify everything works before pushing to remote

echo "🧪 Testing local setup..."

# Check if docker-compose.yml is valid
echo "✅ Validating docker-compose.yml..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has errors"
    exit 1
fi

# Check if package.json is valid
echo "✅ Validating backend package.json..."
if node -e "JSON.parse(require('fs').readFileSync('./backend/package.json', 'utf8'))" > /dev/null 2>&1; then
    echo "✅ backend package.json is valid"
else
    echo "❌ backend package.json has errors"
    exit 1
fi

# Test database migration script syntax
echo "✅ Validating migration script..."
if bash -n migrate-db.sh > /dev/null 2>&1; then
    echo "✅ migrate-db.sh syntax is valid"
else
    echo "❌ migrate-db.sh has syntax errors"
    exit 1
fi

# Test deploy script syntax
echo "✅ Validating deploy script..."
if bash -n deploy.sh > /dev/null 2>&1; then
    echo "✅ deploy.sh syntax is valid"
else
    echo "❌ deploy.sh has syntax errors"
    exit 1
fi

echo "🎉 All tests passed! Ready to push to remote."
