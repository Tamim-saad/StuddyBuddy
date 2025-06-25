# 📚 StuddyBuddy

A modern study companion application built with React and Node.js, deployed on Azure.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd StuddyBuddy
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Run with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Frontend: http://localhost
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/health

## 📁 Project Structure

```
StuddyBuddy/
├── frontend/           # React application
├── backend/            # Node.js API server
├── docs/              # Documentation
├── docker-compose.yml # Docker configuration
├── deploy.sh          # Deployment script
└── SECURITY.md        # Security guidelines
```

## 🛠️ Development

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

Quick deploy to production:
```bash
./deploy.sh
```

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Security Guidelines](SECURITY.md)
- [Technical Documentation](docs/)

## 🔒 Security

⚠️ **Important**: Review `SECURITY.md` before deploying to production.

## 🏗️ Built With

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Deployment**: Docker, Azure VM
- **Authentication**: JWT, Google OAuth

## 📄 License

This project is licensed under the MIT License.
