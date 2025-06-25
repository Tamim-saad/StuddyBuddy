#!/bin/bash

# Production Deployment Script for StuddyBuddy
# Run this script on your VM to deploy the application

set -e  # Exit on any error

echo "🚀 Starting StuddyBuddy Production Deployment..."

# Configuration
PROJECT_DIR="/home/$(whoami)/StuddyBuddy"
REPO_URL="https://github.com/Tamim-saad/StuddyBuddy.git"  # Your actual GitHub repository
VM_IP="135.235.137.78"  # Your Azure VM public IP

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Run: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Run: sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "Then: sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Create project directory and clone/update repository
setup_project() {
    print_status "Setting up project directory..."
    
    if [ -d "$PROJECT_DIR" ]; then
        print_status "Project directory exists, pulling latest changes..."
        cd "$PROJECT_DIR"
        git pull origin main
    else
        print_status "Cloning repository..."
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    print_success "Project setup complete"
}

# Create production environment file
create_env_file() {
    print_status "Creating production environment file..."
    
    cat > .env << EOF
# Production Environment Variables
PORT=4000
JWT_SECRET=34uhhfid8u345bfdjfiu3446346y
EMAIL_USER=habibarafique526@gmail.com
EMAIL_PASS=gplnfcyfrmxluhyc
GEMINI_API_KEY=AIzaSyDcsTky6ccPj_AxiWkZ5Xd_ybSX4f4bKpo
REACT_APP_GOOGLE_CLIENT_ID=1019060132363-j6q22t0jdbrp86nbm3gov2nlusl1g834.apps.googleusercontent.com

# Azure VM URLs (Fixed IP)
REACT_APP_BASE_URL=http://135.235.137.78:4000
BACKEND_URL=http://135.235.137.78:4000
FRONTEND_URL=http://135.235.137.78

# Database Configuration (Using host IP since PostgreSQL is on same VM)
POSTGRES_URI=postgresql://postgres:postgres@10.1.0.4:5432/postgres

# Docker Configuration
COMPOSE_PROJECT_NAME=studdybuddy
VM_PUBLIC_IP=135.235.137.78
VM_PRIVATE_IP=10.1.0.4
EOF
    
    print_success "Environment file created for Azure VM IP: $VM_IP"
}

# Deploy application
deploy_application() {
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    print_status "Cleaning up old images..."
    docker system prune -f
    
    print_status "Building and starting containers..."
    docker-compose up -d --build --remove-orphans
    
    print_status "Waiting for services to start..."
    sleep 30
    
    print_status "Checking deployment status..."
    docker-compose ps
}

# Check application health
check_health() {
    print_status "Checking application health..."
    
    # Check backend health
    if curl -f "http://localhost:4000/" &> /dev/null; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend availability
    if curl -f "http://localhost/" &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend health check failed"
    fi
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Check if ufw is available
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22    # SSH
        sudo ufw allow 80    # HTTP
        sudo ufw allow 4000  # Backend API
        sudo ufw --force enable
        print_success "Firewall configured"
    else
        print_warning "UFW not available, please configure firewall manually"
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_docker
    setup_project
    create_env_file
    deploy_application
    check_health
    setup_firewall
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Your application is now accessible at:"
    echo "   Frontend: http://$VM_IP"
    echo "   Backend API: http://$VM_IP:4000"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Restart services: docker-compose restart"
    echo "   Stop services: docker-compose down"
    echo "   View status: docker-compose ps"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        cd "$PROJECT_DIR"
        docker-compose logs -f
        ;;
    "status")
        cd "$PROJECT_DIR"
        docker-compose ps
        ;;
    "restart")
        cd "$PROJECT_DIR"
        docker-compose restart
        ;;
    "stop")
        cd "$PROJECT_DIR"
        docker-compose down
        ;;
    "help")
        echo "Usage: $0 [deploy|logs|status|restart|stop|help]"
        echo "  deploy  - Deploy the application (default)"
        echo "  logs    - View application logs"
        echo "  status  - Check service status"
        echo "  restart - Restart services"
        echo "  stop    - Stop all services"
        echo "  help    - Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac
