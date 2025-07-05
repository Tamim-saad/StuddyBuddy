# GitHub Repository Secrets Setup

This document lists all the required GitHub repository secrets for auto-deployment to work properly.

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret listed below

## Required Secrets

### 🖥️ **VM Configuration**
```
AZURE_VM_IP = 135.235.137.78
VM_HOST = 135.235.137.78
VM_USER = azureuser
```

### 🔐 **SSH Access**
```
VM_SSH_KEY = [Your complete private SSH key content from studdybuddy_key.pem]
```
**Note**: Copy the entire content of your `studdybuddy_key.pem` file including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines.

### 🔑 **Authentication & Security**
```
JWT_SECRET = your-jwt-secret-here
```

### 📧 **Email Configuration**
```
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-app-password-here
```

### 🤖 **AI API Keys**
```
GEMINI_API_KEY = your-gemini-api-key-here
OPENAI_API_KEY = your-openai-api-key-here
```

### 🔐 **OAuth Configuration**
```
REACT_APP_GOOGLE_CLIENT_ID = your-google-client-id-here
```

## ✅ Verification

After adding all secrets, you can verify by:

1. **Checking the secrets list**: All 10 secrets should be visible in your repository settings
2. **Test deployment**: Push a commit to main branch and watch the GitHub Actions deployment
3. **Manual trigger**: Use "Run workflow" button in Actions tab

## 🚨 Security Notes

- Never commit these values to your repository
- Regularly rotate API keys and passwords
- Keep your SSH private key secure
- Use environment-specific values for different deployments

## 📋 Secrets Checklist

- [ ] AZURE_VM_IP
- [ ] VM_HOST  
- [ ] VM_USER
- [ ] VM_SSH_KEY
- [ ] JWT_SECRET
- [ ] EMAIL_USER
- [ ] EMAIL_PASS
- [ ] GEMINI_API_KEY
- [ ] OPENAI_API_KEY
- [ ] REACT_APP_GOOGLE_CLIENT_ID

**Total: 10 secrets required**
