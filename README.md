# 📚 StuddyBuddy - AI-Powered Learning Platform

StuddyBuddy is an intelligent study companion that helps students and learners create quizzes, generate sticky notes, and annotate PDF documents using AI technology. Built with React, Node.js, and powered by Google's Gemini AI.

## ✨ Features

### 🎯 **AI-Powered Quiz Generation**
- **Multiple Choice Questions (MCQ)**: Generate contextual MCQs from uploaded documents
- **Creative Questions (CQ)**: Create open-ended questions that test deep understanding
- **Smart Scoring**: AI-powered evaluation for creative answers
- **Save & Review**: Save generated quizzes for later review

### 📝 **Smart Sticky Notes**
- **Auto-Generation**: Create study flashcards from document content
- **Tagging System**: Organize notes with relevant tags
- **Importance Levels**: Categorize notes by importance (High/Medium/Low)
- **Flip Cards**: Interactive front/back flashcard experience

### 📄 **PDF Management & Annotation**
- **Multi-Viewer Support**: Advanced PDF viewer with fallback options
- **Document Annotation**: Add highlights, notes, and comments
- **File Management**: Upload, organize, and search through documents
- **Text Extraction**: Smart content extraction for AI processing

### 🔐 **User Management**
- **Google OAuth**: Secure login with Google accounts
- **User Profiles**: Personalized learning dashboard
- **File Organization**: User-specific document management

## 🛠️ Technology Stack

### **Frontend**
- **React 19** - Modern UI library
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **PDF.js** - PDF rendering

### **Backend**
- **Node.js & Express** - Server framework
- **PostgreSQL** - Primary database
- **Qdrant** - Vector database for semantic search
- **Google Gemini AI** - AI text generation
- **Multer** - File upload handling

### **Infrastructure**
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Azure VM** - Cloud deployment

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Docker & Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/StuddyBuddy.git
cd StuddyBuddy
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required Environment Variables:**
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `JWT_SECRET`: Random secret key for authentication
- `EMAIL_USER` & `EMAIL_PASS`: Email credentials for notifications
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth client ID

### 3. Run with Docker (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 4. Manual Setup (Alternative)
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start PostgreSQL and Qdrant (manually or via Docker)
# Update POSTGRES_URI and QDRANT_URL in .env accordingly

# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## 📱 Usage

### 1. **Upload Documents**
- Navigate to the upload section
- Upload PDF files
- Wait for automatic text extraction and indexing

### 2. **Generate Quizzes**
- Select uploaded files
- Choose quiz type (MCQ or CQ)
- Specify number of questions
- Review and save generated quizzes

### 3. **Create Sticky Notes**
- Select documents for note generation
- AI will create flashcards with key concepts
- Review and save important notes

### 4. **Annotate PDFs**
- Open documents in the PDF viewer
- Add highlights, comments, and annotations
- Save annotations for future reference

## 🔧 Configuration

### Database Schema
The application automatically creates required tables:
- `users` - User accounts and profiles
- `chotha` - Uploaded files and metadata
- `quiz` - Generated quizzes and questions
- `stickynotes` - Generated study notes
- `annotations` - PDF annotations and highlights

### AI Configuration
- **Model**: Uses Google Gemini 1.5 Flash (free tier)
- **Cost Optimization**: Limited token usage and optimized prompts
- **Fallback**: Graceful error handling for AI failures

## 🚀 Deployment

### Local Deployment
Follow the "Getting Started" section above.

### Production Deployment

#### Option 1: Azure VM (Current Setup)
1. **Provision Azure VM** with Docker support
2. **Set up GitHub Secrets**:
   - `AZURE_VM_IP`: Your VM's public IP
   - `SSH_PRIVATE_KEY`: SSH key for VM access
   - All environment variables from `.env.example`

3. **Deploy via GitHub Actions**:
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

#### Option 2: Any Docker-Supported Platform
1. **Build images**:
   ```bash
   docker-compose build
   ```

2. **Deploy to your platform** (AWS, GCP, DigitalOcean, etc.)

### Environment Variables for Production
Update these in your `.env` file:
```bash
# Production URLs
REACT_APP_BASE_URL=http://YOUR-DOMAIN:4000
BACKEND_URL=http://YOUR-DOMAIN:4000
FRONTEND_URL=http://YOUR-DOMAIN

# Database (if using external PostgreSQL)
POSTGRES_URI=postgresql://user:pass@your-db-host:5432/dbname
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth

### File Management
- `POST /api/uploads` - Upload files
- `GET /api/uploads` - List user files
- `DELETE /api/uploads/:id` - Delete file

### Quiz Generation
- `POST /api/quiz/generate/mcq` - Generate MCQ quiz
- `POST /api/quiz/generate/cq` - Generate creative questions
- `POST /api/quiz/save` - Save quiz results
- `GET /api/quiz/saved` - Get saved quizzes

### Sticky Notes
- `POST /api/stickynotes/generate` - Generate notes
- `POST /api/stickynotes/save` - Save notes
- `GET /api/stickynotes/file/:id` - Get notes for file

## 🐛 Troubleshooting

### Common Issues

**1. Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -a
docker-compose build --no-cache
```

**2. Database Connection Issues**
- Ensure PostgreSQL container is running
- Check POSTGRES_URI in .env file
- Verify network connectivity between containers

**3. AI Generation Fails**
- Verify GEMINI_API_KEY is correct
- Check API quotas and limits
- Review backend logs for specific errors

**4. File Upload Issues**
- Check file size limits
- Ensure uploads directory is writable
- Verify backend is running and accessible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful text generation
- **Qdrant** for vector search capabilities
- **React & Material-UI** for the beautiful frontend
- **Docker** for containerization
- **Open Source Community** for amazing tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue in this repository.

---

**Made with ❤️ for learners everywhere**
