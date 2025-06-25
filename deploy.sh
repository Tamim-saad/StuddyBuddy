#!/bin/bash

# Production Deployment Script for StuddyBuddy
# Run this script on your VM to deploy the application

set -e  # Exit on any error

echo "🚀 Starting StuddyBuddy Production Deployment..."

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "📄 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  .env file not found! Please create one from .env.example"
    exit 1
fi

# Configuration from .env
PROJECT_DIR="/home/$(whoami)/StuddyBuddy"
REPO_URL="https://github.com/Tamim-saad/StuddyBuddy.git"  # Your actual GitHub repository
VM_IP="${VM_PUBLIC_IP:-localhost}"  # Use VM_PUBLIC_IP from .env or fallback

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

# Verify environment file exists and has required variables
verify_env_file() {
    print_status "Verifying environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found! Please create one from .env.example"
        exit 1
    fi
    
    # Check for required variables
    REQUIRED_VARS=("JWT_SECRET" "EMAIL_USER" "EMAIL_PASS" "GEMINI_API_KEY" "POSTGRES_URI" "VM_PUBLIC_IP")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" .env; then
            print_error "Required variable ${var} not found in .env file"
            exit 1
        fi
    done
    
    print_success "Environment configuration verified"
    print_status "Using VM IP: ${VM_PUBLIC_IP}"
}

# Deploy application
deploy_application() {
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    print_status "Cleaning up old images..."
    docker system prune -f
    docker image prune -f || true
    
    print_status "Building and starting containers..."
    docker-compose up -d --build --remove-orphans --force-recreate
    
    print_status "Waiting for services to start..."
    sleep 45
    
    print_status "Checking deployment status..."
    docker-compose ps
    
    # Verify containers are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "No containers are running!"
        print_status "Container logs:"
        docker-compose logs --tail=20
        exit 1
    fi
}

# Check application health
check_health() {
    print_status "Checking application health..."
    
    # Check backend health with retry
    BACKEND_READY=false
    for i in {1..10}; do
        if curl -f --max-time 10 "http://localhost:4000/" &> /dev/null; then
            print_success "Backend is healthy"
            BACKEND_READY=true
            break
        else
            print_status "Waiting for backend... (attempt $i/10)"
            sleep 10
        fi
    done
    
    if [ "$BACKEND_READY" = false ]; then
        print_error "Backend health check failed"
        print_status "Backend logs:"
        docker-compose logs backend --tail=20
    fi
    
    # Check frontend availability with retry
    FRONTEND_READY=false
    for i in {1..8}; do
        if curl -f --max-time 10 "http://localhost/" &> /dev/null; then
            print_success "Frontend is accessible"
            FRONTEND_READY=true
            break
        else
            print_status "Waiting for frontend... (attempt $i/8)"
            sleep 10
        fi
    done
    
    if [ "$FRONTEND_READY" = false ]; then
        print_warning "Frontend health check failed"
        print_status "Frontend logs:"
        docker-compose logs frontend --tail=20
    fi
    
    # External connectivity check
    print_status "Testing external connectivity..."
    if curl -f --max-time 10 "http://$VM_IP:4000/" &> /dev/null; then
        print_success "Backend API accessible externally"
    else
        print_warning "Backend API not accessible externally"
    fi
    
    if curl -f --max-time 10 "http://$VM_IP/" &> /dev/null; then
        print_success "Frontend accessible externally"
    else
        print_warning "Frontend not accessible externally"
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
    verify_env_file
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
