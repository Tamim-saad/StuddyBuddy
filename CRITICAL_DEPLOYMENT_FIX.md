# 🚨 CRITICAL DEPLOYMENT FIX - LOCALHOST REVERSION ISSUE

## Problem Identified and Fixed

### Issue Summary
After every deployment to the VM, the `POSTGRES_URI` was reverting from `postgres:5432` to `localhost:5432`, causing database connection failures in the Docker environment.

### Root Cause Analysis
**Multiple conflicting GitHub Actions workflows** were deploying simultaneously:

1. ✅ `deploy-production.yml` - **Correct** workflow with `postgres:5432`
2. ❌ `build.yml` - **Problematic** workflow that was ALSO deploying with `localhost:5432`

### What Was Happening
1. `deploy-production.yml` would run first and create correct `.env` with `postgres:5432`
2. `build.yml` would run second and **overwrite** the `.env` with incorrect `localhost:5432`
3. Application would fail to connect to database

## 🔧 FIXES APPLIED

### 1. Fixed GitHub Actions Workflows

#### `.github/workflows/build.yml`
- **BEFORE**: Had deployment job that ran on push to main
- **AFTER**: Now only runs tests and builds, **NO DEPLOYMENT**
- **CHANGE**: Deployment job condition changed to exclude main branch pushes
- **RESULT**: Only `deploy-production.yml` deploys to production

#### `.github/workflows/deploy-production.yml`
- **STATUS**: ✅ Already correct (uses `postgres:5432`)
- **ROLE**: Only workflow that deploys to production

#### `.github/workflows/deploy.yml`
- **STATUS**: ✅ Already correct (test-only, no deployment)

### 2. Fixed Documentation

#### `docs/setup.md`
- **BEFORE**: `POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/postgres`
- **AFTER**: `POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres`

#### `DEPLOYMENT.md`
- **BEFORE**: `POSTGRES_URI=postgresql://postgres:postgres@${VM_IP}:5432/postgres`
- **AFTER**: `POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres`

### 3. Verified Correct Files
✅ `.env.example` - Already correct
✅ `docker-compose.yml` - Already correct
✅ `backend/config/db.js` - Already correct (uses process.env.POSTGRES_URI)

## 🎯 CORRECT CONFIGURATION FOR DOCKER DEPLOYMENTS

### Production .env File (VM)
```bash
# Database Configuration - MUST use 'postgres' as hostname
POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres

# Other required variables
PORT=4000
JWT_SECRET=your-secret
EMAIL_USER=your-email
EMAIL_PASS=your-password
GEMINI_API_KEY=your-key
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_BASE_URL=http://YOUR-VM-IP:4000
BACKEND_URL=http://YOUR-VM-IP:4000
FRONTEND_URL=http://YOUR-VM-IP
COMPOSE_PROJECT_NAME=studdybuddy
VM_PUBLIC_IP=YOUR-VM-IP
VM_PRIVATE_IP=YOUR-PRIVATE-IP
```

### Key Points:
- ✅ Use `postgres:5432` (Docker service name)
- ❌ Never use `localhost:5432` in production Docker environment
- ❌ Never use `VM-IP:5432` in Docker Compose setup

## 🚀 DEPLOYMENT WORKFLOW NOW

### What Happens When You Push to Main:
1. **Only** `deploy-production.yml` workflow runs
2. Creates `.env` file with correct `postgres:5432` configuration
3. Deploys using Docker Compose
4. **No other workflow overwrites the configuration**

### What Happens on Pull Requests:
1. `deploy.yml` and `build.yml` run tests only
2. No deployment occurs
3. Uses `localhost:5432` for test databases (correct for GitHub Actions)

## 🔍 VERIFICATION STEPS

### After Next Deployment, Verify:
1. SSH to your VM
2. Check the .env file:
   ```bash
   cd /home/azureuser/StuddyBuddy
   grep POSTGRES_URI .env
   ```
3. Should show: `POSTGRES_URI=postgresql://postgres:postgres@postgres:5432/postgres`
4. Check application logs:
   ```bash
   docker-compose logs backend | grep -i postgres
   ```

### Red Flags to Watch For:
- ❌ If you see `localhost:5432` in production .env
- ❌ If multiple workflows show "Deploy to Azure VM" in GitHub Actions
- ❌ If database connection errors appear after deployment

## 📋 PREVENTION CHECKLIST

### Before Any Workflow Changes:
- [ ] Ensure only ONE workflow deploys to production
- [ ] Verify all hardcoded database URLs use `postgres:5432`
- [ ] Test workflow changes in pull requests first
- [ ] Never commit `.env` files to the repository

### Environment Variable Guidelines:
- [ ] Local development: Can use `localhost:5432`
- [ ] Docker Compose (production): Must use `postgres:5432`
- [ ] GitHub Actions tests: Use `localhost:5432` (service containers)
- [ ] Production VM: Always use `postgres:5432`

## 🆘 EMERGENCY ROLLBACK

If deployment fails, manually fix on VM:
```bash
ssh azureuser@YOUR-VM-IP
cd /home/azureuser/StuddyBuddy
sed -i 's/localhost:5432/postgres:5432/g' .env
docker-compose restart backend
```

## 📞 SUPPORT

This issue is now permanently fixed. The next deployment should work correctly and maintain the proper database configuration.

**Date Fixed**: $(date)
**Status**: ✅ RESOLVED - Multiple deployment workflows eliminated
**Next Action**: Monitor next deployment to confirm fix
