# Required GitHub Repository Secrets

For the auto-deployment to work correctly, you need to configure the following secrets in your GitHub repository:

## Go to: Repository Settings → Secrets and Variables → Actions → New repository secret

### 1. Azure VM Configuration
- `AZURE_VM_IP` = `135.235.137.78`
- `VM_HOST` = `135.235.137.78` 
- `VM_USER` = `azureuser`
- `VM_SSH_KEY` = Your private SSH key content (from studdybuddy_key.pem file)

### 2. Authentication & Security
- `JWT_SECRET` = Your JWT secret for authentication
- `REACT_APP_GOOGLE_CLIENT_ID` = Your Google OAuth client ID

### 3. Email Configuration
- `EMAIL_USER` = Your email for notifications
- `EMAIL_PASS` = Your email password/app password

### 4. AI API Keys
- `GEMINI_API_KEY` = Your Google Gemini API key
- `OPENAI_API_KEY` = Your OpenAI API key

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the name and value for each secret listed above
6. Click **Add secret**

## Important Notes

- Never commit these values to your repository
- The secrets are automatically injected into the deployment process
- If deployment fails, check that all secrets are properly configured
- The .env files in your repository should not contain real secrets (they use placeholder values)

## Verification

After adding all secrets, trigger a deployment by:
1. Making any commit to the main branch
2. Pushing the changes
3. The GitHub Action will automatically deploy to your Azure VM

Check the Actions tab in your GitHub repository to monitor the deployment progress.
