# StuddyBuddy Deployment Guide

## 🚀 VM Hosting & CI/CD Setup

This guide will help you deploy StuddyBuddy on a Virtual Machine and set up continuous integration/deployment.

## 📋 Prerequisites

### On Your VM:
- Ubuntu 20.04+ or similar Linux distribution
- At least 2GB RAM and 20GB storage
- Root or sudo access
- Port 80, 4000, and 22 (SSH) accessible

### Required Services:
- PostgreSQL database running on your VM or external service
- Domain name or static IP address

## 🛠️ VM Setup (One-time)

### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply docker group changes
```

### 2. Setup PostgreSQL (if not using external service)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE postgres;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Configure PostgreSQL to accept connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Configure Firewall

```bash
# Install and configure UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 4000  # Backend API
sudo ufw allow 5432  # PostgreSQL (if hosting database)
sudo ufw --force enable
```

## 🚀 Deployment Methods

### Method 1: Manual Deployment (Recommended for first time)

1. **Clone the repository on your VM:**
```bash
git clone https://github.com/Tamim-saad/StuddyBuddy.git
cd StuddyBuddy
```

2. **Run the deployment script:**
```bash
./deploy.sh
```

The script will:
- Check Docker installation
- Create production environment file
- Build and start containers
- Configure firewall
- Verify deployment

### Method 2: Using Docker Compose directly

1. **Create environment file:**
```bash
# Update VM_IP with your actual VM IP address
VM_IP="YOUR-VM-PUBLIC-IP"

cat > .env << EOF
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
GEMINI_API_KEY=your-gemini-api-key-here
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_BASE_URL=http://${VM_IP}:4000
BACKEND_URL=http://${VM_IP}:4000
FRONTEND_URL=http://${VM_IP}
POSTGRES_URI=postgresql://postgres:postgres@${VM_IP}:5432/postgres
COMPOSE_PROJECT_NAME=studdybuddy
EOF
```

2. **Deploy with Docker Compose:**
```bash
# For development
docker-compose up -d --build

# For production
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔄 CI/CD Setup with GitHub Actions

### 1. GitHub Secrets Configuration

Add these secrets in your GitHub repository settings:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VM_HOST` | Your VM's IP address | `YOUR-VM-PUBLIC-IP` |
| `VM_USERNAME` | SSH username | `ubuntu` |
| `VM_PRIVATE_KEY` | SSH private key content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `VM_PORT` | SSH port (optional) | `22` |
| `JWT_SECRET` | JWT secret key | `your-jwt-secret` |
| `EMAIL_USER` | SMTP email | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP password | `your-app-password` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-api-key` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id` |
| `POSTGRES_URI` | Database connection string | `postgresql://user:pass@host:5432/db` |

### 2. SSH Key Setup

On your local machine:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"

# Copy public key to VM
ssh-copy-id -i ~/.ssh/id_rsa.pub username@your-vm-ip

# Add private key content to GitHub secrets as VM_PRIVATE_KEY
cat ~/.ssh/id_rsa
```

### 3. Repository Setup

The CI/CD pipeline (`.github/workflows/build.yml`) will:
1. Run tests on every push/PR
2. Build Docker images
3. Deploy to VM on main branch pushes
4. Verify deployment health

## 📱 Application Access

After successful deployment:
- **Frontend**: `http://YOUR-VM-IP`
- **Backend API**: `http://YOUR-VM-IP:4000`

## 🔧 Management Commands

### Using the deployment script:
```bash
./deploy.sh deploy    # Deploy application
./deploy.sh logs      # View logs
./deploy.sh status    # Check status
./deploy.sh restart   # Restart services
./deploy.sh stop      # Stop services
```

### Using Docker Compose directly:
```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update and restart
git pull origin main
docker-compose up -d --build
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port already in use:**
```bash
sudo lsof -i :80
sudo lsof -i :4000
# Kill processes if needed
```

2. **Database connection issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

3. **Docker build fails:**
```bash
# Clean up Docker
docker system prune -a
# Rebuild without cache
docker-compose build --no-cache
```

4. **Container health check failing:**
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
```

### Log Locations:
- Application logs: `docker-compose logs`
- System logs: `/var/log/syslog`
- PostgreSQL logs: `/var/log/postgresql/`

## 🔒 Security Considerations

1. **Change default passwords** in production
2. **Use environment-specific secrets**
3. **Enable SSL/HTTPS** for production
4. **Regular security updates**
5. **Backup your data** regularly

## 📈 Monitoring

### Basic Monitoring:
```bash
# Check system resources
htop
df -h
free -h

# Monitor Docker containers
docker stats

# Check application health
curl http://localhost:4000/
curl http://localhost/
```

### Log Monitoring:
```bash
# Real-time logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Frontend logs only
docker-compose logs -f frontend
```

## 🔄 Updates and Maintenance

### Regular Updates:
1. Pull latest code: `git pull origin main`
2. Rebuild containers: `docker-compose up -d --build`
3. Clean up old images: `docker system prune -f`

### Backup Strategy:
```bash
# Backup uploads
docker run --rm -v studdybuddy_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz /data

# Backup database
pg_dump -h localhost -U postgres postgres > backup-$(date +%Y%m%d).sql
```

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Check system resources: `htop`, `df -h`
4. Review this documentation
5. Check GitHub Issues for similar problems
