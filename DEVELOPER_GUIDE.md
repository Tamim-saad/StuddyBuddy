# Developer Guide - StuddyBuddy

Welcome to StuddyBuddy! This guide will help you get started with development, local setup, and deployment.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **Google Cloud Account** (for Gemini AI API)
- **Qdrant Cloud Account** (for vector database)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd StuddyBuddy
```

### 2. Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:
```bash
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=studdybuddy

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Qdrant Vector Database
QDRANT_URL=your_qdrant_cluster_url
QDRANT_API_KEY=your_qdrant_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Get Required API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

#### Qdrant Vector Database
1. Sign up at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a new cluster
3. Get your cluster URL and API key
4. Add them to your `.env` file

## 🛠️ Local Development

### Option 1: Using Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
npm install
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Database Setup

The application uses MySQL. You can either:

1. **Use Docker MySQL** (included in docker-compose.yml)
2. **Install MySQL locally**
3. **Use a cloud MySQL service**

Run the SQL setup script:
```bash
mysql -u your_user -p your_database < create_quiz_tables.sql
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
StuddyBuddy/
├── backend/                 # Node.js/Express API
│   ├── app.js              # Main application file
│   ├── server.js           # Server configuration
│   ├── config/             # Configuration files
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── tests/              # Backend tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── views/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static files
├── docker-compose.yml      # Docker services
├── .env.example           # Environment variables template
└── README.md              # Project overview
```

## 🚀 Deployment

### Local Deployment with Docker

```bash
# Production build
docker-compose -f docker-compose.yml up --build -d

# Check logs
docker-compose logs -f
```

### Deploy to Your Own Server

#### 1. Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional, for SSL)

#### 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Clone your repository
git clone <your-repo-url>
cd StuddyBuddy

# Set up environment
cp .env.example .env
nano .env  # Edit with your production values
```

#### 3. Production Environment Variables

Update your `.env` file with production values:

```bash
# Use your production database
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=studdybuddy_prod

# Strong JWT secret
JWT_SECRET=your_very_secure_jwt_secret_for_production

# Your domain
FRONTEND_URL=https://yourdomain.com
```

#### 4. Deploy

```bash
# Build and start services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Deploy to Cloud Platforms

#### AWS/Azure/GCP

1. **Set up a virtual machine** (Ubuntu 20.04+)
2. **Configure security groups** to allow ports 80, 443, 3000, 3001
3. **Follow the server setup steps** above
4. **Set up SSL certificate** (using Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

#### Using GitHub Actions (CI/CD)

The project includes GitHub Actions workflow for automated deployment:

1. **Set up GitHub Secrets**:
   - `SSH_HOST`: Your server IP
   - `SSH_USERNAME`: Your server username
   - `SSH_KEY`: Your private SSH key
   - `GEMINI_API_KEY`: Your Gemini API key
   - `QDRANT_URL`: Your Qdrant cluster URL
   - `QDRANT_API_KEY`: Your Qdrant API key

2. **Push to main branch** to trigger deployment

## 🔧 Development Tips

### Code Style
- Use consistent indentation (2 spaces)
- Follow React best practices
- Use meaningful commit messages

### API Development
- All API endpoints are prefixed with `/api`
- Use appropriate HTTP status codes
- Validate input data
- Handle errors gracefully

### Frontend Development
- Use functional components with hooks
- Implement proper error boundaries
- Use React Router for navigation
- Style with Tailwind CSS

### Database
- Use parameterized queries to prevent SQL injection
- Create migrations for schema changes
- Index frequently queried columns

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :3000  # Check what's using port 3000
   sudo kill -9 <PID>  # Kill the process
   ```

2. **Database connection failed**
   - Check your database credentials in `.env`
   - Ensure MySQL is running
   - Check firewall settings

3. **API key errors**
   - Verify your Gemini API key is correct
   - Check Qdrant cluster URL and API key
   - Ensure keys have proper permissions

4. **Docker issues**
   ```bash
   # Clean up Docker
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# View individual service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🆘 Need Help?

- Check the main README.md for project overview
- Review the existing code for patterns
- Check the issues section for known problems
- Create a new issue if you find a bug

## 📊 Performance Monitoring

### Monitor Application Health

```bash
# Check service status
docker-compose ps

# Monitor resource usage
docker stats

# Check application logs
docker-compose logs -f --tail=100
```

### Database Monitoring

```bash
# Connect to database
docker-compose exec db mysql -u root -p

# Check database size
SELECT table_schema AS "Database", 
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "Size (MB)" 
FROM information_schema.tables 
GROUP BY table_schema;
```

Happy coding! 🎉
