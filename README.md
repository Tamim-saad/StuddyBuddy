# 📚 StuddyBuddy - AI-Powered Learning Platform

StuddyBuddy is an intelligent study companion that helps students and learners create quizzes, generate sticky notes, and annotate PDF documents using AI technology. Built with React, Node.js, and powered by Google's Gemini AI.

## ✨ Features

### 🎯 **AI-Powered Quiz Generation**
- **Multiple Choice Questions (MCQ)**: Generate contextual MCQs from uploaded documents
- **Creative Questions (CQ)**: Create open-ended questions that test deep understanding
- **Smart Scoring**: AI-powered evaluation for creative answers
- **Save & Review**: Save generated quizzes for later review
- **Instant Generation**: Generate quizzes directly from PDF chatbot

### 📝 **Smart Sticky Notes**
- **Auto-Generation**: Create study flashcards from document content
- **Tagging System**: Organize notes with relevant tags
- **Importance Levels**: Categorize notes by importance (High/Medium/Low)
- **Flip Cards**: Interactive front/back flashcard experience
- **Quick Access**: Generate notes instantly via PDF assistant

### 📅 **Study Planner & Task Management**
- **Task Creation**: Create and organize study tasks with priorities, tags, and descriptions
- **Calendar Views**: Monthly, weekly, and list views for task visualization
- **Smart Scheduling**: Schedule study sessions with start/end times
- **Progress Tracking**: Track task status (Pending/In Progress/Completed)
- **Pomodoro Timer**: Built-in focus timer for productive study sessions
- **Auto-Suggestions**: Get AI-suggested tasks based on your study materials
- **Resource Linking**: Connect tasks to uploaded PDFs, quizzes, and notes
- **Priority Management**: Organize tasks by High/Medium/Low priority levels

### 🤖 **PDF AI Chatbot**
- **Interactive Chat**: Ask questions about your uploaded documents
- **Smart Responses**: Get contextual answers based on document content
- **Quick Actions**: Generate summaries, quizzes, and sticky notes with one click
- **Document Analysis**: AI-powered understanding of PDF content
- **Chat History**: Maintain conversation context throughout sessions

### 📊 **Dashboard & Analytics**
- **Unified Overview**: Comprehensive view of all your study materials
- **Study Statistics**: Track your learning progress and activities
- **File Management**: Visual overview of uploaded documents and their status
- **Quiz Performance**: Monitor quiz results and improvement trends
- **Task Reminders**: See upcoming tasks and deadlines at a glance
- **Quick Actions**: Access all features from a centralized hub

### � **Real-time Notifications**
- **Task Updates**: Get notified when tasks are created, updated, or completed
- **Smart Alerts**: Receive reminders for upcoming study sessions
- **Activity Feed**: Stay informed about all your learning activities
- **Notification Bell**: Visual indicator for unread notifications
- **Mark as Read**: Manage notification status efficiently

### 💬 **Feedback System**
- **User Feedback**: Submit suggestions and report issues directly
- **Contact Form**: Easy way to reach the development team
- **Feature Requests**: Suggest new features and improvements
- **Bug Reports**: Help improve the platform by reporting issues

### �📄 **PDF Management & Annotation**
- **Multi-Viewer Support**: Advanced PDF viewer with fallback options
- **Document Annotation**: Add highlights, notes, and comments
- **File Management**: Upload, organize, and search through documents
- **Text Extraction**: Smart content extraction for AI processing
- **AI Integration**: Seamless AI features embedded in PDF viewer

### 🔐 **User Management**
- **Google OAuth**: Secure login with Google accounts
- **User Profiles**: Personalized learning dashboard
- **File Organization**: User-specific document management
- **Session Management**: Secure authentication across all features

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
git clone https://github.com/Tamim-saad/StuddyBuddy.git
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
- `POSTGRES_URI`: PostgreSQL database connection string
- `QDRANT_URL`: Qdrant vector database URL

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

**Main Features Access:**
- **📊 Dashboard**: Central hub with overview of all activities
- **📁 File Management**: Upload and organize your study materials
- **🤖 PDF Chatbot**: Interactive AI assistant for document analysis
- **📅 Study Planner**: Task management and scheduling system
- **🎯 Quiz Generator**: AI-powered question creation
- **📝 Sticky Notes**: Smart flashcard generation
- **🔔 Notifications**: Real-time activity updates
- **💬 Feedback**: Submit suggestions and report issues

