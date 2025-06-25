#!/bin/bash

# Azure VM Setup Script for StuddyBuddy
# Run this script on your Azure VM to prepare it for deployment

set -e

echo "🚀 Setting up Azure VM for StuddyBuddy deployment..."

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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Configure PostgreSQL
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" || true
    sudo -u postgres createdb postgres || echo "Database already exists"
    
    print_success "PostgreSQL installed and configured"
else
    print_success "PostgreSQL is already installed"
fi

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 4000/tcp  # Backend API
    sudo ufw --force enable
    print_success "Firewall configured"
else
    print_warning "UFW not available, please configure firewall manually"
fi

# Install Git (if not already installed)
print_status "Checking Git installation..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    print_success "Git installed"
else
    print_success "Git is already installed"
fi

# Install Node.js and npm (useful for debugging)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js is already installed"
fi

# Create project directory
print_status "Setting up project directory..."
PROJECT_DIR="/home/$(whoami)/StuddyBuddy"
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p "$PROJECT_DIR"
    print_success "Project directory created at $PROJECT_DIR"
else
    print_success "Project directory already exists at $PROJECT_DIR"
fi

# Set proper permissions
sudo chown -R $USER:$USER $PROJECT_DIR

print_success "🎉 Azure VM setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   - Docker and Docker Compose installed"
echo "   - PostgreSQL installed and configured"
echo "   - Firewall configured (ports 22, 80, 4000)"
echo "   - Project directory ready at: $PROJECT_DIR"
echo ""
echo "🔄 Next Steps:"
echo "   1. Add your SSH public key to GitHub deploy keys"
echo "   2. Configure GitHub repository secrets"
echo "   3. Push to main branch to trigger deployment"
echo ""
echo "🔧 Useful Commands:"
echo "   - Check Docker: docker --version"
echo "   - Check PostgreSQL: sudo systemctl status postgresql"
echo "   - View logs: cd $PROJECT_DIR && docker-compose logs -f"
echo "   - Restart services: cd $PROJECT_DIR && docker-compose restart"
