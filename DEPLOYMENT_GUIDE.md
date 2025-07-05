# StuddyBuddy Deployment Guide

## 🚀 Auto-Deployment Setup Complete

This document outlines the current deployment configuration and how future deployments will work.

## 📋 Current Status

### ✅ Remote VM Configuration
- **VM IP**: 135.235.137.78
- **Services**: All running and healthy
  - PostgreSQL (Port: 5432)
  - Qdrant Vector DB (Port: 6333-6334)
  - Backend API (Port: 4000)
  - Frontend (Port: 80)

### ✅ Database Schema
All database tables have been updated with new fields:
- `chotha`: Added `processing_status`, `processed_at`
- `stickynotes`: Added `front`, `back`, `tags`, `importance`, `notes`, `created_at`, `title`
- `quiz`: Added `questions` (JSONB)

### ✅ Dependencies
- `pdf-parse`: For PDF processing
- `@xenova/transformers`: For AI/ML operations
- Qdrant client: For vector database operations

## 🔄 Future Deployment Process

1. **Commit changes to main branch**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Auto-deployment will trigger** and handle:
   - Pull latest code from GitHub
   - Build Docker containers
   - Run database migrations
   - Start all services
   - Health checks

## 🛠️ Local Development Setup

If you need to run locally:

1. **Install Docker and Docker Compose**
2. **Start services**:
   ```bash
   docker-compose up -d
   ```
3. **Run database migrations**:
   ```bash
   ./migrate-db.sh
   ```

## 📝 Environment Variables

The following environment variables are configured:

### AI Services
- `GEMINI_API_KEY`: Google Gemini AI
- `OPENAI_API_KEY`: OpenAI API
- `QDRANT_URL`: Vector database URL

### Database
- `POSTGRES_URI`: PostgreSQL connection string

### Authentication
- `JWT_SECRET`: JWT token secret
- `GOOGLE_CLIENT_ID`: Google OAuth client

### Email
- `EMAIL_USER`: SMTP user
- `EMAIL_PASS`: SMTP password

## 🌐 Application URLs

### Production (Remote VM)
- **Frontend**: http://135.235.137.78/
- **Backend API**: http://135.235.137.78:4000/
- **Qdrant Dashboard**: http://135.235.137.78:6333/dashboard

### Development (Local)
- **Frontend**: http://localhost:3000/
- **Backend API**: http://localhost:5000/
- **Qdrant**: http://localhost:6333/

## 🔍 Health Checks

All services include health checks:
- PostgreSQL: `pg_isready`
- Qdrant: TCP connection test
- Backend: HTTP endpoint test
- Frontend: Static file serving

## 📊 Database Migration

The `migrate-db.sh` script handles all schema updates automatically during deployment. It includes:
- Safe column additions with `IF NOT EXISTS`
- Data type constraints and defaults
- Index creation where needed

## 🚨 Troubleshooting

If deployment fails:

1. **Check service logs**:
   ```bash
   docker-compose logs [service-name]
   ```

2. **Verify environment variables**:
   ```bash
   docker-compose config
   ```

3. **Run health checks manually**:
   ```bash
   curl http://135.235.137.78:4000/
   ```

## 🔐 Security Notes

- API keys are securely stored in environment variables
- Database credentials use Docker secrets
- CORS is properly configured
- JWT tokens have secure secrets

---

**Last Updated**: July 5, 2025
**Next Steps**: Commit to main branch for auto-deployment
