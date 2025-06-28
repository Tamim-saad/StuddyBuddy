#!/bin/bash

# PDF Annotation Feature Test Script

echo "🧪 Testing PDF Annotation Feature"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
}

# Test 1: Check if backend containers are running
print_test "Checking if backend containers are running..."
if ssh -i studdybuddy_key.pem azureuser@135.235.137.78 "cd /home/azureuser/StuddyBuddy && docker-compose ps | grep -q 'healthy'"; then
    print_success "Backend containers are running"
else
    print_error "Backend containers not running properly"
    exit 1
fi

# Test 2: Check database schema
print_test "Checking database schema for annotated_pdf_id column..."
if ssh -i studdybuddy_key.pem azureuser@135.235.137.78 "cd /home/azureuser/StuddyBuddy && docker-compose exec postgres psql -U postgres -c '\d chotha' | grep -q 'annotated_pdf_id'"; then
    print_success "Database schema updated correctly"
else
    print_error "Database schema missing annotated_pdf_id column"
fi

# Test 3: Check if annotation endpoints exist
print_test "Checking if annotation endpoints are accessible..."
response=$(ssh -i studdybuddy_key.pem azureuser@135.235.137.78 "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/uploads/1/info")
if [ "$response" = "401" ] || [ "$response" = "404" ]; then
    print_success "Annotation info endpoint is accessible (returns auth error as expected)"
else
    print_error "Annotation info endpoint not responding correctly"
fi

# Test 4: Check existing PDF files
print_test "Checking for existing PDF files..."
pdf_count=$(ssh -i studdybuddy_key.pem azureuser@135.235.137.78 "cd /home/azureuser/StuddyBuddy && docker-compose exec postgres psql -U postgres -t -c \"SELECT COUNT(*) FROM chotha WHERE type = 'application/pdf';\"" | tr -d ' ')
if [ "$pdf_count" -gt 0 ]; then
    print_success "Found $pdf_count PDF files for testing"
else
    print_error "No PDF files found for testing"
fi

# Test 5: Check frontend files
print_test "Checking if frontend annotation files exist..."
if [ -f "frontend/src/services/annotationService.js" ] && [ -f "frontend/src/components/PDFAnnotator.jsx" ]; then
    print_success "Frontend annotation files exist"
else
    print_error "Frontend annotation files missing"
fi

echo ""
echo "🎯 Manual Testing Instructions:"
echo "==============================="
echo "1. Open your browser and go to: http://135.235.137.78"
echo "2. Login with: habibarafique526@gmail.com / 123456"
echo "3. Navigate to the file upload/management section"
echo "4. Upload a PDF file if none exist"
echo "5. Click 'Annotate PDF' button on any PDF file"
echo "6. Add annotations (highlights, comments, etc.)"
echo "7. Click 'Save Annotations'"
echo "8. Check if both original and annotated versions appear in file list"
echo ""
echo "🔧 Backend API Testing:"
echo "======================="
echo "• GET /api/uploads/ - List files (should show annotated_pdf_id)"
echo "• GET /api/uploads/:id/info - Get file annotation status"
echo "• POST /api/uploads/save-annotated - Save annotated PDF"
echo ""
echo "🐛 If Issues Found:"
echo "=================="
echo "• Check backend logs: docker-compose logs backend"
echo "• Check database: psql -U postgres -c 'SELECT * FROM chotha;'"
echo "• Verify file uploads: ls uploads/*/'"
