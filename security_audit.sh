#!/bin/bash

# Security audit script for environment variable and secret management
# Ensures no hardcoded secrets and proper environment variable usage

echo "🔒 Starting Security Audit for Environment Variables and Secrets..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "SUCCESS") echo -e "${GREEN}✅ $2${NC}" ;;
        "ERROR") echo -e "${RED}❌ $2${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $2${NC}" ;;
    esac
}

# Define patterns that might indicate hardcoded secrets
SENSITIVE_PATTERNS=(
    "password.*=.*['\"][^'\"]*['\"]"
    "secret.*=.*['\"][^'\"]*['\"]"
    "key.*=.*['\"][^'\"]*['\"]"
    "token.*=.*['\"][^'\"]*['\"]"
    "api_key.*=.*['\"][^'\"]*['\"]"
    "client_secret.*=.*['\"][^'\"]*['\"]"
    "private_key.*=.*['\"][^'\"]*['\"]"
    "localhost"
    "127\.0\.0\.1"
    "postgresql://.*@.*:"
)

# Directories to check
CHECK_DIRS=(
    "/home/pridesys/Desktop/StuddyBuddy/backend"
    "/home/pridesys/Desktop/StuddyBuddy/frontend/src"
    "/home/pridesys/Desktop/StuddyBuddy/.github"
)

# Files to exclude from checks
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "coverage"
    "build"
    "dist"
    "uploads"
    "*.log"
    "*.lock"
    "*.min.js"
    "test_*"
    "security_audit.sh"
)

# Function to check for hardcoded secrets in files
check_hardcoded_secrets() {
    print_status "INFO" "Checking for hardcoded secrets..."
    
    local found_issues=0
    
    for dir in "${CHECK_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            print_status "INFO" "Scanning directory: $dir"
            
            # Find all relevant files
            find "$dir" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) \
                ! -path "*/node_modules/*" \
                ! -path "*/.git/*" \
                ! -path "*/coverage/*" \
                ! -path "*/build/*" \
                ! -path "*/dist/*" \
                ! -name "*.min.js" \
                ! -name "package-lock.json" | while read -r file; do
                
                # Check each sensitive pattern
                for pattern in "${SENSITIVE_PATTERNS[@]}"; do
                    if grep -i -E "$pattern" "$file" >/dev/null 2>&1; then
                        # Get the actual line for context
                        local matches=$(grep -i -E -n "$pattern" "$file" | head -3)
                        print_status "WARNING" "Potential hardcoded secret in $file:"
                        echo "   $matches"
                        found_issues=$((found_issues + 1))
                    fi
                done
            done
        fi
    done
    
    if [ $found_issues -eq 0 ]; then
        print_status "SUCCESS" "No obvious hardcoded secrets found"
    else
        print_status "ERROR" "Found $found_issues potential hardcoded secret(s) - please review"
    fi
    
    return $found_issues
}

# Function to check environment variable usage
check_env_usage() {
    print_status "INFO" "Checking environment variable usage..."
    
    # Check backend config files
    if [ -f "/home/pridesys/Desktop/StuddyBuddy/backend/config/appConfig.js" ]; then
        if grep -q "process\.env\." "/home/pridesys/Desktop/StuddyBuddy/backend/config/appConfig.js"; then
            print_status "SUCCESS" "Backend config uses process.env"
        else
            print_status "ERROR" "Backend config may not be using environment variables"
        fi
    fi
    
    if [ -f "/home/pridesys/Desktop/StuddyBuddy/backend/config/db.js" ]; then
        if grep -q "process\.env\.POSTGRES_URI" "/home/pridesys/Desktop/StuddyBuddy/backend/config/db.js"; then
            print_status "SUCCESS" "Database config uses POSTGRES_URI from environment"
        else
            print_status "ERROR" "Database config may not be using POSTGRES_URI from environment"
        fi
    fi
    
    # Check frontend environment usage
    local frontend_env_usage=0
    find "/home/pridesys/Desktop/StuddyBuddy/frontend/src" -name "*.js" -o -name "*.jsx" | xargs grep -l "process\.env\." 2>/dev/null | while read -r file; do
        print_status "SUCCESS" "Frontend file uses environment variables: $(basename "$file")"
        frontend_env_usage=$((frontend_env_usage + 1))
    done
}

# Function to check GitHub workflows for secrets
check_github_workflows() {
    print_status "INFO" "Checking GitHub workflows for proper secret usage..."
    
    local workflow_dir="/home/pridesys/Desktop/StuddyBuddy/.github/workflows"
    
    if [ -d "$workflow_dir" ]; then
        find "$workflow_dir" -name "*.yml" -o -name "*.yaml" | while read -r workflow; do
            print_status "INFO" "Checking workflow: $(basename "$workflow")"
            
            # Check for secrets usage
            if grep -q "secrets\." "$workflow"; then
                print_status "SUCCESS" "Workflow uses GitHub secrets"
            else
                print_status "WARNING" "Workflow may not be using GitHub secrets"
            fi
            
            # Check for hardcoded values in sensitive contexts
            if grep -i -E "(password|secret|key|token).*:" "$workflow" | grep -v "secrets\." >/dev/null; then
                print_status "WARNING" "Potential hardcoded values in workflow: $(basename "$workflow")"
                grep -i -E "(password|secret|key|token).*:" "$workflow" | grep -v "secrets\."
            fi
        done
    else
        print_status "WARNING" "No GitHub workflows directory found"
    fi
}

# Function to check .env file configuration
check_env_file() {
    print_status "INFO" "Checking .env file configuration..."
    
    local env_file="/home/pridesys/Desktop/StuddyBuddy/.env"
    
    if [ -f "$env_file" ]; then
        print_status "SUCCESS" ".env file exists"
        
        # Check critical environment variables
        local required_vars=(
            "POSTGRES_URI"
            "JWT_SECRET"
            "REACT_APP_BASE_URL"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$env_file"; then
                print_status "SUCCESS" "$var is configured"
                
                # Check if POSTGRES_URI uses correct hostname
                if [ "$var" = "POSTGRES_URI" ]; then
                    if grep -q "POSTGRES_URI=.*@postgres:" "$env_file"; then
                        print_status "SUCCESS" "POSTGRES_URI uses correct Docker hostname 'postgres'"
                    elif grep -q "POSTGRES_URI=.*@localhost:" "$env_file"; then
                        print_status "ERROR" "POSTGRES_URI uses localhost instead of postgres (Docker issue)"
                    fi
                fi
            else
                print_status "ERROR" "$var is not configured in .env file"
            fi
        done
    else
        print_status "ERROR" ".env file not found"
    fi
    
    # Check .env.example
    if [ -f "/home/pridesys/Desktop/StuddyBuddy/.env.example" ]; then
        print_status "SUCCESS" ".env.example file exists for documentation"
    else
        print_status "WARNING" ".env.example file not found (recommended for documentation)"
    fi
}

# Function to check .gitignore for sensitive files
check_gitignore() {
    print_status "INFO" "Checking .gitignore for sensitive file exclusions..."
    
    local gitignore_file="/home/pridesys/Desktop/StuddyBuddy/.gitignore"
    
    if [ -f "$gitignore_file" ]; then
        local sensitive_patterns=(".env" "*.pem" "*.key" "*.p12" "config.json")
        
        for pattern in "${sensitive_patterns[@]}"; do
            if grep -q "$pattern" "$gitignore_file"; then
                print_status "SUCCESS" "$pattern is excluded in .gitignore"
            else
                print_status "WARNING" "$pattern should be excluded in .gitignore"
            fi
        done
    else
        print_status "WARNING" ".gitignore file not found"
    fi
}

# Main function
main() {
    echo "========================================"
    echo "🔒 Security Audit Report"
    echo "========================================"
    
    # Test 1: Check for hardcoded secrets
    print_status "INFO" "Test 1: Hardcoded Secrets Check"
    check_hardcoded_secrets
    echo ""
    
    # Test 2: Environment variable usage
    print_status "INFO" "Test 2: Environment Variable Usage"
    check_env_usage
    echo ""
    
    # Test 3: GitHub workflows
    print_status "INFO" "Test 3: GitHub Workflow Security"
    check_github_workflows
    echo ""
    
    # Test 4: .env file configuration
    print_status "INFO" "Test 4: Environment File Configuration"
    check_env_file
    echo ""
    
    # Test 5: .gitignore security
    print_status "INFO" "Test 5: .gitignore Security"
    check_gitignore
    echo ""
    
    echo "========================================"
    echo "📋 Security Audit Summary"
    echo "========================================"
    print_status "INFO" "Security audit completed!"
    print_status "INFO" "Review any warnings or errors above"
    print_status "INFO" "Ensure all secrets are managed via environment variables"
    print_status "INFO" "Never commit .env files or hardcode sensitive values"
}

# Run the audit
main
