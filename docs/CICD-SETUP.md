# StuddyBuddy CI/CD Setup Guide

## Overview
This guide will help you set up continuous integration and deployment for StuddyBuddy using GitHub Actions and Azure VM.

## Prerequisites

### 1. Azure VM Setup
- ✅ Ubuntu 20.04+ VM with 2+ GB RAM
- ✅ Public IP: YOUR-VM-PUBLIC-IP (configured)
- ✅ PostgreSQL installed and running
- ✅ Docker & Docker Compose installed

### 2. GitHub Repository Secrets
You need to configure the following secrets in your GitHub repository:

**Go to: Repository → Settings → Secrets and variables → Actions**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AZURE_VM_USERNAME` | Your VM username | `azureuser` |
| `AZURE_VM_PRIVATE_KEY` | SSH private key for VM access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `JWT_SECRET` | JWT secret for authentication | `your-super-secret-jwt-key-here` |
| `EMAIL_USER` | Email for notifications | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | `your-email-app-password` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key-here` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id.apps.googleusercontent.com` |

## Setup Instructions

### Step 1: Configure SSH Access
1. Generate SSH key pair (if not already done):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   ```

2. Copy public key to your Azure VM:
   ```bash
   ssh-copy-id username@YOUR-VM-PUBLIC-IP
   ```

3. Add the private key content to GitHub secrets as `AZURE_VM_PRIVATE_KEY`

### Step 2: Configure Azure VM

#### Install Docker (if not installed):
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### Install Docker Compose:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Setup PostgreSQL (if not setup):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb postgres
```

#### Configure Firewall:
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 4000  # Backend API
sudo ufw enable
```

### Step 3: Test Local Deployment

1. Clone your repository:
   ```bash
   git clone https://github.com/Tamim-saad/StuddyBuddy.git
   cd StuddyBuddy
   ```

2. Make deploy script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run deployment:
   ```bash
   ./deploy.sh
   ```

### Step 4: Configure GitHub Actions

The workflow will automatically:
- ✅ Run tests on every push
- ✅ Build Docker images
- ✅ Deploy to Azure VM on main branch
- ✅ Perform health checks

## Deployment Process

### Automatic Deployment (Recommended)
1. Push code to `main` branch
2. GitHub Actions will automatically deploy
3. Check deployment status at: http://YOUR-VM-PUBLIC-IP

### Manual Deployment
```bash
# On your Azure VM
cd StuddyBuddy
./deploy.sh
```

## Monitoring & Troubleshooting

### Check Application Status:
```bash
./deploy.sh status
```

### View Logs:
```bash
./deploy.sh logs
```

### Restart Services:
```bash
./deploy.sh restart
```

### Health Check URLs:
- Frontend: http://YOUR-VM-PUBLIC-IP
- Backend API: http://YOUR-VM-PUBLIC-IP:4000
- Health endpoint: http://YOUR-VM-PUBLIC-IP:4000/health

## Database Considerations

**Using PostgreSQL on the same VM is perfectly fine for:**
- Small to medium applications
- Development and staging environments
- Applications with < 10,000 users

**Benefits:**
- ✅ Simple setup and management
- ✅ No network latency between app and DB
- ✅ Cost-effective
- ✅ Easy to backup and maintain

**Consider separate database service when:**
- High availability requirements
- Large scale (>10k concurrent users)
- Multiple application instances

## Security Best Practices

1. **Environment Variables**: All sensitive data is stored in GitHub secrets
2. **SSH Access**: Key-based authentication only
3. **Firewall**: Only necessary ports are open
4. **Docker**: Containers run as non-root users
5. **HTTPS**: Consider adding SSL certificate for production

## Performance Optimization

1. **Docker Images**: Multi-stage builds for smaller images
2. **Caching**: NPM packages cached in GitHub Actions
3. **Health Checks**: Proper health checks for zero-downtime deployments
4. **Logging**: Centralized logging with rotation

## Next Steps (Optional Improvements)

1. **SSL Certificate**: Add Let's Encrypt for HTTPS
2. **Monitoring**: Add monitoring with Prometheus/Grafana
3. **Backup**: Automated database backups
4. **CDN**: Use Azure CDN for static assets
5. **Load Balancer**: If scaling to multiple instances

## Quick Commands Reference

```bash
# Deploy application
./deploy.sh

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart services
./deploy.sh restart

# Stop services
./deploy.sh stop

# Help
./deploy.sh help
```

Your setup is production-ready and follows industry best practices! 🚀