## 📱 Usage

### 1. **Upload Documents**
- Navigate to the upload section
- Upload PDF files
- Wait for automatic text extraction and indexing

### 2. **Use Study Planner**
- Access the planner from the sidebar navigation
- Create study tasks with priorities, tags, and scheduling
- Use calendar, list, or weekly views to manage tasks
- Start Pomodoro timer sessions for focused study
- Get auto-suggested tasks based on your uploaded content

### 3. **Chat with PDFs**
- Open any uploaded document
- Use the floating chat button to open the AI assistant
- Ask questions about the document content
- Generate summaries, quizzes, and notes with quick action buttons
- Get contextual responses based on the document

### 4. **Generate Quizzes**
- Select uploaded files or use the PDF chatbot
- Choose quiz type (MCQ or CQ)
- Specify number of questions
- Review and save generated quizzes
- Track your performance over time

### 5. **Create Sticky Notes**
- Select documents for note generation or use PDF assistant
- AI will create flashcards with key concepts
- Review and organize notes by importance
- Use flip-card interface for effective studying

### 6. **Monitor Your Progress**
- Check the dashboard for comprehensive overview
- View study statistics and activity summaries
- Track task completion and quiz performance
- Manage notifications and stay updated on activities

### 7. **Provide Feedback**
- Use the feedback form to suggest improvements
- Report any issues or bugs
- Request new features
- Contact the development team

### 8. **Annotate PDFs**
- Open documents in the PDF viewer
- Add highlights, comments, and annotations
- Save annotations for future reference
- Use integrated AI features while reading

## 🔧 Configuration

### Database Schema
The application automatically creates required tables:
- `users` - User accounts and profiles
- `chotha` - Uploaded files and metadata
- `quiz` - Generated quizzes and questions
- `stickynotes` - Generated study notes
- `annotations` - PDF annotations and highlights
- `planner_tasks` - Study planner tasks and scheduling
- `notification` - Real-time notifications and alerts

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

### Quiz Generation & AI Chat
- `POST /api/quiz/generate/mcq` - Generate MCQ quiz
- `POST /api/quiz/generate/cq` - Generate creative questions
- `POST /api/quiz/generate` - Generate quiz (chatbot compatible)
- `POST /api/quiz/generate-summary` - Generate PDF summary
- `POST /api/quiz/chat` - Chat with PDF content
- `POST /api/quiz/save` - Save quiz results
- `GET /api/quiz/saved` - Get saved quizzes

### Study Planner
- `GET /api/planner` - Get all tasks with filters
- `POST /api/planner` - Create new task
- `GET /api/planner/:taskId` - Get specific task
- `PUT /api/planner/:taskId` - Update task
- `DELETE /api/planner/:taskId` - Delete task
- `GET /api/planner/suggest/auto` - Get auto-suggested tasks

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

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
- Check file size limits (typically 10MB for PDFs)
- Ensure uploads directory is writable
- Verify backend is running and accessible
- Check PDF text extraction process completion

**5. Planner/Notification Issues**
- Verify database tables are created properly
- Check PostgreSQL connection and permissions
- Ensure notification table exists with correct schema
- Verify user authentication tokens are valid

**6. PDF Chatbot Not Responding**
- Check Qdrant vector database connection
- Verify document indexing completed successfully  
- Ensure GEMINI_API_KEY has sufficient quota
- Check network connectivity to AI services

**7. Performance Issues**
- Monitor database query performance
- Check Qdrant index status and memory usage
- Verify adequate server resources (RAM/CPU)
- Consider cleaning old notification/chat data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful text generation and chat capabilities
- **Qdrant** for vector search capabilities enabling semantic document search
- **React & Material-UI** for the beautiful and responsive frontend
- **Docker** for containerization and easy deployment
- **PostgreSQL** for robust data storage and management
- **Formspree** for seamless feedback form integration
- **Open Source Community** for amazing tools and libraries

## 📞 Support

For support, email tamim.saad.cse@gmail.com or create an issue in this repository.

You can also use the in-app feedback system to report issues or suggest improvements directly from the application.

---

**Made with ❤️ for learners everywhere**

*StuddyBuddy - Your AI-powered study companion for smarter, more efficient learning*
