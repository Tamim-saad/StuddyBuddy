# StuddyBuddy Planner Feature Setup Guide

## Overview
The StuddyBuddy Planner is a comprehensive task and study session management system that allows users to:

- ✅ Create and manage study tasks with priorities, tags, and descriptions
- 📅 View tasks in calendar, list, and weekly views
- ⏰ Schedule study sessions with start/end times
- 🍅 Pomodoro timer integration for focused study sessions
- 🔗 Link tasks to existing resources (PDFs, quizzes, flashcards)
- 🎯 Get auto-suggested tasks based on saved content
- 🏷️ Organize tasks with tags and priority levels

## Database Setup

### 1. Create the Database Table

Run the following SQL script to create the required database table:

```bash
# Navigate to backend directory
cd StuddyBuddy/backend

# Run the SQL script
psql -d your_database_name -f database/create_planner_table.sql
```

Or execute the SQL directly:

```sql
-- Create planner_tasks table
CREATE TABLE IF NOT EXISTS planner_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    resource_id INTEGER REFERENCES chotha(id) ON DELETE SET NULL,
    task_type VARCHAR(20) NOT NULL DEFAULT 'task' CHECK (task_type IN ('task', 'session', 'quiz', 'flashcard', 'study')),
    pomodoro_enabled BOOLEAN DEFAULT FALSE,
    pomodoro_duration INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_id ON planner_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_start_time ON planner_tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_status ON planner_tasks(status);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_priority ON planner_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_resource_id ON planner_tasks(resource_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_tags ON planner_tasks USING GIN(tags);
```

### 2. Verify Installation

Test the planner API endpoints:

```bash
# Test creating a task
curl -X POST http://localhost:5000/api/planner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Study Chapter 3 - Biology",
    "description": "Review cell structure and functions",
    "priority": "high",
    "tags": ["Biology", "Chapter 3"],
    "start_time": "2024-01-10T09:00:00Z",
    "end_time": "2024-01-10T10:00:00Z",
    "task_type": "study"
  }'

# Test getting tasks
curl -X GET http://localhost:5000/api/planner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Features Implemented

### Backend Components
- **`/api/planner`** - Complete CRUD API for planner tasks
- **Database schema** - Robust table with indexes and constraints
- **Auto-suggestions** - Task suggestions based on saved quizzes/flashcards
- **Filtering & Pagination** - Query tasks by date, priority, status, tags

### Frontend Components
- **`PlannerDashboard`** - Main planner interface with stats and views
- **`CalendarView`** - Monthly calendar with task visualization
- **`TaskList`** - List view with filters and status management
- **`TaskModal`** - Full-featured task creation/editing modal
- **`SuggestedTasks`** - Shows auto-generated task suggestions
- **`PomodoroTimer`** - Focus timer for study sessions

### Key Features
1. **Task Management**
   - Create, edit, delete tasks
   - Set priority (High/Medium/Low)
   - Add tags for organization
   - Link to resources (PDFs, quizzes, etc.)

2. **Calendar Integration**
   - Monthly calendar view
   - Color-coded by priority
   - Click dates to view/create tasks
   - Drag & drop support (can be extended)

3. **Study Sessions**
   - Schedule study blocks with time ranges
   - Pomodoro timer integration
   - Session progress tracking

4. **Smart Suggestions**
   - Auto-suggest tasks based on:
     - Recently created quizzes
     - Saved flashcards/sticky notes
     - User study patterns

5. **Progress Tracking**
   - Task status (Pending/In Progress/Completed)
   - Daily/weekly/monthly statistics
   - Completion tracking

## Usage

### Accessing the Planner
1. Navigate to `/home/planner` in the application
2. Click "Planner" in the sidebar navigation

### Creating Tasks
1. Click the blue "+" button
2. Fill in task details:
   - Title (required)
   - Description
   - Priority level
   - Tags
   - Start/end times
   - Link to resources
   - Enable Pomodoro if needed

### Managing Tasks
- **Calendar View**: Click on dates to see tasks, click tasks to edit
- **List View**: See all tasks with filters, quick status changes
- **Week View**: Weekly calendar perspective

### Using Pomodoro Timer
1. Enable Pomodoro when creating/editing a task
2. Set duration (1-120 minutes)
3. Click the play button on a task to start timer
4. Use Start/Pause/Stop controls

### Auto-Suggestions
- Automatically shows suggested tasks based on your saved content
- Click "+" on any suggestion to create a task from it
- Suggestions refresh based on recent activity

## Integration Points

### With Existing Features
- **File Uploads**: Tasks can link to uploaded PDFs
- **Quizzes**: Auto-suggest quiz review tasks
- **Sticky Notes**: Auto-suggest flashcard review tasks
- **User Authentication**: All tasks are user-specific

### API Integration
```javascript
// Frontend service usage
import { plannerService } from '../services/plannerService';

// Create task
const newTask = await plannerService.createTask({
  title: "Study Biology",
  start_time: "2024-01-10T09:00:00Z",
  priority: "high"
});

// Get tasks with filters
const tasks = await plannerService.getTasks({
  start_date: "2024-01-10",
  end_date: "2024-01-17",
  priority: "high"
});
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify PostgreSQL is running
   - Check `POSTGRES_URI` environment variable
   - Ensure user has CREATE TABLE permissions

2. **Frontend rendering issues**
   - Clear browser cache
   - Check console for JavaScript errors
   - Verify all dependencies are installed

3. **API authentication errors**
   - Ensure JWT token is valid
   - Check token expiration
   - Verify user permissions

### Performance Optimization
- Database indexes are pre-configured for optimal query performance
- Frontend uses React state management for smooth UX
- Pagination limits large task lists
- Efficient date filtering in calendar views

## Future Enhancements

Potential improvements that can be added:
- Drag & drop calendar functionality
- Recurring task support
- Task templates
- Team collaboration features
- Integration with external calendars
- Mobile app support
- Advanced analytics and insights
- Email/notification reminders

## Files Modified/Created

### Backend
- `routes/plannerRoutes.js` - New API routes
- `database/create_planner_table.sql` - Database schema
- `app.js` - Added planner routes

### Frontend
- `services/plannerService.js` - API service layer
- `components/planner/` - All planner components
- `router/AppRouter.jsx` - Added planner route
- `services/index.js` - Export planner service

The planner feature is now fully integrated and ready to use! 