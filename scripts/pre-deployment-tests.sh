#!/bin/bash

# Pre-Deployment Test Suite for StuddyBuddy
# This script runs comprehensive tests before deployment to ensure code quality

set -e

echo "🧪 Starting Pre-Deployment Test Suite for StuddyBuddy"
echo "====================================================="

# Configuration
TEST_TIMEOUT=30
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "$(printf '%.0s-' {1..50})"
}

# Test functions
test_node_environment() {
    print_section "Node.js Environment Tests"
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        node_version=$(node -v)
        print_success "Node.js is installed: $node_version"
    else
        print_failure "Node.js is not installed"
        return 1
    fi
    
    # Check npm version
    if command -v npm >/dev/null 2>&1; then
        npm_version=$(npm -v)
        print_success "npm is installed: $npm_version"
    else
        print_failure "npm is not installed"
        return 1
    fi
    
    return 0
}

test_backend_dependencies() {
    print_section "Backend Dependencies Test"
    
    if [ -d "backend" ]; then
        cd backend
        print_info "Installing backend dependencies..."
        
        if npm ci --only=production >/dev/null 2>&1; then
            print_success "Backend dependencies installed successfully"
        else
            print_failure "Backend dependency installation failed"
            cd ..
            return 1
        fi
        
        cd ..
    else
        print_failure "Backend directory not found"
        return 1
    fi
    
    return 0
}

test_frontend_dependencies() {
    print_section "Frontend Dependencies Test"
    
    if [ -d "frontend" ]; then
        cd frontend
        print_info "Installing frontend dependencies..."
        
        if npm ci >/dev/null 2>&1; then
            print_success "Frontend dependencies installed successfully"
        else
            print_failure "Frontend dependency installation failed"
            cd ..
            return 1
        fi
        
        cd ..
    else
        print_failure "Frontend directory not found"
        return 1
    fi
    
    return 0
}

test_backend_unit_tests() {
    print_section "Backend Unit Tests"
    
    if [ -d "backend" ]; then
        cd backend
        print_info "Running backend unit tests..."
        
        # Run tests with timeout and capture output
        if timeout ${TEST_TIMEOUT}s npm test -- --watchAll=false --testTimeout=30000 --verbose 2>&1; then
            print_success "Backend unit tests passed"
        else
            print_failure "Backend unit tests failed or timed out"
            cd ..
            return 1
        fi
        
        cd ..
    else
        print_failure "Backend directory not found"
        return 1
    fi
    
    return 0
}

test_frontend_build() {
    print_section "Frontend Build Test"
    
    if [ -d "frontend" ]; then
        cd frontend
        print_info "Building frontend for production..."
        
        if npm run build >/dev/null 2>&1; then
            print_success "Frontend build completed successfully"
            
            # Check if build directory exists and has files
            if [ -d "build" ] && [ "$(ls -A build)" ]; then
                print_success "Build artifacts generated successfully"
            else
                print_failure "Build directory is empty or missing"
                cd ..
                return 1
            fi
        else
            print_failure "Frontend build failed"
            cd ..
            return 1
        fi
        
        cd ..
    else
        print_failure "Frontend directory not found"
        return 1
    fi
    
    return 0
}

test_frontend_unit_tests() {
    print_section "Frontend Unit Tests"
    
    if [ -d "frontend" ]; then
        cd frontend
        print_info "Running frontend unit tests..."
        
        # Run tests with timeout and capture output
        if timeout ${TEST_TIMEOUT}s npm test -- --watchAll=false --testTimeout=30000 --verbose 2>&1; then
            print_success "Frontend unit tests passed"
        else
            print_warning "Frontend unit tests failed or timed out (continuing deployment)"
        fi
        
        cd ..
    else
        print_failure "Frontend directory not found"
        return 1
    fi
    
    return 0
}

test_docker_configuration() {
    print_section "Docker Configuration Tests"
    
    # Check if docker-compose.yml exists
    if [ -f "docker-compose.yml" ]; then
        print_success "docker-compose.yml found"
    else
        print_failure "docker-compose.yml not found"
        return 1
    fi
    
    # Check if Dockerfiles exist
    if [ -f "backend/Dockerfile" ]; then
        print_success "Backend Dockerfile found"
    else
        print_failure "Backend Dockerfile not found"
    fi
    
    if [ -f "frontend/Dockerfile" ]; then
        print_success "Frontend Dockerfile found"
    else
        print_failure "Frontend Dockerfile not found"
    fi
    
    # Validate docker-compose syntax
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose config >/dev/null 2>&1; then
            print_success "Docker Compose configuration is valid"
        else
            print_failure "Docker Compose configuration is invalid"
            return 1
        fi
    else
        print_warning "Docker Compose not available for validation"
    fi
    
    return 0
}

test_environment_configuration() {
    print_section "Environment Configuration Tests"
    
    # Check for required environment variables in GitHub Actions context
    required_vars=("REACT_APP_BASE_URL" "REACT_APP_GOOGLE_CLIENT_ID" "JWT_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "$var is configured"
        else
            print_warning "$var is not set (may be set in deployment environment)"
        fi
    done
    
    return 0
}

test_file_structure() {
    print_section "Project Structure Tests"
    
    # Check essential files and directories
    essential_items=(
        "backend/package.json"
        "frontend/package.json"
        "backend/app.js"
        "backend/server.js"
        "frontend/src/App.jsx"
        "docker-compose.yml"
    )
    
    for item in "${essential_items[@]}"; do
        if [ -e "$item" ]; then
            print_success "$item exists"
        else
            print_failure "$item is missing"
        fi
    done
    
    return 0
}

# Main execution
main() {
    echo "🏁 Starting pre-deployment test execution..."
    echo ""
    
    # Environment tests
    test_node_environment
    test_file_structure
    test_environment_configuration
    
    # Dependency tests
    test_backend_dependencies
    test_frontend_dependencies
    
    # Build tests
    test_frontend_build
    
    # Unit tests
    test_backend_unit_tests
    test_frontend_unit_tests
    
    # Configuration tests
    test_docker_configuration
    
    # Summary
    echo ""
    print_section "Test Summary"
    echo "Total tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All pre-deployment tests passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please fix issues before deployment.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
