
# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_BASE_URL
ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_BASE_URL=${REACT_APP_BASE_URL}
ENV REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]