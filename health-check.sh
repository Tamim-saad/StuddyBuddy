#!/bin/bash

# Health Check Script for StuddyBuddy
# This script checks if all services are running properly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VM_IP="135.235.137.78"  # Azure VM Public IP
BACKEND_URL="http://localhost:4000"
FRONTEND_URL="http://localhost"
EXTERNAL_BACKEND_URL="http://${VM_IP}:4000"
EXTERNAL_FRONTEND_URL="http://${VM_IP}"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_docker_services() {
    print_status "Checking Docker services..."
    
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker containers are running"
        docker-compose ps
    else
        print_error "Docker containers are not running properly"
        docker-compose ps
        return 1
    fi
}

check_backend_health() {
    print_status "Checking backend health..."
    
    if curl -f -s "$BACKEND_URL/" > /dev/null 2>&1; then
        print_success "Backend is responding"
    else
        print_error "Backend is not responding at $BACKEND_URL"
        return 1
    fi
}

check_frontend_health() {
    print_status "Checking frontend health..."
    
    if curl -f -s "$FRONTEND_URL/" > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding at $FRONTEND_URL"
        return 1
    fi
}

check_external_access() {
    print_status "Checking external access from Azure public IP..."
    
    # Check if external backend is accessible (this will fail if ports aren't open)
    if curl -f -s --connect-timeout 5 "$EXTERNAL_BACKEND_URL/" > /dev/null 2>&1; then
        print_success "Backend is accessible externally at $EXTERNAL_BACKEND_URL"
    else
        print_error "Backend is NOT accessible externally at $EXTERNAL_BACKEND_URL"
        print_warning "This means Port 4000 is not open in Azure Network Security Group"
        return 1
    fi
    
    # Check if external frontend is accessible
    if curl -f -s --connect-timeout 5 "$EXTERNAL_FRONTEND_URL/" > /dev/null 2>&1; then
        print_success "Frontend is accessible externally at $EXTERNAL_FRONTEND_URL"
    else
        print_error "Frontend is NOT accessible externally at $EXTERNAL_FRONTEND_URL"
        print_warning "This means Port 80 is not open in Azure Network Security Group"
        return 1
    fi
}

check_azure_network_config() {
    print_status "Checking Azure Network Security Group configuration..."
    
    print_warning "Required Azure NSG Inbound Rules:"
    echo "   ✓ Port 22 (SSH) - Already configured"
    echo "   ✓ Port 5432 (PostgreSQL) - Already configured"
    echo "   ❌ Port 80 (HTTP) - NEEDS TO BE ADDED"
    echo "   ❌ Port 4000 (Backend API) - NEEDS TO BE ADDED"
    echo ""
    echo "📋 To add missing ports:"
    echo "   1. Go to Azure Portal → Virtual Machines → studdybuddy"
    echo "   2. Click 'Networking' → 'Add inbound port rule'"
    echo "   3. Add Port 80 (Priority: 320, Name: Allow-HTTP)"
    echo "   4. Add Port 4000 (Priority: 330, Name: Allow-Backend-API)"
    echo ""
}

check_system_resources() {
    print_status "Checking system resources..."
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Disk usage: ${DISK_USAGE}%"
    else
        print_warning "High disk usage: ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if [ "${MEMORY_USAGE%.*}" -lt 80 ]; then
        print_success "Memory usage: ${MEMORY_USAGE}%"
    else
        print_warning "High memory usage: ${MEMORY_USAGE}%"
    fi
}

check_ports() {
    print_status "Checking required ports..."
    
    if netstat -tuln | grep -q ":80 "; then
        print_success "Port 80 (HTTP) is open"
    else
        print_error "Port 80 (HTTP) is not open"
    fi
    
    if netstat -tuln | grep -q ":4000 "; then
        print_success "Port 4000 (Backend) is open"
    else
        print_error "Port 4000 (Backend) is not open"
    fi
}

show_access_info() {
    echo ""
    echo "🌐 Application Access Information:"
    echo "   Frontend: http://$VM_IP"
    echo "   Backend API: http://$VM_IP:4000"
    echo ""
}

main() {
    echo "🔍 StuddyBuddy Azure VM Health Check Report"
    echo "=============================================="
    echo "Timestamp: $(date)"
    echo "Azure Public IP: $VM_IP"
    echo "Azure Private IP: 10.1.0.4"
    echo ""
    
    OVERALL_STATUS=0
    
    check_docker_services || OVERALL_STATUS=1
    echo ""
    
    check_backend_health || OVERALL_STATUS=1
    echo ""
    
    check_frontend_health || OVERALL_STATUS=1
    echo ""
    
    check_external_access || OVERALL_STATUS=1
    echo ""
    
    check_azure_network_config
    echo ""
    
    check_system_resources
    echo ""
    
    check_ports
    echo ""
    
    if [ $OVERALL_STATUS -eq 0 ]; then
        print_success "🎉 All services are healthy and accessible!"
        show_access_info
    else
        print_error "❌ Some services have issues. Check the logs above."
        echo ""
        echo "🔧 Common Azure VM troubleshooting:"
        echo "   1. Add missing ports to Network Security Group"
        echo "   2. Check Docker logs: docker-compose logs -f"
        echo "   3. Verify services: docker-compose ps"
        echo "   4. Restart services: docker-compose restart"
        echo ""
        echo "📋 Required Azure NSG ports: 80, 4000"
    fi
    
    exit $OVERALL_STATUS
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "quick")
        check_backend_health && check_frontend_health
        ;;
    "help")
        echo "Usage: $0 [check|logs|quick|help]"
        echo "  check  - Full health check (default)"
        echo "  logs   - View application logs"
        echo "  quick  - Quick service check"
        echo "  help   - Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac
