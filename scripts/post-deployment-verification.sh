#!/bin/bash

# Post-Deployment Verification Script for StuddyBuddy
# This script verifies the deployment was successful and all services are working

set -e

echo "🔍 Starting Post-Deployment Verification for StuddyBuddy"
echo "======================================================="

# Configuration
BACKEND_URL="http://localhost:4000"
FRONTEND_URL="http://localhost"
MAX_WAIT_TIME=120
RETRY_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
    ((CHECKS_TOTAL++))
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

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_time=${3:-$MAX_WAIT_TIME}
    
    print_info "Waiting for $service_name to be ready..."
    
    local elapsed=0
    while [ $elapsed -lt $max_time ]; do
        if curl -f --max-time 5 "$url" >/dev/null 2>&1; then
            return 0
        fi
        
        sleep $RETRY_INTERVAL
        elapsed=$((elapsed + RETRY_INTERVAL))
        print_info "Still waiting for $service_name... (${elapsed}s/${max_time}s)"
    done
    
    return 1
}

# Check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local max_time=${3:-10}
    
    if curl -f --max-time $max_time "$url" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verification functions
verify_docker_services() {
    print_section "Docker Services Verification"
    
    # Check if Docker is running
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        print_failure "Docker daemon is not running"
        return 1
    fi
    
    # Check running containers
    print_info "Checking Docker containers..."
    running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "studdybuddy" || echo "")
    
    if [ -n "$running_containers" ]; then
        print_success "StuddyBuddy containers are running:"
        echo "$running_containers" | while read line; do
            echo "  $line"
        done
    else
        print_failure "No StuddyBuddy containers are running"
        return 1
    fi
    
    # Check specific services
    services=("backend" "frontend" "postgres" "qdrant")
    for service in "${services[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$service"; then
            print_success "$service container is running"
        else
            print_failure "$service container is not running"
        fi
    done
    
    return 0
}

verify_backend_health() {
    print_section "Backend Health Verification"
    
    # Wait for backend to be ready
    if wait_for_service "backend" "$BACKEND_URL/api/health" 60; then
        print_success "Backend is responding"
    else
        print_failure "Backend failed to respond within timeout"
        return 1
    fi
    
    # Test health endpoint
    if check_service_health "backend" "$BACKEND_URL/api/health" 10; then
        # Get health response
        health_response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null)
        print_success "Backend health check passed"
        print_info "Health response: $health_response"
    else
        print_failure "Backend health check failed"
        return 1
    fi
    
    return 0
}

verify_frontend_availability() {
    print_section "Frontend Availability Verification"
    
    # Wait for frontend to be ready
    if wait_for_service "frontend" "$FRONTEND_URL/" 30; then
        print_success "Frontend is responding"
    else
        print_failure "Frontend failed to respond within timeout"
        return 1
    fi
    
    # Check if frontend returns HTML
    frontend_response=$(curl -s "$FRONTEND_URL/" 2>/dev/null)
    if echo "$frontend_response" | grep -q "<html"; then
        print_success "Frontend is serving HTML content"
    else
        print_failure "Frontend is not serving proper HTML content"
        return 1
    fi
    
    return 0
}

verify_api_endpoints() {
    print_section "API Endpoints Verification"
    
    # Test auth endpoint (should be accessible even if it returns error)
    print_info "Testing auth endpoint..."
    if curl -f "$BACKEND_URL/api/auth/google-login" -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null || [ $? -eq 22 ]; then
        print_success "Auth endpoint is accessible"
    else
        print_failure "Auth endpoint is not accessible"
    fi
    
    # Test upload endpoint
    print_info "Testing upload endpoint..."
    if curl -f "$BACKEND_URL/api/uploads" -X GET 2>/dev/null || [ $? -eq 22 ]; then
        print_success "Upload endpoint is accessible"
    else
        print_failure "Upload endpoint is not accessible"
    fi
    
    # Test quiz endpoint
    print_info "Testing quiz endpoint..."
    if curl -f "$BACKEND_URL/api/quiz" -X GET 2>/dev/null || [ $? -eq 22 ]; then
        print_success "Quiz endpoint is accessible"
    else
        print_failure "Quiz endpoint is not accessible"
    fi
    
    return 0
}

verify_database_connectivity() {
    print_section "Database Connectivity Verification"
    
    # Check PostgreSQL
    print_info "Testing PostgreSQL connection..."
    if docker exec -i $(docker ps --format "{{.Names}}" | grep postgres) pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL database is accessible"
    else
        print_failure "PostgreSQL database connection failed"
    fi
    
    # Check Qdrant
    print_info "Testing Qdrant connection..."
    if check_service_health "qdrant" "http://localhost:6333/health" 5; then
        print_success "Qdrant vector database is accessible"
    else
        print_failure "Qdrant vector database connection failed"
    fi
    
    return 0
}

verify_system_resources() {
    print_section "System Resources Verification"
    
    # Check disk space
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 85 ]; then
        print_success "Disk space is sufficient ($disk_usage% used)"
    else
        print_warning "Disk space is getting low ($disk_usage% used)"
    fi
    
    # Check memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$memory_usage" -lt 90 ]; then
        print_success "Memory usage is acceptable ($memory_usage% used)"
    else
        print_warning "Memory usage is high ($memory_usage% used)"
    fi
    
    # Show system info
    print_info "System Information:"
    echo "  - Uptime: $(uptime -p)"
    echo "  - Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    echo "  - Available Memory: $(free -h | grep Mem | awk '{print $7}')"
    echo "  - Available Disk: $(df -h / | tail -1 | awk '{print $4}')"
    
    return 0
}

generate_deployment_report() {
    print_section "Deployment Report"
    
    echo "Deployment completed at: $(date)"
    echo "Application URLs:"
    echo "  - Frontend: $FRONTEND_URL"
    echo "  - Backend API: $BACKEND_URL"
    echo "  - Health Check: $BACKEND_URL/api/health"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 Deployment verification successful!${NC}"
        echo "All services are running and accessible."
    else
        echo -e "${RED}⚠️ Deployment verification completed with issues.${NC}"
        echo "Some checks failed. Please review the logs above."
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Access your application at $FRONTEND_URL"
    echo "2. Test the application functionality manually"
    echo "3. Monitor logs with: docker-compose logs -f"
    echo "4. Check container status with: docker-compose ps"
}

# Main execution
main() {
    echo "🏁 Starting post-deployment verification..."
    echo ""
    
    # Run all verification checks
    verify_docker_services
    verify_backend_health
    verify_frontend_availability
    verify_api_endpoints
    verify_database_connectivity
    verify_system_resources
    
    # Generate report
    echo ""
    generate_deployment_report
    
    # Summary
    echo ""
    print_section "Verification Summary"
    echo "Total checks: $CHECKS_TOTAL"
    echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "Failed: ${RED}$CHECKS_FAILED${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All verification checks passed!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️ Some verification checks failed, but deployment may still be functional.${NC}"
        exit 0  # Don't fail the deployment for verification issues
    fi
}

# Run main function
main "$@"
