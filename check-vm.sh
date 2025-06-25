#!/bin/bash

# StuddyBuddy VM Health Check Script
# This script checks the health of all services on the Azure VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
VM_IP="135.235.137.78"
PROJECT_DIR="/home/$(whoami)/StuddyBuddy"
BACKEND_PORT="4000"
FRONTEND_PORT="80"

echo "🔍 StuddyBuddy VM Health Check"
echo "================================"
echo "VM IP: $VM_IP"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Check if running on the correct VM
check_vm_identity() {
    print_status "Checking VM identity..."
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
    if [ "$PUBLIC_IP" = "$VM_IP" ]; then
        print_success "Running on correct VM (IP: $PUBLIC_IP)"
    else
        print_warning "VM IP mismatch. Expected: $VM_IP, Current: $PUBLIC_IP"
    fi
}

# Check Docker installation and status
check_docker() {
    print_status "Checking Docker..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker installed: $DOCKER_VERSION"
        
        if docker info &> /dev/null; then
            print_success "Docker daemon is running"
        else
            print_error "Docker daemon is not running"
            return 1
        fi
    else
        print_error "Docker is not installed"
        return 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose installed: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed"
        return 1
    fi
}

# Check project directory and Git status
check_project() {
    print_status "Checking project directory..."
    
    if [ -d "$PROJECT_DIR" ]; then
        print_success "Project directory exists: $PROJECT_DIR"
        
        cd "$PROJECT_DIR"
        if [ -d ".git" ]; then
            GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
            GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
            print_success "Git repository - Branch: $GIT_BRANCH, Commit: $GIT_COMMIT"
        else
            print_warning "No Git repository found"
        fi
    else
        print_error "Project directory does not exist: $PROJECT_DIR"
        return 1
    fi
}

# Check Docker containers
check_containers() {
    print_status "Checking Docker containers..."
    
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        
        # Check if containers are running
        RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" 2>/dev/null || echo "")
        
        if echo "$RUNNING_CONTAINERS" | grep -q "backend"; then
            print_success "Backend container is running"
        else
            print_error "Backend container is not running"
        fi
        
        if echo "$RUNNING_CONTAINERS" | grep -q "frontend"; then
            print_success "Frontend container is running"
        else
            print_error "Frontend container is not running"
        fi
        
        # Show container status
        echo ""
        print_status "Container status:"
        docker-compose ps 2>/dev/null || echo "No containers found"
    else
        print_error "Cannot check containers - project directory not found"
    fi
}

# Check network connectivity
check_network() {
    print_status "Checking network connectivity..."
    
    # Check backend health
    if curl -f -s --max-time 5 "http://localhost:$BACKEND_PORT/" > /dev/null; then
        print_success "Backend API is responding on port $BACKEND_PORT"
    else
        print_error "Backend API is not responding on port $BACKEND_PORT"
    fi
    
    # Check frontend
    if curl -f -s --max-time 5 "http://localhost:$FRONTEND_PORT/" > /dev/null; then
        print_success "Frontend is responding on port $FRONTEND_PORT"
    else
        print_error "Frontend is not responding on port $FRONTEND_PORT"
    fi
    
    # Check external access
    if curl -f -s --max-time 5 "http://$VM_IP:$BACKEND_PORT/" > /dev/null; then
        print_success "Backend API is accessible externally"
    else
        print_warning "Backend API is not accessible externally"
    fi
    
    if curl -f -s --max-time 5 "http://$VM_IP/" > /dev/null; then
        print_success "Frontend is accessible externally"
    else
        print_warning "Frontend is not accessible externally"
    fi
}

# Check system resources
check_resources() {
    print_status "Checking system resources..."
    
    # Memory usage
    MEMORY_USAGE=$(free | grep '^Mem:' | awk '{printf "%.1f", ($3/$2) * 100.0}')
    print_status "Memory usage: ${MEMORY_USAGE}%"
    
    # Disk usage
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    print_status "Disk usage: ${DISK_USAGE}%"
    
    # CPU load
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    print_status "CPU load (1min): $CPU_LOAD"
    
    # Warning thresholds
    if [ "$(echo "$MEMORY_USAGE > 80" | awk '{print ($1 > $3)}')" = "1" ]; then
        print_warning "High memory usage: ${MEMORY_USAGE}%"
    fi
    
    if [ "$DISK_USAGE" -gt 80 ]; then
        print_warning "High disk usage: ${DISK_USAGE}%"
    fi
}

# Check logs for errors
check_logs() {
    print_status "Checking recent logs for errors..."
    
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        
        # Check for recent errors in logs
        ERROR_COUNT=$(docker-compose logs --tail=50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
        
        if [ "$ERROR_COUNT" -gt 0 ]; then
            print_warning "Found $ERROR_COUNT error/warning entries in recent logs"
            echo ""
            print_status "Recent errors:"
            docker-compose logs --tail=50 2>/dev/null | grep -i "error\|exception\|failed" | tail -5
        else
            print_success "No recent errors found in logs"
        fi
    fi
}

# Main health check
main() {
    echo "Starting health check at $(date)"
    echo ""
    
    check_vm_identity
    echo ""
    
    check_docker
    echo ""
    
    check_project
    echo ""
    
    check_containers
    echo ""
    
    check_network
    echo ""
    
    check_resources
    echo ""
    
    check_logs
    echo ""
    
    print_success "Health check completed at $(date)"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://$VM_IP"
    echo "   Backend API: http://$VM_IP:$BACKEND_PORT"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: cd $PROJECT_DIR && docker-compose logs -f"
    echo "   Restart services: cd $PROJECT_DIR && docker-compose restart"
    echo "   Redeploy: cd $PROJECT_DIR && ./deploy.sh"
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "quick")
        check_containers
        check_network
        ;;
    "logs")
        if [ -d "$PROJECT_DIR" ]; then
            cd "$PROJECT_DIR"
            docker-compose logs -f
        else
            print_error "Project directory not found: $PROJECT_DIR"
        fi
        ;;
    "status")
        if [ -d "$PROJECT_DIR" ]; then
            cd "$PROJECT_DIR"
            docker-compose ps
        else
            print_error "Project directory not found: $PROJECT_DIR"
        fi
        ;;
    "help")
        echo "Usage: $0 [check|quick|logs|status|help]"
        echo "  check  - Full health check (default)"
        echo "  quick  - Quick check of containers and network"
        echo "  logs   - View application logs"
        echo "  status - Show container status"
        echo "  help   - Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac