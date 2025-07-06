FROM node:20-slim

WORKDIR /app

# Install curl and necessary libraries for health checks and AI libraries
RUN apt-get update && apt-get install -y \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies with better error handling
RUN npm cache clean --force && \
    npm install --omit=dev --legacy-peer-deps || \
    (echo "npm ci failed, trying npm install..." && npm install --omit=dev --legacy-peer-deps)

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Optimized healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=2 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start"]




# ----
# Development stage
# FROM node:20-alpine as development
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 4000
# CMD ["npm", "run", "dev"]

# # Test stage
# FROM development as test
# CMD ["npm", "test"]

# # Production stage
# FROM node:20-alpine as production
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --only=production
# COPY . .
# RUN apk add --no-cache curl
# EXPOSE 4000
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:4000/ || exit 1
# CMD ["npm", "start"]