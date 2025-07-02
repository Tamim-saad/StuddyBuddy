#!/bin/bash

echo "🔍 Testing annotation persistence after reload..."

# Check if annotations exist for file ID 7 (which we saw in the console)
echo "📋 Checking saved annotations in backend..."

curl -s -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:5000/api/annotations/7" | jq '.' 2>/dev/null || \
  echo "⚠️  Could not fetch annotations (this is expected if auth token is needed)"

echo ""
echo "🧪 Test Steps:"
echo "1. Open the browser and go to http://localhost:3000"
echo "2. Navigate to the file with existing annotations"
echo "3. Click Edit (pencil icon) to open the annotation viewer"
echo "4. The console should show:"
echo "   - 'Loading annotations for file: X'"
echo "   - '✅ Loaded annotations'"
echo "   - '🔧 Setting savedAnnotations: {...}'"
echo "   - '📖 Page X: Y annotations'"
echo "   - '🔍 Loading annotations for page 1: Y annotations'"
echo "5. The annotations should now appear on the PDF"

echo ""
echo "🔧 Key changes made:"
echo "   - Fixed race condition in annotation loading"
echo "   - Added direct annotation passing to avoid state timing issues"
echo "   - Enhanced debugging logs"
echo "   - Ensured consistent viewer usage"
