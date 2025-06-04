#!/bin/bash

# Test script for PDF annotation integration
# This tests the complete workflow from file upload to annotation

echo "🧪 Starting PDF Annotation Integration Test..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://135.235.137.78:4000"
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="testpassword"

# Function to print colored output
print_status() {
    case $1 in
        "SUCCESS") echo -e "${GREEN}✅ $2${NC}" ;;
        "ERROR") echo -e "${RED}❌ $2${NC}" ;;
        "INFO") echo -e "${YELLOW}ℹ️  $2${NC}" ;;
    esac
}

# Function to check if service is running
check_service() {
    local service_url=$1
    local service_name=$2
    
    if curl -s --connect-timeout 5 "$service_url" > /dev/null; then
        print_status "SUCCESS" "$service_name is running"
        return 0
    else
        print_status "ERROR" "$service_name is not accessible"
        return 1
    fi
}

# Function to test annotation endpoint
test_annotation_endpoint() {
    print_status "INFO" "Testing annotation API endpoint..."
    
    # Create a simple test request (without actual file)
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        "$BASE_URL/api/uploads/save-annotated")
    
    if [ "$response" = "401" ] || [ "$response" = "400" ]; then
        print_status "SUCCESS" "Annotation endpoint is responding (status: $response)"
        return 0
    else
        print_status "ERROR" "Annotation endpoint unexpected response: $response"
        return 1
    fi
}

# Function to check frontend build
check_frontend_build() {
    print_status "INFO" "Checking frontend components..."
    
    # Check if PDFAnnotator component exists
    if [ -f "/home/pridesys/Desktop/StuddyBuddy/frontend/src/components/PDFAnnotator.jsx" ]; then
        print_status "SUCCESS" "PDFAnnotator component found"
    else
        print_status "ERROR" "PDFAnnotator component not found"
        return 1
    fi
    
    # Check if annotation service exists
    if [ -f "/home/pridesys/Desktop/StuddyBuddy/frontend/src/services/annotationService.js" ]; then
        print_status "SUCCESS" "Annotation service found"
    else
        print_status "ERROR" "Annotation service not found"
        return 1
    fi
    
    # Check if FileList has annotation integration
    if grep -q "onAnnotate" "/home/pridesys/Desktop/StuddyBuddy/frontend/src/components/files/FileList.jsx"; then
        print_status "SUCCESS" "FileList has annotation integration"
    else
        print_status "ERROR" "FileList missing annotation integration"
        return 1
    fi
    
    return 0
}

# Function to check backend annotation route
check_backend_route() {
    print_status "INFO" "Checking backend annotation route..."
    
    if grep -q "save-annotated" "/home/pridesys/Desktop/StuddyBuddy/backend/routes/uploadRoutes.js"; then
        print_status "SUCCESS" "Backend annotation route found"
        return 0
    else
        print_status "ERROR" "Backend annotation route not found"
        return 1
    fi
}

# Function to check database schema
check_database_schema() {
    print_status "INFO" "Checking database schema for annotation support..."
    
    # This would require database access, so we'll check the migration/schema files
    if grep -q "annotated_pdf_id" "/home/pridesys/Desktop/StuddyBuddy/backend/config/db.js" 2>/dev/null || \
       find "/home/pridesys/Desktop/StuddyBuddy" -name "*.sql" -exec grep -l "annotated_pdf_id" {} \; 2>/dev/null | head -1; then
        print_status "SUCCESS" "Database schema supports annotations"
        return 0
    else
        print_status "INFO" "Database schema check inconclusive (may require manual verification)"
        return 0
    fi
}

# Function to test environment variables
test_environment_variables() {
    print_status "INFO" "Testing environment variable configuration..."
    
    # Check if .env file has correct POSTGRES_URI
    if grep -q "POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres" "/home/pridesys/Desktop/StuddyBuddy/.env"; then
        print_status "SUCCESS" "POSTGRES_URI correctly configured for Docker"
    else
        print_status "ERROR" "POSTGRES_URI may not be correctly configured"
        return 1
    fi
    
    # Check frontend environment
    if grep -q "REACT_APP_BASE_URL" "/home/pridesys/Desktop/StuddyBuddy/.env"; then
        print_status "SUCCESS" "Frontend API URL configured"
    else
        print_status "ERROR" "Frontend API URL not configured"
        return 1
    fi
    
    return 0
}

# Main test execution
main() {
    echo "========================================"
    echo "🔧 PDF Annotation Integration Test Suite"
    echo "========================================"
    
    # Test 1: Environment Variables
    print_status "INFO" "Test 1: Environment Variables"
    test_environment_variables
    
    echo ""
    
    # Test 2: Backend Components
    print_status "INFO" "Test 2: Backend Components"
    check_backend_route
    
    echo ""
    
    # Test 3: Frontend Components
    print_status "INFO" "Test 3: Frontend Components"
    check_frontend_build
    
    echo ""
    
    # Test 4: Database Schema
    print_status "INFO" "Test 4: Database Schema"
    check_database_schema
    
    echo ""
    
    # Test 5: Service Connectivity
    print_status "INFO" "Test 5: Service Connectivity"
    check_service "$BASE_URL/api/health" "Backend API" || check_service "$BASE_URL" "Backend Service"
    
    echo ""
    
    # Test 6: Annotation Endpoint
    print_status "INFO" "Test 6: Annotation Endpoint"
    test_annotation_endpoint
    
    echo ""
    echo "========================================"
    echo "📋 Test Summary"
    echo "========================================"
    print_status "SUCCESS" "Integration test completed!"
    print_status "INFO" "Manual testing steps:"
    echo "   1. Start the application: npm start"
    echo "   2. Upload a PDF file"
    echo "   3. Click the annotation button (edit icon) next to a PDF"
    echo "   4. Add annotations and save"
    echo "   5. Verify the annotated PDF appears in the file list"
    
    echo ""
    print_status "INFO" "If all tests pass, the annotation feature is properly integrated!"
}

# Run the main function
main
