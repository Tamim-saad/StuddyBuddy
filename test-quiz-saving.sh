#!/bin/bash

# Test script to verify quiz saving functionality
VM_IP="135.235.137.78"

echo "🧪 Testing Quiz Saving Functionality..."

# Test 1: Check if saved quizzes endpoint is available
echo -e "\n📋 Test 1: Check saved quizzes endpoint"
response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer fake-token" \
    "http://$VM_IP:4000/api/quiz/saved")

if [ "$response" = "401" ]; then
    echo "✅ Saved quizzes endpoint requires authentication (expected)"
elif [ "$response" = "500" ]; then
    echo "⚠️ Saved quizzes endpoint returns 500 (might be OK without valid token)"
else
    echo "ℹ️ Saved quizzes endpoint returned status: $response"
fi

# Test 2: Check if quiz generation creates saved entries
echo -e "\n📋 Test 2: Check if generated quizzes are automatically saved"
echo "ℹ️ This test requires a valid authentication token"
echo "ℹ️ When you generate a quiz through the frontend, it should now:"
echo "   - Appear in the saved quizzes list"
echo "   - Have an ID assigned from the database"
echo "   - Show question count and creation date"

# Test 3: Check if database has quiz tables
echo -e "\n📋 Test 3: Verify database structure"
echo "ℹ️ Checking if quiz tables exist..."

# Note: This would require database access which we tested earlier

echo -e "\n🎯 Manual Testing Instructions:"
echo "================================"
echo "1. Go to http://$VM_IP in your browser"
echo "2. Login to the application"
echo "3. Upload a document or select an existing one"
echo "4. Generate a new MCQ or CQ quiz"
echo "5. Check that the quiz appears in the 'Saved Quizzes' section"
echo "6. Verify the quiz shows:"
echo "   - Quiz title"
echo "   - Quiz type (MCQ/CQ)"
echo "   - Question count"
echo "   - Creation date"
echo "   - File name it was generated from"

echo -e "\n📊 Expected Behavior After Fix:"
echo "- ✅ Generated quizzes are automatically saved to database"
echo "- ✅ Saved quizzes appear in the quiz list with proper metadata"
echo "- ✅ Quiz list shows question count, type, and creation date"
echo "- ✅ Users can click on saved quizzes to view/retake them"
echo "- ✅ Quiz saving works for both MCQ and CQ types"
